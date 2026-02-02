import { Router } from 'express';
import authRouter from './auth.js';
import usersRouter from './users.js';
import messagesRouter from './messages.js';
import paymentsRouter from './payments.js';
import aiRouter from './ai.js';
import adminRouter from './admin.js';
import blogRouter from './blog.js';
import communityRouter from './community.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/messages', messagesRouter);
router.use('/payments', paymentsRouter);
router.use('/ai', aiRouter);
router.use('/admin', adminRouter);
router.use('/blog', blogRouter);
router.use('/community', communityRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
