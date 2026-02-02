import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, persistDb } from '../db/index.js';

const router = Router();

// POST /consent - log cookie consent preferences
router.post('/', (req, res) => {
  const analytics = Boolean(req.body?.analytics);
  const marketing = Boolean(req.body?.marketing);

  const entry = {
    id: uuidv4(),
    analytics,
    marketing,
    userAgent: req.get('user-agent') || '',
    ip: req.ip || '',
    createdAt: new Date()
  };

  db.cookieConsents.push(entry);
  persistDb();

  res.json({ ok: true });
});

export default router;
