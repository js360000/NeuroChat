import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { db, findUserById } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { getSettings, updateSettings } from '../config/settings.js';

const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

router.use(authenticateToken, requireAdmin);


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

  res.json({ integrations });
});

export default router;
