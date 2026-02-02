import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById } from '../db/index.js';

const router = Router();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

router.use(authenticateToken);

// Admin settings stored in db
interface AdminSettings {
  siteName: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxMatchesPerDay: number;
  aiExplanationsEnabled: boolean;
}

let settings: AdminSettings = {
  siteName: 'NeuroNest',
  maintenanceMode: false,
  registrationEnabled: true,
  maxMatchesPerDay: 20,
  aiExplanationsEnabled: true
};

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
      subscription: user.subscription,
      verification: user.verification,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.lastActive.toISOString(),
      isOnline: user.isOnline
    }
  });
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
  res.json({ settings });
});

// PATCH /settings - Update settings
router.patch('/settings', (req: Request, res: Response) => {
  const allowedKeys: (keyof AdminSettings)[] = [
    'siteName', 'maintenanceMode', 'registrationEnabled',
    'maxMatchesPerDay', 'aiExplanationsEnabled'
  ];

  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      (settings as any)[key] = req.body[key];
    }
  }

  res.json({ settings });
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
