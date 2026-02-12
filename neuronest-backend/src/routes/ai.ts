import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticateToken } from '../middleware/auth.js';
import { getSettings } from '../config/settings.js';

const router = Router();

const GEMINI_MODEL = 'gemini-3-flash-preview';

// Initialize Gemini client only if API key is provided
let gemini: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const aiEnabled = !!gemini;

router.use(authenticateToken);

function getGemini(): GoogleGenAI {
  if (!gemini) {
    throw new Error('AI client not configured — set GEMINI_API_KEY');
  }
  return gemini;
}

// Helper: call Gemini with a system instruction + user prompt, returning parsed JSON
async function geminiJSON(systemInstruction: string, userPrompt: string, opts?: { temperature?: number; maxOutputTokens?: number }) {
  const client = getGemini();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: opts?.temperature ?? 0.7,
      maxOutputTokens: opts?.maxOutputTokens ?? 1024,
    },
  });
  const text = response.text;
  if (!text) throw new Error('No response from Gemini');
  return JSON.parse(text);
}

function ensureSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const last = trimmed[trimmed.length - 1];
  if (['.', '!', '?'].includes(last)) return trimmed;
  return `${trimmed}.`;
}

function softenText(text: string) {
  const base = ensureSentence(text);
  if (!base) return '';
  const softened = base
    .replace(/\bneed to\b/gi, 'would love to')
    .replace(/\bcan you\b/gi, 'could you')
    .replace(/\bdo you\b/gi, 'would you be open to')
    .replace(/\bplease\b/gi, 'if you can')
    .replace(/\bASAP\b/gi, 'when you have a moment');
  if (!softened.toLowerCase().includes('if that works')) {
    return `${softened} If that works for you.`;
  }
  return softened;
}

function directText(text: string) {
  const base = ensureSentence(text);
  if (!base) return '';
  return base
    .replace(/\bjust\b/gi, '')
    .replace(/\bmaybe\b/gi, '')
    .replace(/\bkind of\b/gi, '')
    .replace(/\bi think\b/gi, '')
    .replace(/\bif you can\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// POST /explain - Explain a message with AI for neurodivergent users
router.post('/explain', async (req: Request, res: Response) => {
  try {
    if (!aiEnabled) {
      return res.status(503).json({ error: 'AI features are currently unavailable. Please contact support.' });
    }
    if (!getSettings().aiExplanationsEnabled) {
      return res.status(403).json({ error: 'AI features are disabled by admin.' });
    }

    const { message, toneTag, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are an AI assistant helping neurodivergent individuals understand social communication. 
Analyze the given message and provide:
1. The likely emotional tone (one word)
2. A confidence score (0-1) for your analysis
3. Any potential hidden meanings or subtext that might not be obvious
4. Suggestions for how to respond appropriately
5. Social cues present in the message

Be supportive, clear, and avoid assumptions. Focus on helping the user understand neurotypical communication patterns.
Respond in JSON format with keys: tone, confidence, hiddenMeanings (array), suggestions (array), socialCues (array).`;

    const userPrompt = `Message to analyze: "${message}"${toneTag ? `\nSender indicated tone: ${toneTag}` : ''}${context ? `\nConversation context: ${context}` : ''}`;

    const explanation = await geminiJSON(systemPrompt, userPrompt, { temperature: 0.7, maxOutputTokens: 1024 });

    res.json({ explanation });
  } catch (error: any) {
    console.error('AI explain error:', error);
    res.status(500).json({ error: error.message || 'AI processing failed' });
  }
});

// POST /suggestions - Get conversation suggestions
router.post('/suggestions', async (req: Request, res: Response) => {
  try {
    if (!aiEnabled) {
      return res.status(503).json({ error: 'AI features are currently unavailable. Please contact support.' });
    }
    if (!getSettings().aiExplanationsEnabled) {
      return res.status(403).json({ error: 'AI features are disabled by admin.' });
    }

    const { userInterests, myInterests, previousMessages } = req.body;

    const commonInterests = userInterests?.filter((i: string) =>
      myInterests?.includes(i)
    ) || [];

    const systemPrompt = `You are helping a neurodivergent user start or continue a conversation. 
Generate 5 natural, friendly conversation starters or responses.
Consider shared interests and make suggestions that are:
- Clear and direct (avoiding ambiguity)
- Open-ended to encourage conversation
- Respectful and appropriate
Respond as a JSON object with key "suggestions" containing an array of 5 strings.`;

    const userPrompt = `Their interests: ${userInterests?.join(', ') || 'unknown'}
My interests: ${myInterests?.join(', ') || 'unknown'}
Common interests: ${commonInterests.join(', ') || 'none identified'}
${previousMessages?.length ? `Recent messages:\n${previousMessages.slice(-3).map((m: any) => `${m.sender}: ${m.content}`).join('\n')}` : 'Starting a new conversation'}`;

    const result = await geminiJSON(systemPrompt, userPrompt, { temperature: 0.8, maxOutputTokens: 512 });

    res.json({ suggestions: result.suggestions || [] });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: error.message || 'AI processing failed' });
  }
});

// POST /compatibility - Calculate compatibility score with AI analysis
router.post('/compatibility', async (req: Request, res: Response) => {
  try {
    const { user1Traits, user1Interests, user2Traits, user2Interests } = req.body;

    const commonInterests = user1Interests?.filter((i: string) =>
      user2Interests?.includes(i)
    ) || [];

    const commonTraits = user1Traits?.filter((t: string) =>
      user2Traits?.includes(t)
    ) || [];

    // Calculate base score from overlap
    const interestOverlap = user1Interests?.length && user2Interests?.length
      ? commonInterests.length / Math.max(user1Interests.length, user2Interests.length)
      : 0;
    const traitOverlap = user1Traits?.length && user2Traits?.length
      ? commonTraits.length / Math.max(user1Traits.length, user2Traits.length)
      : 0;
    const baseScore = Math.round((interestOverlap * 0.6 + traitOverlap * 0.4) * 100);

    let analysis = 'Compatibility analysis is available when AI features are enabled.';

    // Attempt AI-powered analysis if available
    if (aiEnabled && getSettings().aiExplanationsEnabled) {
      try {
        const systemPrompt = `You are analyzing compatibility between two neurodivergent individuals for a dating app.
Consider how their traits and interests might complement each other.
Be encouraging but honest. Focus on potential connection points.
Respond as JSON with key "analysis" containing a 2-3 sentence compatibility analysis.`;

        const userPrompt = `Person 1 - Traits: ${user1Traits?.join(', ') || 'none'}, Interests: ${user1Interests?.join(', ') || 'none'}
Person 2 - Traits: ${user2Traits?.join(', ') || 'none'}, Interests: ${user2Interests?.join(', ') || 'none'}
Common interests: ${commonInterests.join(', ') || 'none'}
Common traits: ${commonTraits.join(', ') || 'none'}
Calculated compatibility score: ${baseScore}%`;

        const result = await geminiJSON(systemPrompt, userPrompt, { temperature: 0.7, maxOutputTokens: 512 });
        analysis = result.analysis || analysis;
      } catch (aiError) {
        console.error('AI compatibility analysis failed, using fallback:', aiError);
      }
    }

    res.json({
      compatibility: {
        score: baseScore,
        commonInterests,
        commonTraits,
        analysis
      }
    });
  } catch (error: any) {
    console.error('Compatibility error:', error);
    res.status(500).json({ error: error.message || 'Compatibility calculation failed' });
  }
});

// POST /summary - Summarize a conversation thread
router.post('/summary', async (req: Request, res: Response) => {
  try {
    if (!aiEnabled) {
      return res.status(503).json({ error: 'AI features are currently unavailable. Please contact support.' });
    }
    if (!getSettings().aiExplanationsEnabled) {
      return res.status(403).json({ error: 'AI features are disabled by admin.' });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const formatted = messages
      .slice(-30)
      .map((m: { sender?: string; content?: string }) => `${m.sender || 'User'}: ${m.content || ''}`)
      .join('\n');

    const systemPrompt = `You are summarizing a conversation for a neurodivergent user.
Provide a short, clear summary in 2-3 sentences and 3-5 bullet highlights of key topics or decisions.
Be neutral, supportive, and avoid assumptions.
Respond in JSON with keys: summary (string), highlights (array of strings).`;

    const summary = await geminiJSON(systemPrompt, `Conversation:\n${formatted}`, { temperature: 0.4, maxOutputTokens: 1024 });
    res.json({ summary });
  } catch (error: any) {
    console.error('AI summary error:', error);
    res.status(500).json({ error: error.message || 'AI processing failed' });
  }
});

// POST /rephrase - Suggest gentle/direct alternatives
router.post('/rephrase', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (aiEnabled && getSettings().aiExplanationsEnabled) {
    try {
      const systemPrompt = `You are helping a neurodivergent user rephrase a message. Provide two alternatives: one gentle and one direct. Keep the meaning, remove ambiguity, avoid sarcasm. Return JSON with keys gentle and direct.`;
      const result = await geminiJSON(systemPrompt, `Original message: "${message}"`, { temperature: 0.5, maxOutputTokens: 512 });
      return res.json({
        rephrase: {
          gentle: result.gentle || softenText(message),
          direct: result.direct || directText(message)
        }
      });
    } catch {
      // fall through to template-based rephrase
    }
  }

  res.json({
    rephrase: {
      gentle: softenText(message),
      direct: directText(message)
    }
  });
});

export default router;
