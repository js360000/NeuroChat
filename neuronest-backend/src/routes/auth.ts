import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { findUserByEmail, findUserById, createUser, updateUser } from '../db/index.js';
import { getSettings } from '../config/settings.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const settings = getSettings();
    if (settings.maintenanceMode) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Try again later.' });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Contact support for assistance.' });
    }

    // Update online status
    user.isOnline = true;
    user.lastActive = new Date();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const settings = getSettings();
    if (settings.maintenanceMode) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Try again later.' });
    }
    if (!settings.registrationEnabled) {
      return res.status(403).json({ error: 'Registration is currently disabled' });
    }
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      email,
      password: hashedPassword,
      name,
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout
router.post('/logout', (_req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

// GET /me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /profile
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      'name',
      'bio',
      'avatar',
      'neurodivergentTraits',
      'specialInterests',
      'communicationPreferences',
      'experiencePreferences',
      'connectionGoals',
      'onboarding',
      'matchPreferences',
      'quietHours',
      'boundaries',
      'safetyChecklist',
      'accessibilityPreset',
      'isPaused',
      'blockNsfwImages',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Enforce name change limit: max 2 per rolling 30-day window
    if (updates.name && typeof updates.name === 'string') {
      const currentUser = findUserById(req.user!.id);
      if (currentUser && updates.name !== currentUser.name) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentChanges = (currentUser.nameChanges || []).filter(
          (d) => new Date(d).getTime() > thirtyDaysAgo.getTime()
        );
        if (recentChanges.length >= 2) {
          return res.status(429).json({
            error: 'You can only change your name twice per month. Please try again later.',
            nameChangesRemaining: 0,
            nextChangeAvailable: new Date(
              Math.min(...recentChanges.map((d) => new Date(d).getTime())) + 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          });
        }
        updates.nameChanges = [...recentChanges, new Date()];
      } else {
        // Same name — no change counted
        delete updates.name;
      }
    }

    if (updates.onboarding && typeof updates.onboarding === 'object') {
      const onboarding = updates.onboarding as { completed?: boolean; completedAt?: string | Date };
      if (onboarding.completedAt) {
        onboarding.completedAt = new Date(onboarding.completedAt);
      }
      updates.onboarding = onboarding;
    }

    const user = await updateUser(req.user!.id, updates);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
