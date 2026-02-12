import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  db,
  findUserById,
  updateUser,
  findSitePageBySlug,
  persistDb,
  type ContentCalendarEntry,
  type Testimonial
} from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import {
  getSettings,
  updateSettings,
  getN8nConfig,
  updateN8nConfig,
  getExperiments,
  updateExperiments,
  getAppConfig,
  updateAppConfig,
  getAdConfig,
  updateAdConfig,
  getAgeVerificationConfig,
  updateAgeVerificationConfig
} from '../config/settings.js';

const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

router.use(authenticateToken, requireAdmin);

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function maskApiKey(key: string) {
  if (!key) return '';
  if (key.length <= 6) return `${'*'.repeat(key.length)}`;
  return `${key.slice(0, 3)}***${key.slice(-3)}`;
}

const SENSITIVE_KEYWORDS = [
  'self-harm',
  'suicide',
  'kill myself',
  'end it',
  'overdose',
  'abuse',
  'assault',
  'violence',
  'stalk',
  'harass',
  'panic attack',
  'hospital',
  'trigger'
];

const SENTIMENT_WORDS = {
  positive: ['thanks', 'appreciate', 'grateful', 'happy', 'excited', 'love', 'support'],
  negative: ['hate', 'angry', 'upset', 'sad', 'hurt', 'anxious', 'frustrated', 'panic']
};

function detectSentiment(text: string) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of SENTIMENT_WORDS.positive) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of SENTIMENT_WORDS.negative) {
    if (lower.includes(word)) score -= 1;
  }
  const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  return { score, label };
}

function findSensitiveKeywords(text: string) {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

const ENV_ALLOWLIST = [
  {
    key: 'N8N_BASE_URL',
    description: 'Base URL for n8n instance',
    isSecret: false,
    restartRequired: false
  },
  {
    key: 'N8N_API_KEY',
    description: 'n8n API key',
    isSecret: true,
    restartRequired: false
  },
  {
    key: 'N8N_WEBHOOK_URL',
    description: 'Default n8n webhook URL',
    isSecret: false,
    restartRequired: false
  },
  {
    key: 'N8N_API_VERSION',
    description: 'n8n API version',
    isSecret: false,
    restartRequired: false
  },
  {
    key: 'N8N_ENABLED',
    description: 'Enable n8n integration',
    isSecret: false,
    restartRequired: false
  },
  {
    key: 'STRIPE_SECRET_KEY',
    description: 'Stripe API secret key',
    isSecret: true,
    restartRequired: true
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    description: 'Stripe webhook signing secret',
    isSecret: true,
    restartRequired: true
  },
  {
    key: 'GEMINI_API_KEY',
    description: 'Google Gemini API key',
    isSecret: true,
    restartRequired: true
  },
  {
    key: 'FRONTEND_URL',
    description: 'Frontend URL for redirects',
    isSecret: false,
    restartRequired: true
  },
  {
    key: 'JWT_SECRET',
    description: 'JWT signing secret',
    isSecret: true,
    restartRequired: true
  }
];

function maskEnvValue(value: string, isSecret: boolean) {
  if (!value) return '';
  if (!isSecret) return value;
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function getWorkflowHook(workflowId: string) {
  return db.n8nWorkflowHooks.find((hook) => hook.workflowId === workflowId);
}

function upsertWorkflowHook(workflowId: string, webhookUrl: string) {
  const existing = getWorkflowHook(workflowId);
  if (existing) {
    existing.webhookUrl = webhookUrl;
    existing.updatedAt = new Date();
    return existing;
  }
  const hook = {
    workflowId,
    webhookUrl,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  db.n8nWorkflowHooks.push(hook);
  return hook;
}

async function checkN8nConnection() {
  const config = getN8nConfig();
  if (!config.enabled || !config.baseUrl || !config.apiKey) {
    return { status: 'disconnected' as const };
  }
  const url = `${normalizeBaseUrl(config.baseUrl)}/api/v${config.apiVersion}/workflows?limit=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': config.apiKey
      }
    });
    if (!response.ok) {
      return { status: 'error' as const };
    }
    return { status: 'connected' as const };
  } catch {
    return { status: 'error' as const };
  }
}


// GET /overview - Dashboard stats from real data
router.get('/overview', (req: Request, res: Response) => {
  const onlineUsers = db.users.filter(u => u.isOnline && !u.isSuspended).length;
  const premiumUsers = db.users.filter(u => u.subscription.plan === 'premium').length;
  const proUsers = db.users.filter(u => u.subscription.plan === 'pro').length;
  const freeUsers = db.users.filter(u => u.subscription.plan === 'free').length;

  const matchedCount = db.matches.filter(m => m.status === 'matched').length;
  const pendingCount = db.matches.filter(m => m.status === 'pending').length;

  // Calculate users registered today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const usersToday = db.users.filter(u => new Date(u.createdAt) >= todayStart).length;
  const matchesToday = db.matches.filter(m => new Date(m.matchedAt) >= todayStart).length;

  // Generate daily activity from real message/match data for last 7 days
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMessages = db.messages.filter(m => {
      const created = new Date(m.createdAt);
      return created >= dayStart && created <= dayEnd;
    }).length;

    const dayMatches = db.matches.filter(m => {
      const created = new Date(m.matchedAt);
      return created >= dayStart && created <= dayEnd;
    }).length;

    const activeUsers = db.users.filter(u => {
      const lastActive = new Date(u.lastActive);
      return lastActive >= dayStart && lastActive <= dayEnd;
    }).length;

    dailyActivity.push({
      date: date.toISOString().split('T')[0],
      users: activeUsers,
      messages: dayMessages,
      matches: dayMatches
    });
  }

  res.json({
    stats: {
      users: {
        total: db.users.filter(u => !u.isSuspended).length,
        online: onlineUsers,
        today: usersToday,
        premium: premiumUsers + proUsers
      },
      matches: {
        total: db.matches.length,
        pending: pendingCount,
        matched: matchedCount,
        today: matchesToday
      },
      subscriptions: {
        free: freeUsers,
        premium: premiumUsers,
        pro: proUsers
      }
    },
    dailyActivity,
    recentActivity: {
      newUsers: usersToday,
      newMatches: matchesToday,
      activeUsers: onlineUsers
    }
  });
});

// GET /experience - Experience health metrics
router.get('/experience', (req: Request, res: Response) => {
  const activeUsers = db.users.filter((user) => !user.isSuspended);
  const totalUsers = activeUsers.length || 1;
  const calmAdopters = activeUsers.filter(
    (user) => (user.experiencePreferences?.calmMode ?? 0) > 0
  ).length;
  const reduceMotion = activeUsers.filter(
    (user) => user.experiencePreferences?.reduceMotion
  ).length;
  const reduceSaturation = activeUsers.filter(
    (user) => user.experiencePreferences?.reduceSaturation
  ).length;
  const densityBreakdown = activeUsers.reduce(
    (acc, user) => {
      const density = user.experiencePreferences?.density || 'balanced';
      acc[density] = (acc[density] || 0) + 1;
      return acc;
    },
    { cozy: 0, balanced: 0, compact: 0 } as Record<'cozy' | 'balanced' | 'compact', number>
  );
  const onboardingCompleted = activeUsers.filter((user) => user.onboarding?.completed).length;
  const onboardingIncomplete = totalUsers - onboardingCompleted;
  const stepCounts = activeUsers.reduce<Record<string, number>>((acc, user) => {
    const step = user.onboarding?.step ? String(user.onboarding.step) : '1';
    acc[step] = (acc[step] || 0) + 1;
    return acc;
  }, {});

  const consentTotal = db.cookieConsents.length;
  const consentAnalytics = db.cookieConsents.filter((log) => log.analytics).length;
  const consentMarketing = db.cookieConsents.filter((log) => log.marketing).length;

  res.json({
    stats: {
      totalUsers,
      calmAdoptionRate: Math.round((calmAdopters / totalUsers) * 1000) / 10,
      reduceMotionRate: Math.round((reduceMotion / totalUsers) * 1000) / 10,
      reduceSaturationRate: Math.round((reduceSaturation / totalUsers) * 1000) / 10,
      densityBreakdown,
      onboardingCompleted,
      onboardingIncomplete,
      onboardingSteps: stepCounts,
      consent: {
        total: consentTotal,
        analytics: consentAnalytics,
        marketing: consentMarketing
      }
    }
  });
});

// GET /users - Get all users with filters
router.get('/users', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = (req.query.search as string)?.toLowerCase();
  const plan = req.query.plan as string;
  const status = req.query.status as string;

  let users = [...db.users];

  if (search) {
    users = users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  }

  if (plan && plan !== 'all') {
    users = users.filter(u => u.subscription.plan === plan);
  }

  if (status === 'suspended') {
    users = users.filter(u => u.isSuspended);
  } else if (status && status !== 'all') {
    users = users.filter(u => u.subscription.status === status && !u.isSuspended);
  }

  const total = users.length;
  users = users.slice(offset, offset + limit);

  const adminUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    role: u.role,
    subscription: u.subscription,
    verification: u.verification,
    isSuspended: u.isSuspended,
    createdAt: u.createdAt.toISOString(),
    lastActive: u.lastActive.toISOString(),
    isOnline: u.isOnline
  }));

  res.json({ users: adminUsers, total });
});

// GET /users/:id - Get single user
router.get('/users/:id', (req: Request, res: Response) => {
  const user = findUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      neurodivergentTraits: user.neurodivergentTraits,
      specialInterests: user.specialInterests,
      role: user.role,
      subscription: user.subscription,
      verification: user.verification,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.lastActive.toISOString(),
      isOnline: user.isOnline
    }
  });
});

// GET /reports - moderation queue
router.get('/reports', (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'pending';
  const targetType = (req.query.targetType as string) || 'all';

  let reports = [...db.reports];
  if (status !== 'all') {
    reports = reports.filter((report) => report.status === status);
  }
  if (targetType !== 'all') {
    reports = reports.filter((report) => report.targetType === targetType);
  }

  const results = reports.map((report) => {
    const reporter = findUserById(report.reporterId);
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reporter: reporter
        ? { id: reporter.id, name: reporter.name, email: reporter.email }
        : { id: report.reporterId, name: 'Unknown' }
    };
  });

  res.json({ reports: results });
});

// GET /anomalies - abuse anomaly signals
router.get('/anomalies', (req: Request, res: Response) => {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last7d = now - 7 * 24 * 60 * 60 * 1000;

  const recentReports = db.reports.filter((report) => report.createdAt.getTime() >= last24h);
  const recent7dReports = db.reports.filter((report) => report.createdAt.getTime() >= last7d);

  const countBy = <T,>(items: T[], keyFn: (item: T) => string) => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  };

  const topReporters = Object.entries(countBy(db.reports, (r) => r.reporterId))
    .map(([id, count]) => {
      const user = findUserById(id);
      return { id, name: user?.name || 'Unknown', count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topTargets = Object.entries(countBy(db.reports, (r) => r.targetId))
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const reasons = Object.entries(countBy(db.reports, (r) => r.reason || 'unknown'))
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const suspiciousReporters = Object.entries(countBy(recent7dReports, (r) => r.reporterId))
    .filter(([, count]) => count >= 3)
    .map(([id, count]) => {
      const user = findUserById(id);
      return { id, name: user?.name || 'Unknown', count };
    });

  const suspiciousTargets = Object.entries(countBy(recent7dReports, (r) => r.targetId))
    .filter(([, count]) => count >= 3)
    .map(([id, count]) => ({ id, count }));

  res.json({
    totals: {
      totalReports: db.reports.length,
      pending: db.reports.filter((report) => report.status === 'pending').length,
      last24h: recentReports.length
    },
    topReporters,
    topTargets,
    reasons,
    suspiciousReporters,
    suspiciousTargets
  });
});

// POST /reports/:id/resolve
router.post('/reports/:id/resolve', (req: Request, res: Response) => {
  const report = db.reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  report.status = 'resolved';
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'resolve_report',
    targetType: 'report',
    targetId: report.id,
    createdAt: new Date()
  });
  res.json({ success: true });
});

// POST /reports/:id/review
router.post('/reports/:id/review', (req: Request, res: Response) => {
  const report = db.reports.find((r) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  report.status = 'reviewed';
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'review_report',
    targetType: 'report',
    targetId: report.id,
    createdAt: new Date()
  });
  res.json({ success: true });
});

// POST /community/posts/:id/hide
router.post('/community/posts/:id/hide', (req: Request, res: Response) => {
  const post = db.communityPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.hidden = true;
  post.updatedAt = new Date();
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'hide_community_post',
    targetType: 'community_post',
    targetId: post.id,
    createdAt: new Date()
  });
  res.json({ success: true });
});

// POST /community/posts/:id/unhide
router.post('/community/posts/:id/unhide', (req: Request, res: Response) => {
  const post = db.communityPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.hidden = false;
  post.updatedAt = new Date();
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'unhide_community_post',
    targetType: 'community_post',
    targetId: post.id,
    createdAt: new Date()
  });
  res.json({ success: true });
});

// GET /community/posts - admin content list
router.get('/community/posts', (req: Request, res: Response) => {
  const q = (req.query.q as string)?.toLowerCase();
  let posts = [...db.communityPosts];
  if (q) {
    posts = posts.filter(
      (post) =>
        post.title?.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q)
    );
  }
  const results = posts
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((post) => {
      const author = findUserById(post.authorId);
      const sentiment = detectSentiment(post.content);
      const flaggedKeywords = findSensitiveKeywords(`${post.title || ''} ${post.content}`);
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        toneTag: post.toneTag,
        contentWarning: post.contentWarning,
        hidden: post.hidden === true,
        sentiment,
        flaggedKeywords,
        author: author
          ? { id: author.id, name: author.name, email: author.email }
          : { id: post.authorId, name: 'Unknown' },
        createdAt: post.createdAt.toISOString()
      };
    });

  res.json({ posts: results });
});

// GET /audit - admin audit log
router.get('/audit', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const logs = [...db.auditLogs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((log) => ({
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      createdAt: log.createdAt.toISOString()
    }));
  res.json({ logs });
});

// GET /payments/summary - derived metrics
router.get('/payments/summary', (req: Request, res: Response) => {
  const planPrices = {
    free: 0,
    premium: 12,
    pro: 24
  };
  const activeUsers = db.users.filter(
    (user) => user.subscription.status === 'active' && user.subscription.plan !== 'free'
  );
  const mrr = activeUsers.reduce((sum, user) => sum + planPrices[user.subscription.plan], 0);
  const activeSubscriptions = activeUsers.length;
  const churned = db.users.filter((user) => user.subscription.status === 'cancelled').length;
  const churnRate = db.users.length > 0 ? Math.round((churned / db.users.length) * 1000) / 10 : 0;

  res.json({
    summary: {
      monthlyRevenue: mrr,
      activeSubscriptions,
      churnRate
    }
  });
});

// GET /payments/recent - recent charges if Stripe connected
router.get('/payments/recent', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.json({ payments: [] });
  }
  try {
    const charges = await stripe.charges.list({ limit: 20 });
    const payments = charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      description: charge.description || 'Subscription payment',
      created: new Date(charge.created * 1000).toISOString()
    }));
    res.json({ payments });
  } catch {
    res.json({ payments: [] });
  }
});

// PATCH /users/:id - Update user
router.patch('/users/:id', (req: Request, res: Response) => {
  const user = findUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { subscription, verification, isSuspended, ...rest } = req.body;

  if (subscription) {
    Object.assign(user.subscription, subscription);
  }
  if (verification) {
    Object.assign(user.verification, verification);
  }
  if (typeof isSuspended === 'boolean') {
    user.isSuspended = isSuspended;
  }
  Object.assign(user, rest);
  user.updatedAt = new Date();

  res.json({ user });
});

// POST /users/:id/suspend - Suspend user
router.post('/users/:id/suspend', (req: Request, res: Response) => {
  const user = findUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isSuspended = true;
  user.updatedAt = new Date();

  res.json({ success: true, message: 'User suspended' });
});

// POST /users/:id/unsuspend - Unsuspend user
router.post('/users/:id/unsuspend', (req: Request, res: Response) => {
  const user = findUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.isSuspended = false;
  user.updatedAt = new Date();

  res.json({ success: true, message: 'User unsuspended' });
});

// GET /analytics - Get analytics data from real db
router.get('/analytics', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;

  const dailyActivity = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMessages = db.messages.filter(m => {
      const created = new Date(m.createdAt);
      return created >= dayStart && created <= dayEnd;
    }).length;

    const dayMatches = db.matches.filter(m => {
      const created = new Date(m.matchedAt);
      return created >= dayStart && created <= dayEnd;
    }).length;

    const activeUsers = db.users.filter(u => {
      const lastActive = new Date(u.lastActive);
      return lastActive >= dayStart && lastActive <= dayEnd;
    }).length;

    dailyActivity.push({
      date: date.toISOString().split('T')[0],
      users: activeUsers,
      messages: dayMessages,
      matches: dayMatches
    });
  }

  // Calculate new users this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newUsersThisMonth = db.users.filter(u => new Date(u.createdAt) >= monthStart).length;

  res.json({
    dailyActivity,
    userStats: {
      totalUsers: db.users.filter(u => !u.isSuspended).length,
      activeUsers: db.users.filter(u => u.isOnline && !u.isSuspended).length,
      suspendedUsers: db.users.filter(u => u.isSuspended).length,
      newUsersThisMonth
    },
    subscriptionBreakdown: {
      free: db.users.filter(u => u.subscription.plan === 'free').length,
      premium: db.users.filter(u => u.subscription.plan === 'premium').length,
      pro: db.users.filter(u => u.subscription.plan === 'pro').length
    },
    messageStats: {
      total: db.messages.length,
      conversations: db.conversations.length
    },
    matchStats: {
      total: db.matches.length,
      matched: db.matches.filter(m => m.status === 'matched').length,
      pending: db.matches.filter(m => m.status === 'pending').length
    }
  });
});

// GET /settings - Get admin settings
router.get('/settings', (req: Request, res: Response) => {
  res.json({ settings: getSettings() });
});

// PATCH /settings - Update settings
router.patch('/settings', (req: Request, res: Response) => {
  const allowedKeys: (keyof ReturnType<typeof getSettings>)[] = [
    'siteName', 'maintenanceMode', 'registrationEnabled',
    'maxMatchesPerDay', 'aiExplanationsEnabled'
  ];

  const updates: Partial<ReturnType<typeof getSettings>> = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  const next = updateSettings(updates);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_settings',
    targetType: 'system',
    metadata: updates,
    createdAt: new Date()
  });

  res.json({ settings: next });
});

// GET /experiments - Get experiment toggles
router.get('/experiments', (req: Request, res: Response) => {
  res.json({ experiments: getExperiments() });
});

// PATCH /experiments - Update experiment toggles
router.patch('/experiments', (req: Request, res: Response) => {
  const allowedKeys: (keyof ReturnType<typeof getExperiments>)[] = [
    'landingHeroVariant',
    'onboardingToneVariant',
    'discoveryIntentVariant',
    'compassCtaVariant'
  ];

  const updates: Partial<ReturnType<typeof getExperiments>> = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  const next = updateExperiments(updates);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_experiments',
    targetType: 'system',
    metadata: updates,
    createdAt: new Date()
  });

  res.json({ experiments: next });
});

// GET /config - Get app config (traits, interests, goals, pricing, crisis resources)
router.get('/config', (req: Request, res: Response) => {
  res.json({ config: getAppConfig() });
});

// PATCH /config - Update app config
router.patch('/config', (req: Request, res: Response) => {
  const allowedKeys = [
    'traitOptions', 'interestOptions', 'goalOptions',
    'paceOptions', 'directnessOptions', 'pricingPlans', 'crisisResources'
  ];

  const updates: Record<string, any> = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const next = updateAppConfig(updates);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_app_config',
    targetType: 'system',
    metadata: { updatedKeys: Object.keys(updates) },
    createdAt: new Date()
  });

  res.json({ config: next });
});

// GET /pages - list site pages
router.get('/pages', (req: Request, res: Response) => {
  const pages = db.sitePages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    updatedAt: page.updatedAt.toISOString()
  }));
  res.json({ pages });
});

// GET /digest - list digest queue entries
router.get('/digest', (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'all';
  let entries = [...db.digestQueue];
  if (status !== 'all') {
    entries = entries.filter((entry) => entry.status === status);
  }
  const results = entries
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((entry) => ({
      id: entry.id,
      scheduledFor: entry.scheduledFor,
      status: entry.status,
      createdAt: entry.createdAt.toISOString()
    }));
  res.json({ digests: results });
});

// POST /digest - create digest queue entry
router.post('/digest', (req: Request, res: Response) => {
  const scheduledFor = req.body.scheduledFor as string | undefined;
  if (!scheduledFor) {
    return res.status(400).json({ error: 'scheduledFor is required' });
  }
  const entry = {
    id: uuidv4(),
    scheduledFor,
    status: 'queued' as const,
    createdAt: new Date()
  };
  db.digestQueue.push(entry);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'create_digest_queue',
    targetType: 'system',
    metadata: { scheduledFor },
    createdAt: new Date()
  });
  res.json({ digest: { ...entry, createdAt: entry.createdAt.toISOString() } });
  persistDb();
});

// PATCH /digest/:id - update digest entry
router.patch('/digest/:id', (req: Request, res: Response) => {
  const entry = db.digestQueue.find((item) => item.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Digest entry not found' });
  }
  if (req.body.status) entry.status = req.body.status;
  if (req.body.scheduledFor) entry.scheduledFor = req.body.scheduledFor;
  res.json({ digest: { ...entry, createdAt: entry.createdAt.toISOString() } });
  persistDb();
});

// GET /content-calendar - list content calendar entries
router.get('/content-calendar', (req: Request, res: Response) => {
  const channel = (req.query.channel as string) || 'all';
  const status = (req.query.status as string) || 'all';
  let entries = [...db.contentCalendar];
  if (channel !== 'all') {
    entries = entries.filter((entry) => entry.channel === channel);
  }
  if (status !== 'all') {
    entries = entries.filter((entry) => entry.status === status);
  }
  const results = entries
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
    .map((entry) => ({
      id: entry.id,
      channel: entry.channel,
      title: entry.title,
      notes: entry.notes,
      scheduledFor: entry.scheduledFor,
      status: entry.status,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }));
  res.json({ entries: results });
});

// POST /content-calendar - create content calendar entry
router.post('/content-calendar', (req: Request, res: Response) => {
  const { channel, title, notes, scheduledFor, status } = req.body;
  if (!channel || !title || !scheduledFor) {
    return res.status(400).json({ error: 'channel, title, scheduledFor are required' });
  }
  if (channel !== 'blog' && channel !== 'community') {
    return res.status(400).json({ error: 'channel must be blog or community' });
  }
  const statusValue: ContentCalendarEntry['status'] =
    status === 'draft' || status === 'published' ? status : 'planned';
  const entry: ContentCalendarEntry = {
    id: uuidv4(),
    channel,
    title,
    notes,
    scheduledFor,
    status: statusValue,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  db.contentCalendar.push(entry);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'create_content_calendar',
    targetType: 'system',
    metadata: { channel, title },
    createdAt: new Date()
  });
  res.json({
    entry: {
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }
  });
  persistDb();
});

// PATCH /content-calendar/:id - update calendar entry
router.patch('/content-calendar/:id', (req: Request, res: Response) => {
  const entry = db.contentCalendar.find((item) => item.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Calendar entry not found' });
  }
  if (req.body.channel === 'blog' || req.body.channel === 'community') {
    entry.channel = req.body.channel;
  }
  if (typeof req.body.title === 'string') entry.title = req.body.title;
  if (req.body.notes !== undefined) entry.notes = req.body.notes;
  if (typeof req.body.scheduledFor === 'string') entry.scheduledFor = req.body.scheduledFor;
  if (req.body.status === 'planned' || req.body.status === 'draft' || req.body.status === 'published') {
    entry.status = req.body.status;
  }
  entry.updatedAt = new Date();
  res.json({
    entry: {
      ...entry,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }
  });
  persistDb();
});

// DELETE /content-calendar/:id - remove calendar entry
router.delete('/content-calendar/:id', (req: Request, res: Response) => {
  const entry = db.contentCalendar.find((item) => item.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Calendar entry not found' });
  }
  db.contentCalendar = db.contentCalendar.filter((item) => item.id !== entry.id) as typeof db.contentCalendar;
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'delete_content_calendar',
    targetType: 'system',
    metadata: { id: entry.id },
    createdAt: new Date()
  });
  res.json({ success: true });
  persistDb();
});

// GET /consent - list cookie consent logs
router.get('/consent', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const offset = parseInt(req.query.offset as string) || 0;
  const analytics = req.query.analytics as string | undefined;
  const marketing = req.query.marketing as string | undefined;

  let logs = [...db.cookieConsents];
  if (analytics === 'true') {
    logs = logs.filter((log) => log.analytics);
  }
  if (analytics === 'false') {
    logs = logs.filter((log) => !log.analytics);
  }
  if (marketing === 'true') {
    logs = logs.filter((log) => log.marketing);
  }
  if (marketing === 'false') {
    logs = logs.filter((log) => !log.marketing);
  }

  const total = logs.length;
  const results = logs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit)
    .map((log) => ({
      id: log.id,
      analytics: log.analytics,
      marketing: log.marketing,
      userAgent: log.userAgent,
      ip: log.ip,
      createdAt: log.createdAt.toISOString()
    }));

  res.json({ logs: results, total });
});

// GET /consent/export - export consent logs (json)
router.get('/consent/export', (req: Request, res: Response) => {
  const logs = db.cookieConsents
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((log) => ({
      id: log.id,
      analytics: log.analytics,
      marketing: log.marketing,
      userAgent: log.userAgent,
      ip: log.ip,
      createdAt: log.createdAt.toISOString()
    }));
  res.json({ logs });
});

// GET /pages/:slug - get site page
router.get('/pages/:slug', (req: Request, res: Response) => {
  const page = findSitePageBySlug(req.params.slug);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }
  res.json({
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      body: page.body,
      updatedAt: page.updatedAt.toISOString()
    }
  });
});

// GET /testimonials - list testimonials
router.get('/testimonials', (req: Request, res: Response) => {
  const status = (req.query.status as string) || 'all';
  let testimonials = [...db.testimonials];
  if (status !== 'all') {
    testimonials = testimonials.filter((item) => item.status === status);
  }
  const results = testimonials
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((item) => ({
      id: item.id,
      quote: item.quote,
      author: item.author,
      role: item.role,
      avatar: item.avatar,
      micro: item.micro,
      featured: item.featured,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
  res.json({ testimonials: results });
});

// POST /testimonials - create testimonial
router.post('/testimonials', (req: Request, res: Response) => {
  const { quote, author, role, avatar, micro, featured, status } = req.body;
  if (!quote || !author) {
    return res.status(400).json({ error: 'Quote and author are required' });
  }

  const statusValue: Testimonial['status'] = status === 'draft' ? 'draft' : 'published';
  const testimonial: Testimonial = {
    id: uuidv4(),
    quote,
    author,
    role,
    avatar,
    micro,
    featured: featured === true,
    status: statusValue,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.testimonials.push(testimonial);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'create_testimonial',
    targetType: 'system',
    metadata: { id: testimonial.id },
    createdAt: new Date()
  });
  persistDb();

  res.json({
    testimonial: {
      ...testimonial,
      createdAt: testimonial.createdAt.toISOString(),
      updatedAt: testimonial.updatedAt.toISOString()
    }
  });
});

// PATCH /testimonials/:id - update testimonial
router.patch('/testimonials/:id', (req: Request, res: Response) => {
  const testimonial = db.testimonials.find((item) => item.id === req.params.id);
  if (!testimonial) {
    return res.status(404).json({ error: 'Testimonial not found' });
  }

  if (typeof req.body.quote === 'string') testimonial.quote = req.body.quote;
  if (typeof req.body.author === 'string') testimonial.author = req.body.author;
  if (typeof req.body.role === 'string' || req.body.role === null) testimonial.role = req.body.role;
  if (typeof req.body.avatar === 'string' || req.body.avatar === null) testimonial.avatar = req.body.avatar;
  if (typeof req.body.micro === 'string' || req.body.micro === null) testimonial.micro = req.body.micro;
  if (typeof req.body.featured === 'boolean') testimonial.featured = req.body.featured;
  if (req.body.status === 'draft' || req.body.status === 'published') {
    testimonial.status = req.body.status;
  }
  testimonial.updatedAt = new Date();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_testimonial',
    targetType: 'system',
    metadata: { id: testimonial.id },
    createdAt: new Date()
  });
  persistDb();

  res.json({
    testimonial: {
      ...testimonial,
      createdAt: testimonial.createdAt.toISOString(),
      updatedAt: testimonial.updatedAt.toISOString()
    }
  });
});

// DELETE /testimonials/:id - remove testimonial
router.delete('/testimonials/:id', (req: Request, res: Response) => {
  const testimonial = db.testimonials.find((item) => item.id === req.params.id);
  if (!testimonial) {
    return res.status(404).json({ error: 'Testimonial not found' });
  }

  db.testimonials = db.testimonials.filter((item) => item.id !== req.params.id) as typeof db.testimonials;
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'delete_testimonial',
    targetType: 'system',
    metadata: { id: testimonial.id },
    createdAt: new Date()
  });
  persistDb();

  res.json({ success: true });
});

// PATCH /pages/:slug - update site page content
router.patch('/pages/:slug', (req: Request, res: Response) => {
  const page = findSitePageBySlug(req.params.slug);
  if (!page) {
    return res.status(404).json({ error: 'Page not found' });
  }

  const { title, summary, body } = req.body;
  if (typeof title === 'string') page.title = title;
  if (typeof summary === 'string') page.summary = summary;
  if (typeof body === 'string') page.body = body;
  page.updatedAt = new Date();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_site_page',
    targetType: 'system',
    metadata: { slug: page.slug },
    createdAt: new Date()
  });

  res.json({
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      body: page.body,
      updatedAt: page.updatedAt.toISOString()
    }
  });
  persistDb();
});

// GET /social/schedule - list scheduled social posts
router.get('/social/schedule', (req: Request, res: Response) => {
  const channel = (req.query.channel as string) || 'all';
  const status = (req.query.status as string) || 'all';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  let entries = [...db.socialSchedules];
  if (channel !== 'all') {
    entries = entries.filter((entry) => entry.channel === channel);
  }
  if (status !== 'all') {
    entries = entries.filter((entry) => entry.status === status);
  }

  const results = entries
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      channel: entry.channel,
      title: entry.title,
      caption: entry.caption,
      description: entry.description,
      mediaUrl: entry.mediaUrl,
      scheduledAt: entry.scheduledAt,
      status: entry.status,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }));

  res.json({ schedules: results });
});

// POST /social/schedule - create a scheduled social post entry
router.post('/social/schedule', (req: Request, res: Response) => {
  const { channel, title, caption, description, mediaUrl, scheduledAt } = req.body;

  if (!channel || !title) {
    return res.status(400).json({ error: 'Channel and title are required' });
  }

  const entry = {
    id: uuidv4(),
    channel,
    title,
    caption,
    description,
    mediaUrl,
    scheduledAt,
    status: 'queued' as const,
    createdBy: req.user!.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  db.socialSchedules.push(entry);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'create_social_schedule',
    targetType: 'system',
    metadata: { channel, title },
    createdAt: new Date()
  });

  res.json({ schedule: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() } });
  persistDb();
});

// PATCH /social/schedule/:id - update schedule status
router.patch('/social/schedule/:id', (req: Request, res: Response) => {
  const entry = db.socialSchedules.find((item) => item.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Schedule entry not found' });
  }

  const allowedFields = ['status', 'scheduledAt', 'title', 'caption', 'description', 'mediaUrl'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      (entry as any)[field] = req.body[field];
    }
  }
  entry.updatedAt = new Date();

  res.json({ schedule: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() } });
  persistDb();
});

// GET /n8n/config - Get n8n configuration (masked)
router.get('/n8n/config', (req: Request, res: Response) => {
  const config = getN8nConfig();
  res.json({
    config: {
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      webhookUrl: config.webhookUrl,
      enabled: config.enabled,
      apiKeyMasked: maskApiKey(config.apiKey)
    }
  });
});

// PATCH /n8n/config - Update n8n configuration
router.patch('/n8n/config', (req: Request, res: Response) => {
  const allowedKeys: (keyof ReturnType<typeof getN8nConfig>)[] = [
    'baseUrl', 'apiKey', 'apiVersion', 'webhookUrl', 'enabled'
  ];

  const updates: Partial<ReturnType<typeof getN8nConfig>> = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  if (typeof updates.apiKey === 'string' && updates.apiKey.trim() === '') {
    delete updates.apiKey;
  }

  const next = updateN8nConfig(updates);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_n8n_config',
    targetType: 'integration',
    metadata: {
      baseUrl: next.baseUrl,
      apiVersion: next.apiVersion,
      webhookUrl: next.webhookUrl,
      enabled: next.enabled
    },
    createdAt: new Date()
  });

  res.json({
    config: {
      baseUrl: next.baseUrl,
      apiVersion: next.apiVersion,
      webhookUrl: next.webhookUrl,
      enabled: next.enabled,
      apiKeyMasked: maskApiKey(next.apiKey)
    }
  });
});

// GET /n8n/workflows/hooks - List stored webhook hooks for workflows
router.get('/n8n/workflows/hooks', (req: Request, res: Response) => {
  const hooks = db.n8nWorkflowHooks.map((hook) => ({
    workflowId: hook.workflowId,
    webhookUrl: hook.webhookUrl,
    updatedAt: hook.updatedAt.toISOString()
  }));
  res.json({ hooks });
});

// PATCH /n8n/workflows/:id/hook - Update webhook URL for a workflow
router.patch('/n8n/workflows/:id/hook', (req: Request, res: Response) => {
  const webhookUrl = req.body.webhookUrl as string;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }
  const hook = upsertWorkflowHook(req.params.id, webhookUrl);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_workflow_hook',
    targetType: 'integration',
    targetId: req.params.id,
    metadata: { webhookUrl },
    createdAt: new Date()
  });
  res.json({
    hook: {
      workflowId: hook.workflowId,
      webhookUrl: hook.webhookUrl,
      updatedAt: hook.updatedAt.toISOString()
    }
  });
  persistDb();
});

// POST /n8n/workflows/:id/run - Trigger workflow webhook
router.post('/n8n/workflows/:id/run', async (req: Request, res: Response) => {
  const overrideUrl = req.body.webhookUrl as string | undefined;
  const storedHook = getWorkflowHook(req.params.id);
  const targetUrl = overrideUrl || storedHook?.webhookUrl;
  if (!targetUrl) {
    return res.status(400).json({ error: 'No webhook URL configured for this workflow' });
  }

  const payload = {
    event: 'manual_run',
    workflowId: req.params.id,
    triggeredBy: req.user!.id,
    payload: req.body.payload || {}
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    db.n8nWorkflowRuns.push({
      id: uuidv4(),
      workflowId: req.params.id,
      webhookUrl: targetUrl,
      status: response.ok ? 'success' : 'failed',
      responseStatus: response.status,
      triggeredAt: new Date(),
      triggeredBy: req.user!.id
    });
    persistDb();

    res.json({ ok: response.ok, status: response.status });
  } catch (error: any) {
    db.n8nWorkflowRuns.push({
      id: uuidv4(),
      workflowId: req.params.id,
      webhookUrl: targetUrl,
      status: 'failed',
      error: error.message || 'Failed to run workflow',
      triggeredAt: new Date(),
      triggeredBy: req.user!.id
    });
    persistDb();
    res.status(500).json({ error: error.message || 'Failed to run workflow' });
  }
});

// POST /n8n/workflows/:id/activate - Toggle workflow active status
router.post('/n8n/workflows/:id/activate', async (req: Request, res: Response) => {
  const { baseUrl, apiKey, apiVersion, enabled } = getN8nConfig();
  if (!enabled || !baseUrl || !apiKey) {
    return res.status(400).json({ error: 'n8n is not configured' });
  }
  const active = req.body.active === true;
  const action = active ? 'activate' : 'deactivate';
  const url = `${normalizeBaseUrl(baseUrl)}/api/v${apiVersion}/workflows/${req.params.id}/${action}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to update workflow status' });
    }
    db.auditLogs.push({
      id: uuidv4(),
      actorId: req.user!.id,
      action: `workflow_${action}`,
      targetType: 'integration',
      targetId: req.params.id,
      createdAt: new Date()
    });
    res.json({ ok: true, active });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update workflow status' });
  }
});

// GET /n8n/workflows - List workflows from n8n
router.get('/n8n/workflows', async (req: Request, res: Response) => {
  const { baseUrl, apiKey, apiVersion, enabled } = getN8nConfig();
  if (!enabled || !baseUrl || !apiKey) {
    return res.status(400).json({ error: 'n8n is not configured' });
  }
  const active = req.query.active as string | undefined;
  const query = active ? `?active=${active}` : '';
  const url = `${normalizeBaseUrl(baseUrl)}/api/v${apiVersion}/workflows${query}`;
  try {
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch workflows' });
    }
    const data = await response.json();
    res.json({ workflows: data?.data ?? data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch workflows' });
  }
});

// GET /n8n/runs - List stored workflow runs
router.get('/n8n/runs', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const workflowId = req.query.workflowId as string | undefined;
  let runs = [...db.n8nWorkflowRuns];
  if (workflowId) {
    runs = runs.filter((run) => run.workflowId === workflowId);
  }
  const results = runs
    .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
    .slice(0, limit)
    .map((run) => ({
      id: run.id,
      workflowId: run.workflowId,
      webhookUrl: run.webhookUrl,
      status: run.status,
      responseStatus: run.responseStatus,
      error: run.error,
      triggeredAt: run.triggeredAt.toISOString(),
      triggeredBy: run.triggeredBy
    }));
  res.json({ runs: results });
});

// POST /n8n/trigger - Send payload to a configured n8n webhook
router.post('/n8n/trigger', async (req: Request, res: Response) => {
  const { webhookUrl } = getN8nConfig();
  const targetUrl = (req.body.webhookUrl as string) || webhookUrl;
  if (!targetUrl) {
    return res.status(400).json({ error: 'No webhook URL configured' });
  }
  const payload = {
    event: req.body.event || 'social_schedule',
    channel: req.body.channel || 'generic',
    payload: req.body.payload || {},
    source: 'neuronest-admin',
    createdAt: new Date().toISOString()
  };
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (req.body.scheduleId) {
      const entry = db.socialSchedules.find((item) => item.id === req.body.scheduleId);
      if (entry) {
        entry.status = response.ok ? 'sent' : 'failed';
        entry.updatedAt = new Date();
      }
    }
    db.auditLogs.push({
      id: uuidv4(),
      actorId: req.user!.id,
      action: 'trigger_n8n_webhook',
      targetType: 'integration',
      metadata: { event: payload.event, channel: payload.channel },
      createdAt: new Date()
    });
    res.json({ ok: response.ok, status: response.status });
    persistDb();
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to trigger webhook' });
  }
});

// GET /env - view environment variables
router.get('/env', (req: Request, res: Response) => {
  const envVars = ENV_ALLOWLIST.map((entry) => {
    const value = process.env[entry.key] || '';
    return {
      key: entry.key,
      description: entry.description,
      isSecret: entry.isSecret,
      restartRequired: entry.restartRequired,
      isSet: Boolean(value),
      valueMasked: maskEnvValue(value, entry.isSecret)
    };
  });

  res.json({ vars: envVars });
});

// PATCH /env - update environment variables
router.patch('/env', (req: Request, res: Response) => {
  const key = req.body.key as string;
  const value = req.body.value as string | undefined;
  const entry = ENV_ALLOWLIST.find((envVar) => envVar.key === key);

  if (!entry) {
    return res.status(400).json({ error: 'Unsupported environment variable' });
  }

  if (value === undefined) {
    return res.status(400).json({ error: 'Missing value' });
  }

  if (value === '') {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  if (key.startsWith('N8N_')) {
    const updates: Partial<ReturnType<typeof getN8nConfig>> = {};
    if (key === 'N8N_BASE_URL') updates.baseUrl = value;
    if (key === 'N8N_API_KEY') updates.apiKey = value;
    if (key === 'N8N_API_VERSION') updates.apiVersion = Number(value) || 1;
    if (key === 'N8N_WEBHOOK_URL') updates.webhookUrl = value;
    if (key === 'N8N_ENABLED') updates.enabled = value === 'true';
    updateN8nConfig(updates);
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_env_var',
    targetType: 'system',
    metadata: { key },
    createdAt: new Date()
  });

  res.json({
    key,
    valueMasked: maskEnvValue(process.env[key] || '', entry.isSecret),
    isSet: Boolean(process.env[key]),
    restartRequired: entry.restartRequired
  });
});

// GET /integrations - Check real integration status
router.get('/integrations', async (req: Request, res: Response) => {
  const integrations = [];

  // Check Stripe connection
  if (stripe) {
    try {
      await stripe.accounts.retrieve();
      integrations.push({
        id: 'stripe',
        name: 'Stripe',
        status: 'connected',
        description: 'Payment processing'
      });
    } catch {
      integrations.push({
        id: 'stripe',
        name: 'Stripe',
        status: 'error',
        description: 'Payment processing'
      });
    }
  } else {
    integrations.push({
      id: 'stripe',
      name: 'Stripe',
      status: 'disconnected',
      description: 'Payment processing'
    });
  }

  // Check Gemini connection
  integrations.push({
    id: 'gemini',
    name: 'Google Gemini',
    status: process.env.GEMINI_API_KEY ? 'connected' : 'disconnected',
    description: 'AI message explanations'
  });

  const n8nStatus = await checkN8nConnection();
  integrations.push({
    id: 'n8n',
    name: 'n8n',
    status: n8nStatus.status,
    description: 'Social scheduling & automation workflows'
  });

  res.json({ integrations });
});

// ─── Selfie Verification Review ──────────────────────────────────

// GET /admin/verifications — list all users with selfie verification data
router.get('/verifications', (req: Request, res: Response) => {
  const { status } = req.query;
  let users = db.users.filter((u) => u.selfieVerification && u.selfieVerification.status !== 'none');

  if (status && typeof status === 'string') {
    users = users.filter((u) => u.selfieVerification.status === status);
  }

  const verifications = users.map((u) => ({
    userId: u.id,
    userName: u.name,
    email: u.email,
    avatar: u.avatar,
    status: u.selfieVerification.status,
    authenticityScore: u.selfieVerification.authenticityScore,
    selfieDataUrl: u.selfieVerification.selfieDataUrl,
    submittedAt: u.selfieVerification.submittedAt,
    verifiedAt: u.selfieVerification.verifiedAt,
    reviewedBy: u.selfieVerification.reviewedBy,
    reviewNotes: u.selfieVerification.reviewNotes
  }));

  // Sort: pending first, then by submittedAt desc
  verifications.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return bTime - aTime;
  });

  res.json({ verifications, total: verifications.length, pending: verifications.filter((v) => v.status === 'pending').length });
});

// GET /admin/verifications/:userId — get detail for a single user's verification
router.get('/verifications/:userId', (req: Request, res: Response) => {
  const user = findUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    userId: user.id,
    userName: user.name,
    email: user.email,
    avatar: user.avatar,
    selfieVerification: user.selfieVerification,
    verification: user.verification,
    createdAt: user.createdAt
  });
});

// PATCH /admin/verifications/:userId/approve — approve a pending selfie
router.patch('/verifications/:userId/approve', (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const user = findUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.selfieVerification.status !== 'pending') {
    return res.status(400).json({ error: `Cannot approve — current status is "${user.selfieVerification.status}"` });
  }

  const { notes } = req.body;
  const updatedVerification = {
    ...user.selfieVerification,
    status: 'verified' as const,
    verifiedAt: new Date(),
    reviewedBy: adminId,
    reviewNotes: notes || undefined
  };

  updateUser(user.id, {
    selfieVerification: updatedVerification,
    verification: { ...user.verification, photo: true }
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: adminId,
    action: 'selfie_verification_approved',
    targetType: 'user',
    targetId: user.id,
    metadata: { notes, authenticityScore: updatedVerification.authenticityScore },
    createdAt: new Date()
  });

  res.json({ success: true, verification: updatedVerification });
});

// PATCH /admin/verifications/:userId/reject — reject a pending selfie
router.patch('/verifications/:userId/reject', (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const user = findUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.selfieVerification.status !== 'pending') {
    return res.status(400).json({ error: `Cannot reject — current status is "${user.selfieVerification.status}"` });
  }

  const { notes } = req.body;
  const updatedVerification = {
    ...user.selfieVerification,
    status: 'rejected' as const,
    reviewedBy: adminId,
    reviewNotes: notes || 'Verification did not meet requirements.'
  };

  updateUser(user.id, {
    selfieVerification: updatedVerification,
    verification: { ...user.verification, photo: false }
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: adminId,
    action: 'selfie_verification_rejected',
    targetType: 'user',
    targetId: user.id,
    metadata: { notes },
    createdAt: new Date()
  });

  res.json({ success: true, verification: updatedVerification });
});

// PATCH /admin/verifications/:userId/reset — reset verification to allow re-submission
router.patch('/verifications/:userId/reset', (req: Request, res: Response) => {
  const adminId = req.user!.id;
  const user = findUserById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  updateUser(user.id, {
    selfieVerification: { status: 'none' as const },
    verification: { ...user.verification, photo: false }
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: adminId,
    action: 'selfie_verification_reset',
    targetType: 'user',
    targetId: user.id,
    metadata: {},
    createdAt: new Date()
  });

  res.json({ success: true });
});

// GET /ads - Get ad configuration
router.get('/ads', (req: Request, res: Response) => {
  res.json({ adConfig: getAdConfig() });
});

// PATCH /ads - Update ad configuration
router.patch('/ads', (req: Request, res: Response) => {
  const next = updateAdConfig(req.body);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'update_ad_config',
    targetType: 'system',
    metadata: req.body,
    createdAt: new Date()
  });
  res.json({ adConfig: next });
});

// ─── Feedback Management ───────────────────────────────────

// GET /feedback - List all feedback
router.get('/feedback', (req: Request, res: Response) => {
  const { status, area } = req.query;
  let items = [...db.feedback];
  if (status && typeof status === 'string') {
    items = items.filter((f) => f.status === status);
  }
  if (area && typeof area === 'string') {
    items = items.filter((f) => f.area === area);
  }
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({
    feedback: items.map((f) => ({
      id: f.id,
      userId: f.userId,
      userName: f.userName,
      anonymous: f.anonymous,
      area: f.area,
      rating: f.rating,
      message: f.message,
      status: f.status,
      adminNotes: f.adminNotes,
      createdAt: f.createdAt.toISOString()
    })),
    total: items.length
  });
});

// PATCH /feedback/:id - Update feedback status / admin notes
router.patch('/feedback/:id', (req: Request, res: Response) => {
  const entry = db.feedback.find((f) => f.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Feedback not found' });

  if (req.body.status) entry.status = req.body.status;
  if (req.body.adminNotes !== undefined) entry.adminNotes = req.body.adminNotes;

  res.json({ feedback: { ...entry, createdAt: entry.createdAt.toISOString() } });
});

// ─── Changelog Management ──────────────────────────────────

// GET /changelog - List all changelog entries
router.get('/changelog', (_req: Request, res: Response) => {
  const entries = [...db.changelog]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      feedbackId: e.feedbackId,
      feedbackQuote: e.feedbackQuote,
      version: e.version,
      publishedAt: e.publishedAt.toISOString(),
      createdAt: e.createdAt.toISOString()
    }));
  res.json({ entries });
});

// POST /changelog - Create a changelog entry
router.post('/changelog', (req: Request, res: Response) => {
  const { title, description, category, feedbackId, version } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }

  let feedbackQuote: string | undefined;
  if (feedbackId) {
    const fb = db.feedback.find((f) => f.id === feedbackId);
    if (fb) {
      feedbackQuote = fb.message;
      if (fb.status === 'reviewed') fb.status = 'actioned';
    }
  }

  const now = new Date();
  const entry = {
    id: uuidv4(),
    title,
    description,
    category: category || 'improvement',
    feedbackId,
    feedbackQuote,
    version: version || undefined,
    publishedAt: now,
    createdAt: now
  };

  db.changelog.push(entry);

  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.user!.id,
    action: 'create_changelog',
    targetType: 'changelog',
    targetId: entry.id,
    metadata: { title },
    createdAt: now
  });

  res.status(201).json({
    entry: { ...entry, publishedAt: entry.publishedAt.toISOString(), createdAt: entry.createdAt.toISOString() }
  });
});

// PATCH /changelog/:id - Update a changelog entry
router.patch('/changelog/:id', (req: Request, res: Response) => {
  const entry = db.changelog.find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  if (req.body.title !== undefined) entry.title = req.body.title;
  if (req.body.description !== undefined) entry.description = req.body.description;
  if (req.body.category !== undefined) entry.category = req.body.category;
  if (req.body.version !== undefined) entry.version = req.body.version;

  if (req.body.feedbackId !== undefined) {
    entry.feedbackId = req.body.feedbackId;
    if (req.body.feedbackId) {
      const fb = db.feedback.find((f) => f.id === req.body.feedbackId);
      entry.feedbackQuote = fb?.message;
    } else {
      entry.feedbackQuote = undefined;
    }
  }

  res.json({
    entry: { ...entry, publishedAt: entry.publishedAt.toISOString(), createdAt: entry.createdAt.toISOString() }
  });
});

// DELETE /changelog/:id - Delete a changelog entry
router.delete('/changelog/:id', (req: Request, res: Response) => {
  const idx = db.changelog.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
  db.changelog.splice(idx, 1);
  res.json({ success: true });
});

// GET /age-verification - Get age verification config
router.get('/age-verification', (_req: Request, res: Response) => {
  const config = getAgeVerificationConfig();
  res.json({
    ...config,
    yotiApiKey: config.yotiApiKey ? '***configured***' : ''
  });
});

// PUT /age-verification - Update age verification config
router.put('/age-verification', (req: Request, res: Response) => {
  const updates = req.body;
  // Don't overwrite API key with the masked value
  if (updates.yotiApiKey === '***configured***') {
    delete updates.yotiApiKey;
  }
  const config = updateAgeVerificationConfig(updates);
  res.json({
    ...config,
    yotiApiKey: config.yotiApiKey ? '***configured***' : ''
  });
});

export default router;
