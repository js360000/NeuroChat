import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';
import { getSettings } from '../config/settings.js';

const router = Router();

// Initialize OpenAI only if API key is provided
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

const aiEnabled = !!openai;

router.use(authenticateToken);

function getOpenAI(): OpenAI {
  if (!openai) {
    throw new Error('AI client not configured');
  }
  return openai;
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

    const client = getOpenAI();
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

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const explanation = JSON.parse(responseContent);

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

    const client = getOpenAI();
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

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.8
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(responseContent);

    res.json({ suggestions: result.suggestions || [] });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: error.message || 'AI processing failed' });
  }
});

// POST /compatibility - Calculate compatibility score with AI analysis
router.post('/compatibility', async (req: Request, res: Response) => {
  try {
    if (!aiEnabled) {
      return res.status(503).json({ error: 'AI features are currently unavailable. Please contact support.' });
    }
    if (!getSettings().aiExplanationsEnabled) {
      return res.status(403).json({ error: 'AI features are disabled by admin.' });
    }

    const client = getOpenAI();
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

    const systemPrompt = `You are analyzing compatibility between two neurodivergent individuals for a dating app.
Consider how their traits and interests might complement each other.
Be encouraging but honest. Focus on potential connection points.
Respond as JSON with key "analysis" containing a 2-3 sentence compatibility analysis.`;

    const userPrompt = `Person 1 - Traits: ${user1Traits?.join(', ') || 'none'}, Interests: ${user1Interests?.join(', ') || 'none'}
Person 2 - Traits: ${user2Traits?.join(', ') || 'none'}, Interests: ${user2Interests?.join(', ') || 'none'}
Common interests: ${commonInterests.join(', ') || 'none'}
Common traits: ${commonTraits.join(', ') || 'none'}
Calculated compatibility score: ${baseScore}%`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.7
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(responseContent);

    res.json({
      compatibility: {
        score: baseScore,
        commonInterests,
        commonTraits,
        analysis: result.analysis || 'Compatibility analysis unavailable.'
      }
    });
  } catch (error: any) {
    console.error('AI compatibility error:', error);
    res.status(500).json({ error: error.message || 'AI processing failed' });
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

    const client = getOpenAI();
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

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Conversation:\n${formatted}` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 350,
      temperature: 0.4
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const summary = JSON.parse(responseContent);
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
      const client = getOpenAI();
      const systemPrompt = `You are helping a neurodivergent user rephrase a message. Provide two alternatives: one gentle and one direct. Keep the meaning, remove ambiguity, avoid sarcasm. Return JSON with keys gentle and direct.`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Original message: "${message}"` }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.5
      });
      const responseContent = completion.choices[0]?.message?.content;
      if (responseContent) {
        const rephrase = JSON.parse(responseContent);
        return res.json({
          rephrase: {
            gentle: rephrase.gentle || softenText(message),
            direct: rephrase.direct || directText(message)
          }
        });
      }
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
