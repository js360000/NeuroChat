import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { findUserById, db } from '../db/index.js';

const router = Router();
router.use(authenticateToken);

// ─── Path definitions with milestones ─────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  description: string;
  link?: string;
  order: number;
}

export interface PathDefinition {
  id: string;
  title: string;
  description: string;
  milestones: Milestone[];
}

const PATH_DEFINITIONS: PathDefinition[] = [
  {
    id: 'friendship',
    title: 'Friendship path',
    description: 'Low-pressure connections, shared routines, and community rooms.',
    milestones: [
      { id: 'f1', title: 'Set your boundaries', description: 'Define what you are comfortable with so others know how to approach you.', link: '/settings', order: 1 },
      { id: 'f2', title: 'Set communication preferences', description: 'Choose your response pace and directness level.', link: '/profile', order: 2 },
      { id: 'f3', title: 'Join a community room', description: 'Find a topic room that matches one of your interests.', link: '/community', order: 3 },
      { id: 'f4', title: 'Start a conversation', description: 'Send a first message to someone you have shared interests with.', link: '/messages', order: 4 },
      { id: 'f5', title: 'Exchange interests', description: 'Share at least 3 special interests on your profile.', link: '/profile', order: 5 },
      { id: 'f6', title: 'Plan a hangout', description: 'Create a date plan in the Safety Toolkit to meet someone IRL.', link: '/settings', order: 6 },
    ],
  },
  {
    id: 'dating',
    title: 'Dating path',
    description: 'Clear intent, slower pacing, and tone-first messaging.',
    milestones: [
      { id: 'd1', title: 'Set communication preferences', description: 'Choose your response pace and directness to set expectations.', link: '/profile', order: 1 },
      { id: 'd2', title: 'Complete your profile', description: 'Add a bio, traits, and at least 3 interests.', link: '/profile', order: 2 },
      { id: 'd3', title: 'Add a profile photo', description: 'Upload a photo so matches can see you.', link: '/profile', order: 3 },
      { id: 'd4', title: 'Browse and match', description: 'Visit Discovery to find someone compatible.', link: '/discover', order: 4 },
      { id: 'd5', title: 'Send your first message', description: 'Break the ice — use tone tags so intent is clear.', link: '/messages', order: 5 },
      { id: 'd6', title: 'Have a real conversation', description: 'Exchange at least 10 messages in one conversation.', link: '/messages', order: 6 },
      { id: 'd7', title: 'Plan a safe date', description: 'Use the Date Plan feature with a trusted contact.', link: '/settings', order: 7 },
    ],
  },
  {
    id: 'community',
    title: 'Community path',
    description: 'Topic rooms, gentle mode feed, and buddy threads.',
    milestones: [
      { id: 'c1', title: 'Add your interests', description: 'List at least 3 special interests on your profile.', link: '/profile', order: 1 },
      { id: 'c2', title: 'Explore topic rooms', description: 'Browse community rooms to find your people.', link: '/community', order: 2 },
      { id: 'c3', title: 'Post in a room', description: 'Share something — a thought, a link, or a question.', link: '/community', order: 3 },
      { id: 'c4', title: 'React to a post', description: 'Show support by reacting to someone else\'s message.', link: '/community', order: 4 },
      { id: 'c5', title: 'Start a direct message', description: 'Reach out privately to someone from a room.', link: '/messages', order: 5 },
      { id: 'c6', title: 'Set your social energy', description: 'Configure your social energy meter so you don\'t burn out.', link: '/settings', order: 6 },
    ],
  },
];

// ─── In-memory compass states ────────────────────────────────────

export interface CompassState {
  id: string;
  userId: string;
  pathId: string;
  completedMilestones: string[];
  startedAt: Date;
  updatedAt: Date;
}

// Store compass states in the db object
if (!(db as any).compassStates) {
  (db as any).compassStates = [] as CompassState[];
}
function getStates(): CompassState[] {
  return (db as any).compassStates;
}

// ─── Helpers ─────────────────────────────────────────────────────

function autoCompleteMilestones(userId: string, pathId: string): string[] {
  const user = findUserById(userId);
  if (!user) return [];
  const auto: string[] = [];

  // Check boundaries set
  if (user.boundaryPresets?.length > 0 || user.boundaries?.length > 0) {
    auto.push('f1');
  }
  // Check communication preferences set
  if (user.communicationPreferences?.responsePace && user.communicationPreferences?.directness) {
    auto.push('f2', 'd1');
  }
  // Check profile completeness (bio + traits + 3 interests)
  if (user.bio && user.neurodivergentTraits?.length > 0 && user.specialInterests?.length >= 3) {
    auto.push('d2', 'c1');
  }
  // Check avatar
  if (user.avatar) {
    auto.push('d3');
  }
  // Check interests >= 3
  if (user.specialInterests?.length >= 3) {
    auto.push('f5');
  }
  // Check conversations started
  const userConvos = db.conversations.filter((c) => c.participants.includes(userId));
  if (userConvos.length > 0) {
    auto.push('f4', 'd5', 'c5');
  }
  // Check 10+ messages in any conversation
  const hasDeepConvo = userConvos.some((c) => {
    const msgs = db.messages.filter((m) => m.conversationId === c.id);
    return msgs.length >= 10;
  });
  if (hasDeepConvo) {
    auto.push('d6');
  }

  // Filter to only milestones that belong to the selected path
  const pathDef = PATH_DEFINITIONS.find((p) => p.id === pathId);
  if (!pathDef) return [];
  const pathMilestoneIds = pathDef.milestones.map((m) => m.id);
  return auto.filter((id) => pathMilestoneIds.includes(id));
}

function generateRecommendations(userId: string, state: CompassState | null): string[] {
  const user = findUserById(userId);
  if (!user) return [];
  const tips: string[] = [];

  if (!state) {
    tips.push('Choose a path above to get started with your personalised journey.');
    if (!user.bio) tips.push('Add a bio to your profile so others can learn about you.');
    if ((user.specialInterests?.length || 0) < 3) tips.push('Add at least 3 special interests to help with matching.');
    return tips;
  }

  const pathDef = PATH_DEFINITIONS.find((p) => p.id === state.pathId);
  if (!pathDef) return tips;

  const completed = new Set(state.completedMilestones);
  const next = pathDef.milestones.find((m) => !completed.has(m.id));
  if (next) {
    tips.push(`Next up: ${next.title} — ${next.description}`);
  }

  if (!user.avatar) tips.push('Add a profile photo to build trust with your connections.');
  if (!user.bio) tips.push('Write a short bio so people can get to know you.');
  if ((user.quietHours?.enabled) !== true) tips.push('Set quiet hours in Settings to protect your social energy.');
  if (user.socialEnergy?.level !== undefined && user.socialEnergy.level < 30) {
    tips.push('Your social energy is low — take a break or enable pause mode.');
  }

  const allDone = pathDef.milestones.every((m) => completed.has(m.id));
  if (allDone) {
    tips.push('You completed this path! Consider exploring another one.');
  }

  return tips.slice(0, 5);
}

// ─── Routes ──────────────────────────────────────────────────────

// GET / — get compass state for the current user
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const state = getStates().find((s) => s.userId === userId) || null;

  // Auto-detect completed milestones
  let completedMilestones: string[] = [];
  if (state) {
    const auto = autoCompleteMilestones(userId, state.pathId);
    const merged = [...new Set([...state.completedMilestones, ...auto])];
    if (merged.length !== state.completedMilestones.length) {
      state.completedMilestones = merged;
      state.updatedAt = new Date();
    }
    completedMilestones = state.completedMilestones;
  }

  const recommendations = generateRecommendations(userId, state);

  res.json({
    paths: PATH_DEFINITIONS,
    state: state ? {
      pathId: state.pathId,
      completedMilestones: state.completedMilestones,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    } : null,
    recommendations,
  });
});

// POST /select — select or switch a path
router.post('/select', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { pathId } = req.body;

  if (!pathId || !PATH_DEFINITIONS.find((p) => p.id === pathId)) {
    return res.status(400).json({ error: 'Invalid path ID' });
  }

  const states = getStates();
  let state = states.find((s) => s.userId === userId);

  if (state) {
    state.pathId = pathId;
    state.completedMilestones = [];
    state.updatedAt = new Date();
  } else {
    state = {
      id: uuidv4(),
      userId,
      pathId,
      completedMilestones: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    };
    states.push(state);
  }

  // Auto-detect completed milestones for the new path
  const auto = autoCompleteMilestones(userId, pathId);
  state.completedMilestones = [...new Set([...state.completedMilestones, ...auto])];

  const recommendations = generateRecommendations(userId, state);

  res.json({
    state: {
      pathId: state.pathId,
      completedMilestones: state.completedMilestones,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    },
    recommendations,
  });
});

// PATCH /milestone/:milestoneId — manually mark a milestone complete
router.patch('/milestone/:milestoneId', (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { milestoneId } = req.params;

  const state = getStates().find((s) => s.userId === userId);
  if (!state) {
    return res.status(400).json({ error: 'No path selected. Choose a path first.' });
  }

  const pathDef = PATH_DEFINITIONS.find((p) => p.id === state.pathId);
  if (!pathDef) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const milestone = pathDef.milestones.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found on this path' });
  }

  if (!state.completedMilestones.includes(milestoneId)) {
    state.completedMilestones.push(milestoneId);
    state.updatedAt = new Date();
  }

  const recommendations = generateRecommendations(userId, state);

  res.json({
    state: {
      pathId: state.pathId,
      completedMilestones: state.completedMilestones,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    },
    recommendations,
  });
});

export default router;
