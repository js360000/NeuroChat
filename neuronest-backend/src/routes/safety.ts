import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById, updateUser } from '../db/index.js';
import { getAppConfig } from '../config/settings.js';
import { getIO } from '../realtime.js';

const router = Router();

router.use(authenticateToken);

// ─── Trusted Contacts ───────────────────────────────────────────

// GET /safety/trusted-contacts
router.get('/trusted-contacts', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const contacts = db.trustedContacts.filter((c) => c.userId === userId);
  res.json({ contacts });
});

// POST /safety/trusted-contacts
router.post('/trusted-contacts', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, phone, email, relationship } = req.body;

  if (!name || !relationship) {
    return res.status(400).json({ error: 'Name and relationship are required' });
  }
  if (!phone && !email) {
    return res.status(400).json({ error: 'At least one of phone or email is required' });
  }

  const existing = db.trustedContacts.filter((c) => c.userId === userId);
  if (existing.length >= 5) {
    return res.status(400).json({ error: 'Maximum 5 trusted contacts allowed' });
  }

  const contact = {
    id: uuidv4(),
    userId,
    name,
    phone: phone || undefined,
    email: email || undefined,
    relationship,
    createdAt: new Date()
  };

  db.trustedContacts.push(contact);
  res.status(201).json({ contact });
});

// DELETE /safety/trusted-contacts/:id
router.delete('/trusted-contacts/:id', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const idx = db.trustedContacts.findIndex((c) => c.id === req.params.id && c.userId === userId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  db.trustedContacts.splice(idx, 1);
  res.json({ success: true });
});

// ─── Date Plans ─────────────────────────────────────────────────

// GET /safety/date-plans
router.get('/date-plans', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const plans = db.datePlans
    .filter((p) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ plans });
});

// POST /safety/date-plans
router.post('/date-plans', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { matchName, location, scheduledAt, durationMinutes, trustedContactIds, notes } = req.body;

  if (!matchName || !location || !scheduledAt || !durationMinutes) {
    return res.status(400).json({ error: 'matchName, location, scheduledAt, and durationMinutes are required' });
  }

  // Validate trusted contacts belong to this user
  const validContactIds = (trustedContactIds || []).filter((id: string) =>
    db.trustedContacts.some((c) => c.id === id && c.userId === userId)
  );

  const scheduledTime = new Date(scheduledAt);
  const checkInTime = new Date(scheduledTime.getTime() + durationMinutes * 60000);

  const plan = {
    id: uuidv4(),
    userId,
    matchName,
    location,
    scheduledAt,
    durationMinutes,
    trustedContactIds: validContactIds,
    status: 'upcoming' as const,
    checkInBy: checkInTime.toISOString(),
    notes: notes || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.datePlans.push(plan);
  res.status(201).json({ plan });
});

// PATCH /safety/date-plans/:id/check-in
router.patch('/date-plans/:id/check-in', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const plan = db.datePlans.find((p) => p.id === req.params.id && p.userId === userId);

  if (!plan) {
    return res.status(404).json({ error: 'Date plan not found' });
  }

  const { mood } = req.body;
  plan.status = 'checked-in';
  plan.checkedInAt = new Date().toISOString();
  plan.moodCheckIn = mood || undefined;
  plan.updatedAt = new Date();

  res.json({ plan });
});

// PATCH /safety/date-plans/:id/complete
router.patch('/date-plans/:id/complete', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const plan = db.datePlans.find((p) => p.id === req.params.id && p.userId === userId);

  if (!plan) {
    return res.status(404).json({ error: 'Date plan not found' });
  }

  const { mood } = req.body;
  plan.status = 'completed';
  plan.moodCheckIn = mood || plan.moodCheckIn;
  plan.updatedAt = new Date();

  res.json({ plan });
});

// PATCH /safety/date-plans/:id/cancel
router.patch('/date-plans/:id/cancel', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const plan = db.datePlans.find((p) => p.id === req.params.id && p.userId === userId);

  if (!plan) {
    return res.status(404).json({ error: 'Date plan not found' });
  }

  plan.status = 'cancelled';
  plan.updatedAt = new Date();

  res.json({ plan });
});

// ─── SOS ────────────────────────────────────────────────────────

// POST /safety/sos
router.post('/sos', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { location, datePlanId, message } = req.body;
  const user = findUserById(userId);

  // Find user's trusted contacts
  const contacts = db.trustedContacts.filter((c) => c.userId === userId);
  const contactsNotified = contacts.map((c) => c.id);

  // If there's an active date plan, link it
  if (datePlanId) {
    const plan = db.datePlans.find((p) => p.id === datePlanId && p.userId === userId);
    if (plan) {
      plan.status = 'alert-sent';
      plan.updatedAt = new Date();
    }
  }

  const sosEvent = {
    id: uuidv4(),
    userId,
    location: location || undefined,
    datePlanId: datePlanId || undefined,
    message: message || `SOS alert from ${user?.name || 'NeuroNest user'}`,
    contactsNotified,
    createdAt: new Date()
  };

  db.sosEvents.push(sosEvent);

  // In production: trigger SMS/email via webhook to each trusted contact
  // For now, log and return confirmation
  db.auditLogs.push({
    id: uuidv4(),
    actorId: userId,
    action: 'sos_triggered',
    targetType: 'system',
    metadata: {
      location,
      datePlanId,
      contactsNotified: contactsNotified.length
    },
    createdAt: new Date()
  });

  res.status(201).json({
    sosEvent,
    contactsNotified: contacts.map((c) => ({ id: c.id, name: c.name })),
    message: `SOS alert sent to ${contactsNotified.length} trusted contact(s)`
  });
});

// GET /safety/sos/history
router.get('/sos/history', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const events = db.sosEvents
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({ events });
});

// ─── Trust Levels ───────────────────────────────────────────────

// GET /safety/trust-level/:conversationId
router.get('/trust-level/:conversationId', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const conversation = db.conversations.find(
    (c) => c.id === req.params.conversationId && c.participants.includes(userId)
  );

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const effectiveLevel = conversation.trustOverride ?? conversation.trustLevel;
  const features = getTrustFeatures(effectiveLevel);

  res.json({
    trustLevel: effectiveLevel,
    autoLevel: conversation.trustLevel,
    isOverridden: conversation.trustOverride != null,
    messageCount: conversation.messageCount || 0,
    features
  });
});

// PATCH /safety/trust-level/:conversationId
router.patch('/trust-level/:conversationId', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { level } = req.body;

  const conversation = db.conversations.find(
    (c) => c.id === req.params.conversationId && c.participants.includes(userId)
  );

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (level === null || level === undefined) {
    // Reset to auto
    conversation.trustOverride = null;
  } else if (level >= 1 && level <= 4) {
    conversation.trustOverride = level;
  } else {
    return res.status(400).json({ error: 'Trust level must be 1-4 or null to reset' });
  }

  conversation.updatedAt = new Date();
  const effectiveLevel = conversation.trustOverride ?? conversation.trustLevel;
  const features = getTrustFeatures(effectiveLevel);

  // Notify both participants in real-time
  const io = getIO();
  if (io) {
    io.to(req.params.conversationId).emit('trust-level-changed', {
      conversationId: req.params.conversationId,
      trustLevel: effectiveLevel,
      features
    });
  }

  res.json({
    trustLevel: effectiveLevel,
    autoLevel: conversation.trustLevel,
    isOverridden: conversation.trustOverride != null,
    features
  });
});

function getTrustFeatures(level: number) {
  return {
    textMessages: true,
    images: level >= 2,
    voiceNotes: level >= 2,
    videoChat: level >= 3,
    locationSharing: level >= 3,
    contactExchange: level >= 4,
    label: ['New', 'Getting to know', 'Building trust', 'Trusted'][level - 1] || 'New',
    nextUnlock: level < 4
      ? {
          level: level + 1,
          features: level === 1
            ? ['Images', 'Voice notes']
            : level === 2
              ? ['Video chat', 'Location sharing']
              : ['Contact exchange'],
          hint: level === 1
            ? 'Keep chatting to unlock image sharing'
            : level === 2
              ? 'A few more days of chat unlocks video'
              : 'Almost there — full trust unlocks soon'
        }
      : null
  };
}

// ─── AI Conversation Guardian ───────────────────────────────────

// GET /safety/guardian/settings
router.get('/guardian/settings', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ sensitivity: user.guardianSensitivity || 'subtle' });
});

// PATCH /safety/guardian/settings
router.patch('/guardian/settings', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { sensitivity } = req.body;
  if (!['off', 'subtle', 'active'].includes(sensitivity)) {
    return res.status(400).json({ error: 'Sensitivity must be off, subtle, or active' });
  }
  updateUser(user.id, { guardianSensitivity: sensitivity });
  res.json({ sensitivity });
});

// GET /safety/guardian/flags — get flagged messages for the current user
router.get('/guardian/flags', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const flags = db.messageFlags
    .filter((f) => f.recipientId === userId && !f.dismissed)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const config = getAppConfig();
  const enriched = flags.map((f) => {
    const pattern = config.manipulationPatterns.find((p) => p.type === f.patternType);
    return {
      ...f,
      description: pattern?.description || '',
      learnMoreUrl: pattern?.learnMoreUrl || '/help'
    };
  });

  res.json({ flags: enriched });
});

// PATCH /safety/guardian/flags/:id/dismiss
router.patch('/guardian/flags/:id/dismiss', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const flag = db.messageFlags.find((f) => f.id === req.params.id && f.recipientId === userId);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  flag.dismissed = true;
  res.json({ success: true });
});

// GET /safety/guardian/report — aggregate pattern report
router.get('/guardian/report', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const allFlags = db.messageFlags.filter((f) => f.recipientId === userId);
  const byType: Record<string, number> = {};
  for (const f of allFlags) {
    byType[f.patternType] = (byType[f.patternType] || 0) + 1;
  }
  res.json({
    total: allFlags.length,
    dismissed: allFlags.filter((f) => f.dismissed).length,
    active: allFlags.filter((f) => !f.dismissed).length,
    byType
  });
});

// POST /safety/guardian/scan — scan a message text for patterns (used by message sending middleware)
router.post('/guardian/scan', (req: Request, res: Response) => {
  const { messageId, conversationId, recipientId, content } = req.body;
  if (!content || !messageId || !conversationId || !recipientId) {
    return res.status(400).json({ error: 'messageId, conversationId, recipientId, and content are required' });
  }

  const recipient = findUserById(recipientId);
  if (!recipient || recipient.guardianSensitivity === 'off') {
    return res.json({ flagged: false, flags: [] });
  }

  const config = getAppConfig();
  const lowerContent = content.toLowerCase();
  const threshold = recipient.guardianSensitivity === 'active' ? 1 : 2;
  const newFlags: typeof db.messageFlags = [];

  for (const pattern of config.manipulationPatterns) {
    const matches = pattern.keywords.filter((kw) => lowerContent.includes(kw.toLowerCase()));
    if (matches.length >= threshold) {
      const confidence = Math.min(0.95, 0.3 + matches.length * 0.15);
      const flag = {
        id: uuidv4(),
        messageId,
        conversationId,
        recipientId,
        patternType: pattern.type,
        confidence,
        snippet: content.substring(0, 120),
        dismissed: false,
        createdAt: new Date()
      };
      newFlags.push(flag);
      db.messageFlags.push(flag);
    }
  }

  res.json({ flagged: newFlags.length > 0, flags: newFlags });
});

// ─── Social Energy Meter ────────────────────────────────────────

// GET /safety/energy
router.get('/energy', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ energy: user.socialEnergy });
});

// PATCH /safety/energy
router.patch('/energy', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { level, label, showOnProfile, autoPauseThreshold } = req.body;

  const updates: Partial<typeof user.socialEnergy> = {};
  if (level !== undefined && level >= 0 && level <= 100) updates.level = level;
  if (label && ['full', 'medium', 'low', 'recharging'].includes(label)) updates.label = label;
  if (showOnProfile !== undefined) updates.showOnProfile = showOnProfile;
  if (autoPauseThreshold !== undefined && autoPauseThreshold >= 0 && autoPauseThreshold <= 100) {
    updates.autoPauseThreshold = autoPauseThreshold;
  }

  const newEnergy = { ...user.socialEnergy, ...updates, updatedAt: new Date() };
  updateUser(user.id, { socialEnergy: newEnergy });

  // Auto-suggest quiet hours if below threshold
  let autoPauseSuggested = false;
  if (newEnergy.level <= newEnergy.autoPauseThreshold && !user.isPaused) {
    autoPauseSuggested = true;
  }

  res.json({ energy: newEnergy, autoPauseSuggested });
});

// POST /safety/energy/auto-pause — accept auto-pause suggestion
router.post('/energy/auto-pause', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  updateUser(user.id, { isPaused: true });
  res.json({ paused: true, message: 'Discovery paused. Take a break — you deserve it.' });
});

// ─── Communication Style Passport ───────────────────────────────

// GET /safety/passport/presets
router.get('/passport/presets', (_req: Request, res: Response) => {
  const config = getAppConfig();
  res.json({ presets: config.passportPresets });
});

// GET /safety/passport/:userId
router.get('/passport/:userId', (req: Request, res: Response) => {
  const targetUser = findUserById(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const endorsements = db.passportEndorsements.filter((e) => e.targetUserId === req.params.userId);

  const items = (targetUser.communicationPassport || []).map((item) => ({
    ...item,
    endorsements: endorsements.filter((e) => e.passportItemId === item.id).length,
    endorsedBy: endorsements
      .filter((e) => e.passportItemId === item.id)
      .map((e) => ({ name: e.endorserName, id: e.endorserId }))
  }));

  res.json({ items, userName: targetUser.name });
});

// PUT /safety/passport — update own passport items
router.put('/passport', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }

  // Normalize items with IDs
  const normalized = items.map((item: any) => ({
    id: item.id || uuidv4(),
    text: item.text,
    category: item.category || 'custom',
    isPreset: item.isPreset || false,
    endorsements: 0
  }));

  updateUser(user.id, { communicationPassport: normalized });
  res.json({ items: normalized });
});

// POST /safety/passport/:userId/endorse — endorse a passport item for another user
router.post('/passport/:userId/endorse', (req: Request, res: Response) => {
  const endorserId = req.user!.id;
  const targetUserId = req.params.userId;
  const { passportItemId } = req.body;

  if (endorserId === targetUserId) {
    return res.status(400).json({ error: 'Cannot endorse your own passport items' });
  }

  const targetUser = findUserById(targetUserId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const item = (targetUser.communicationPassport || []).find((i) => i.id === passportItemId);
  if (!item) return res.status(404).json({ error: 'Passport item not found' });

  // Check for existing endorsement
  const existing = db.passportEndorsements.find(
    (e) => e.endorserId === endorserId && e.passportItemId === passportItemId && e.targetUserId === targetUserId
  );
  if (existing) return res.status(400).json({ error: 'Already endorsed' });

  const endorser = findUserById(endorserId);
  const endorsement = {
    id: uuidv4(),
    passportItemId,
    targetUserId,
    endorserId,
    endorserName: endorser?.name || 'Someone',
    createdAt: new Date()
  };

  db.passportEndorsements.push(endorsement);
  res.status(201).json({ endorsement });
});

// ─── Boundary Presets & Templates ───────────────────────────────

// GET /safety/boundaries/presets — get the global boundary preset library
router.get('/boundaries/presets', (_req: Request, res: Response) => {
  const config = getAppConfig();
  res.json({ presets: config.boundaryPresets });
});

// GET /safety/boundaries — get current user's active boundaries
router.get('/boundaries', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ boundaries: user.boundaryPresets || [] });
});

// PUT /safety/boundaries — update user's boundary selections
router.put('/boundaries', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { boundaries } = req.body;
  if (!Array.isArray(boundaries)) {
    return res.status(400).json({ error: 'boundaries must be an array' });
  }

  const normalized = boundaries.map((b: any) => ({
    id: b.id || uuidv4(),
    text: b.text,
    visibility: b.visibility || 'matches',
    isPreset: b.isPreset || false,
    active: b.active !== false
  }));

  updateUser(user.id, { boundaryPresets: normalized });
  res.json({ boundaries: normalized });
});

// GET /safety/boundaries/for/:userId — get visible boundaries for a specific user (as seen by the requester)
router.get('/boundaries/for/:userId', (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const targetUser = findUserById(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  // Check if requester is a match
  const isMatch = db.matches.some(
    (m) =>
      m.status === 'matched' &&
      ((m.userId1 === requesterId && m.userId2 === req.params.userId) ||
        (m.userId2 === requesterId && m.userId1 === req.params.userId))
  );

  const boundaries = (targetUser.boundaryPresets || [])
    .filter((b) => b.active)
    .filter((b) => {
      if (b.visibility === 'all') return true;
      if (b.visibility === 'matches' && isMatch) return true;
      return false;
    })
    .map((b) => ({ text: b.text, visibility: b.visibility }));

  res.json({ boundaries, userName: targetUser.name });
});

// POST /safety/boundaries/check — check if a message text may cross a user's boundaries
router.post('/boundaries/check', (req: Request, res: Response) => {
  const { targetUserId, content } = req.body;
  if (!targetUserId || !content) {
    return res.status(400).json({ error: 'targetUserId and content are required' });
  }

  const targetUser = findUserById(targetUserId);
  if (!targetUser) return res.json({ nudges: [] });

  const lowerContent = content.toLowerCase();
  const activeBoundaries = (targetUser.boundaryPresets || []).filter((b) => b.active);
  const nudges: Array<{ boundary: string; hint: string }> = [];

  // Simple keyword matching for boundary nudges
  const boundaryKeywords: Record<string, string[]> = {
    'slow-paced': ['hurry', 'asap', 'right now', 'quick', 'immediately'],
    'no phone or video calls': ['call me', 'facetime', 'video chat', 'let me call', 'phone number'],
    'time to process': ['answer now', 'why aren\'t you', 'hello??', 'are you there'],
    'text over voice': ['voice message', 'voice note', 'send me a voice', 'record a voice'],
    'avoid sarcasm': ['obviously', 'duh', 'no kidding', 'yeah right'],
    'pressure me for personal': ['where do you live', 'what\'s your address', 'send me your number', 'your real name'],
    'physical touch': ['hug you', 'hold your hand', 'kiss you', 'cuddle'],
  };

  for (const b of activeBoundaries) {
    const lowerBoundary = b.text.toLowerCase();
    for (const [key, keywords] of Object.entries(boundaryKeywords)) {
      if (lowerBoundary.includes(key)) {
        const found = keywords.some((kw) => lowerContent.includes(kw));
        if (found) {
          nudges.push({
            boundary: b.text,
            hint: `This person has asked: "${b.text}". You might want to rephrase.`
          });
        }
      }
    }
  }

  res.json({ nudges });
});

// ─── P2: Sensory Profile Card ───────────────────────────────────

// GET /safety/sensory/:userId
router.get('/sensory/:userId', (req: Request, res: Response) => {
  const targetUser = findUserById(req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  res.json({ sensoryProfile: targetUser.sensoryProfile, userName: targetUser.name });
});

// PUT /safety/sensory
router.put('/sensory', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { noise, light, foodTexture, crowds, touch, scents } = req.body;
  const profile = {
    noise: clamp(noise ?? user.sensoryProfile.noise),
    light: clamp(light ?? user.sensoryProfile.light),
    foodTexture: clamp(foodTexture ?? user.sensoryProfile.foodTexture),
    crowds: clamp(crowds ?? user.sensoryProfile.crowds),
    touch: clamp(touch ?? user.sensoryProfile.touch),
    scents: clamp(scents ?? user.sensoryProfile.scents),
  };
  updateUser(user.id, { sensoryProfile: profile });
  res.json({ sensoryProfile: profile });
});

// POST /safety/sensory/venue-suggestions
router.post('/sensory/venue-suggestions', (req: Request, res: Response) => {
  const { userId1, userId2 } = req.body;
  const user1 = findUserById(userId1);
  const user2 = findUserById(userId2);
  if (!user1 || !user2) return res.status(404).json({ error: 'User(s) not found' });

  const p1 = user1.sensoryProfile;
  const p2 = user2.sensoryProfile;
  const avgNoise = (p1.noise + p2.noise) / 2;
  const avgCrowds = (p1.crowds + p2.crowds) / 2;
  const avgLight = (p1.light + p2.light) / 2;
  const avgScents = (p1.scents + p2.scents) / 2;

  const suggestions: Array<{ venue: string; reason: string; score: number }> = [];

  if (avgNoise < 40) suggestions.push({ venue: 'Quiet café or library', reason: 'Low noise preference', score: 90 });
  else if (avgNoise < 60) suggestions.push({ venue: 'Cozy restaurant', reason: 'Moderate noise tolerance', score: 75 });
  else suggestions.push({ venue: 'Lively café or pub', reason: 'Comfortable with noise', score: 70 });

  if (avgCrowds < 40) suggestions.push({ venue: 'Park or nature walk', reason: 'Avoids crowds', score: 85 });
  if (avgLight < 40) suggestions.push({ venue: 'Dimly lit lounge', reason: 'Sensitive to bright light', score: 80 });
  if (avgScents < 40) suggestions.push({ venue: 'Outdoor space', reason: 'Scent sensitivity', score: 78 });

  suggestions.push({ venue: 'Bookshop or museum', reason: 'Calm environment', score: 72 });

  suggestions.sort((a, b) => b.score - a.score);
  res.json({ suggestions: suggestions.slice(0, 4) });
});

// ─── P2: Selfie Verification ────────────────────────────────────

// POST /safety/verification/selfie
router.post('/verification/selfie', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { selfieDataUrl, poseCompleted } = req.body;
  if (!selfieDataUrl) return res.status(400).json({ error: 'selfieDataUrl is required' });

  // Stub: In production, run face comparison + liveness detection for initial score
  const authenticityScore = poseCompleted ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 30) + 50;

  // Set to pending — admin must review before final approval
  const verification = {
    status: 'pending' as const,
    authenticityScore,
    selfieDataUrl,
    submittedAt: new Date(),
    verifiedAt: undefined as Date | undefined,
    reviewedBy: undefined as string | undefined,
    reviewNotes: undefined as string | undefined
  };

  updateUser(user.id, { selfieVerification: verification });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: user.id,
    action: 'selfie_verification_submitted',
    targetType: 'user',
    metadata: { authenticityScore, poseCompleted },
    createdAt: new Date()
  });

  res.json({
    status: 'pending',
    authenticityScore,
    message: 'Selfie submitted for review. You will be notified once an admin has reviewed it.'
  });
});

// GET /safety/verification/status
router.get('/verification/status', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ selfieVerification: user.selfieVerification, verification: user.verification });
});

// ─── P2: Masking Fatigue Tracker ────────────────────────────────

// POST /safety/masking/log
router.post('/masking/log', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { intensity, context, contextRef, energyBefore, energyAfter, notes, tags } = req.body;

  if (!intensity || intensity < 1 || intensity > 5) {
    return res.status(400).json({ error: 'intensity (1-5) is required' });
  }

  const log = {
    id: uuidv4(),
    userId,
    intensity,
    context: context || 'other',
    contextRef: contextRef || undefined,
    energyBefore: clamp(energyBefore ?? 50),
    energyAfter: clamp(energyAfter ?? 50),
    notes: notes || undefined,
    tags: tags || [],
    createdAt: new Date()
  };

  db.maskingLogs.push(log);
  res.status(201).json({ log });
});

// GET /safety/masking/logs
router.get('/masking/logs', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const logs = db.maskingLogs
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({ logs });
});

// GET /safety/masking/insights
router.get('/masking/insights', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const logs = db.maskingLogs.filter((l) => l.userId === userId);

  if (logs.length === 0) {
    return res.json({ insights: null, message: 'No masking logs yet. Start logging to see patterns.' });
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const recentLogs = logs.filter((l) => l.createdAt >= weekAgo);
  const avgIntensity = logs.reduce((s, l) => s + l.intensity, 0) / logs.length;
  const avgEnergyDrain = logs.reduce((s, l) => s + (l.energyBefore - l.energyAfter), 0) / logs.length;

  const byContext: Record<string, { count: number; avgIntensity: number; avgDrain: number }> = {};
  for (const l of logs) {
    if (!byContext[l.context]) byContext[l.context] = { count: 0, avgIntensity: 0, avgDrain: 0 };
    byContext[l.context].count++;
    byContext[l.context].avgIntensity += l.intensity;
    byContext[l.context].avgDrain += (l.energyBefore - l.energyAfter);
  }
  for (const key of Object.keys(byContext)) {
    byContext[key].avgIntensity = Math.round(byContext[key].avgIntensity / byContext[key].count * 10) / 10;
    byContext[key].avgDrain = Math.round(byContext[key].avgDrain / byContext[key].count);
  }

  const mostDraining = Object.entries(byContext).sort((a, b) => b[1].avgDrain - a[1].avgDrain)[0];
  const leastDraining = Object.entries(byContext).sort((a, b) => a[1].avgDrain - b[1].avgDrain)[0];

  res.json({
    insights: {
      totalLogs: logs.length,
      recentLogs: recentLogs.length,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      avgEnergyDrain: Math.round(avgEnergyDrain),
      byContext,
      mostDraining: mostDraining ? { context: mostDraining[0], ...mostDraining[1] } : null,
      leastDraining: leastDraining ? { context: leastDraining[0], ...leastDraining[1] } : null
    }
  });
});

// ─── P2: Exit Strategy Toolkit ──────────────────────────────────

// GET /safety/exit/templates
router.get('/exit/templates', (_req: Request, res: Response) => {
  const config = getAppConfig();
  res.json({ templates: config.exitTemplates });
});

// POST /safety/exit/send
router.post('/exit/send', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { templateId, customMessage, recipientType } = req.body;
  const user = findUserById(userId);

  const config = getAppConfig();
  const template = config.exitTemplates.find((t) => t.id === templateId);
  const message = customMessage || template?.message || 'I need to leave.';

  // Stub: In production, send SMS/push to self or trusted contact
  db.auditLogs.push({
    id: uuidv4(),
    actorId: userId,
    action: 'exit_text_sent',
    targetType: 'system',
    metadata: { recipientType: recipientType || 'self', message: message.substring(0, 100) },
    createdAt: new Date()
  });

  res.json({ sent: true, message, to: recipientType || 'self' });
});

// POST /safety/exit/rescue-call
router.post('/exit/rescue-call', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { scheduledAt, message, datePlanId } = req.body;

  if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });

  const call = {
    id: uuidv4(),
    userId,
    datePlanId: datePlanId || undefined,
    scheduledAt,
    message: message || 'Your scheduled check-in reminder from NeuroNest',
    status: 'scheduled' as const,
    createdAt: new Date()
  };

  db.rescueCalls.push(call);
  res.status(201).json({ call });
});

// GET /safety/exit/rescue-calls
router.get('/exit/rescue-calls', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const calls = db.rescueCalls
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  res.json({ calls });
});

// PATCH /safety/exit/rescue-call/:id/cancel
router.patch('/exit/rescue-call/:id/cancel', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const call = db.rescueCalls.find((c) => c.id === req.params.id && c.userId === userId);
  if (!call) return res.status(404).json({ error: 'Rescue call not found' });
  call.status = 'cancelled';
  res.json({ call });
});

// ─── P2: Stim-Friendly Interaction Modes ────────────────────────

// GET /safety/stim/preferences
router.get('/stim/preferences', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ stimPreferences: user.stimPreferences });
});

// PATCH /safety/stim/preferences
router.patch('/stim/preferences', (req: Request, res: Response) => {
  const user = findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { hapticIntensity, doodleMode, fidgetReactions, voiceToText } = req.body;
  const prefs = { ...user.stimPreferences };
  if (hapticIntensity && ['off', 'light', 'medium', 'strong'].includes(hapticIntensity)) prefs.hapticIntensity = hapticIntensity;
  if (doodleMode !== undefined) prefs.doodleMode = doodleMode;
  if (fidgetReactions !== undefined) prefs.fidgetReactions = fidgetReactions;
  if (voiceToText !== undefined) prefs.voiceToText = voiceToText;

  updateUser(user.id, { stimPreferences: prefs });
  res.json({ stimPreferences: prefs });
});

// POST /safety/stim/doodle — store a doodle in a conversation
router.post('/stim/doodle', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId, dataUrl } = req.body;

  if (!conversationId || !dataUrl) {
    return res.status(400).json({ error: 'conversationId and dataUrl are required' });
  }

  const conversation = db.conversations.find((c) => c.id === conversationId && c.participants.includes(userId));
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const doodle = {
    id: uuidv4(),
    conversationId,
    senderId: userId,
    dataUrl,
    createdAt: new Date()
  };

  db.doodles.push(doodle);

  // Also add as a message
  const sender = findUserById(userId);
  db.messages.push({
    id: uuidv4(),
    conversationId,
    senderId: userId,
    content: `[Doodle: ${doodle.id}]`,
    toneTag: undefined,
    createdAt: new Date(),
    readAt: undefined
  });

  res.status(201).json({ doodle });
});

// GET /safety/stim/doodles/:conversationId
router.get('/stim/doodles/:conversationId', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const conversation = db.conversations.find(
    (c) => c.id === req.params.conversationId && c.participants.includes(userId)
  );
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const doodles = db.doodles
    .filter((d) => d.conversationId === req.params.conversationId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ doodles });
});

// POST /safety/stim/voice-to-text (stub)
router.post('/stim/voice-to-text', (req: Request, res: Response) => {
  // Stub: In production, use Whisper API or similar
  const { audioDataUrl } = req.body;
  if (!audioDataUrl) return res.status(400).json({ error: 'audioDataUrl is required' });

  res.json({
    text: '[Voice transcription placeholder — connect Whisper API for production]',
    detectedTone: 'neutral',
    suggestedToneTag: '/gen'
  });
});

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export default router;
