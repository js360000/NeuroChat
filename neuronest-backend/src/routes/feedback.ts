import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { db, findUserById, type Feedback } from '../db/index.js';

const router = Router();

// POST /feedback - Submit feedback (public, optionally authenticated)
router.post('/', (req: Request, res: Response) => {
  const { area, rating, message, anonymous } = req.body;

  if (!area || !message) {
    return res.status(400).json({ error: 'area and message are required' });
  }

  // Try to extract user from token if present (optional auth)
  let userId: string | undefined;
  let userName: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = findUserById(decoded.id);
      if (user) {
        userId = user.id;
        userName = user.name;
      }
    } catch {
      // Invalid token — treat as anonymous, that's fine
    }
  }

  const isAnonymous = anonymous === true || !userId;

  const entry: Feedback = {
    id: uuidv4(),
    userId: isAnonymous ? undefined : userId,
    userName: isAnonymous ? undefined : userName,
    anonymous: isAnonymous,
    area,
    rating: typeof rating === 'number' ? Math.min(5, Math.max(1, rating)) : 3,
    message,
    status: 'new',
    createdAt: new Date()
  };

  db.feedback.push(entry);

  res.status(201).json({
    success: true,
    id: entry.id,
    message: 'Thank you for your feedback!'
  });
});

// GET /feedback/changelog - Public changelog
router.get('/changelog', (_req: Request, res: Response) => {
  const entries = [...db.changelog]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      category: entry.category,
      feedbackQuote: entry.feedbackQuote || undefined,
      version: entry.version,
      publishedAt: entry.publishedAt.toISOString()
    }));

  res.json({ entries });
});

export default router;
