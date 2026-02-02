import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { db, findUserById, findSitePageBySlug } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { getSettings, updateSettings, getN8nConfig, updateN8nConfig } from '../config/settings.js';

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
    key: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
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
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        toneTag: post.toneTag,
        contentWarning: post.contentWarning,
        hidden: post.hidden === true,
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

  // Check OpenAI connection
  integrations.push({
    id: 'openai',
    name: 'OpenAI',
    status: process.env.OPENAI_API_KEY ? 'connected' : 'disconnected',
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

export default router;
