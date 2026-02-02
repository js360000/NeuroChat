import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById, User } from '../db/index.js';

const router = Router();

type UserProfile = Omit<User, 'password'>;

function toUserProfile(user: User): UserProfile {
  const { password, ...profile } = user;
  return profile;
}

router.get('/', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;

  const blockedUserIds = new Set(
    db.blocks
      .filter((b) => b.blockerId === currentUserId || b.blockedId === currentUserId)
      .map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId))
  );

  const matchedUserIds = new Set(
    db.matches
      .filter(
        (m) =>
          (m.userId1 === currentUserId || m.userId2 === currentUserId) &&
          m.status === 'matched'
      )
      .map((m) => (m.userId1 === currentUserId ? m.userId2 : m.userId1))
  );

  const users = db.users
    .filter(
      (user) =>
        user.id !== currentUserId &&
        user.role !== 'admin' &&
        !blockedUserIds.has(user.id) &&
        !matchedUserIds.has(user.id)
    )
    .map((user) => ({
      ...toUserProfile(user),
      isOnline: user.isOnline,
    }));

  res.json({ users });
});

router.get('/me/matches', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;

  const matches = db.matches
    .filter(
      (m) =>
        (m.userId1 === currentUserId || m.userId2 === currentUserId) &&
        m.status === 'matched'
    )
    .map((match) => {
      const otherUserId = match.userId1 === currentUserId ? match.userId2 : match.userId1;
      const otherUser = findUserById(otherUserId);
      return {
        ...match,
        user: otherUser ? toUserProfile(otherUser) : null,
      };
    });

  res.json({ matches });
});

router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  const user = findUserById(req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user: toUserProfile(user) });
});

router.post('/:id/like', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.id;

  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if (targetUser.role === 'admin') {
    res.status(400).json({ error: 'User not available' });
    return;
  }

  const existingLike = db.likes.find(
    (l) => l.fromUserId === currentUserId && l.toUserId === targetUserId
  );
  if (existingLike) {
    res.status(400).json({ error: 'Already liked this user' });
    return;
  }

  db.likes.push({
    id: uuidv4(),
    fromUserId: currentUserId,
    toUserId: targetUserId,
    createdAt: new Date(),
  });

  const mutualLike = db.likes.find(
    (l) => l.fromUserId === targetUserId && l.toUserId === currentUserId
  );

  if (mutualLike) {
    const matchId = uuidv4();
    db.matches.push({
      id: matchId,
      userId1: currentUserId,
      userId2: targetUserId,
      matchedAt: new Date(),
      status: 'matched',
    });

    const conversationId = uuidv4();
    db.conversations.push({
      id: conversationId,
      participants: [currentUserId, targetUserId],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ message: 'It\'s a match!', match: true, conversationId });
    return;
  }

  res.json({ message: 'Like sent', match: false });
});

router.delete('/:id/unmatch', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.id;

  const match = db.matches.find(
    (m) =>
      ((m.userId1 === currentUserId && m.userId2 === targetUserId) ||
        (m.userId1 === targetUserId && m.userId2 === currentUserId)) &&
      m.status === 'matched'
  );

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  match.status = 'unmatched';

  res.json({ message: 'Unmatched successfully' });
});

router.post('/:id/block', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.id;

  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const existingBlock = db.blocks.find(
    (b) => b.blockerId === currentUserId && b.blockedId === targetUserId
  );
  if (existingBlock) {
    res.status(400).json({ error: 'User already blocked' });
    return;
  }

  db.blocks.push({
    id: uuidv4(),
    blockerId: currentUserId,
    blockedId: targetUserId,
    createdAt: new Date(),
  });

  res.json({ message: 'User blocked successfully' });
});

router.post('/:id/report', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.id;
  const { reason, details } = req.body;

  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!reason) {
    res.status(400).json({ error: 'Reason is required' });
    return;
  }

  db.reports.push({
    id: uuidv4(),
    reporterId: currentUserId,
    reportedId: targetUserId,
    reason,
    description: details,
    status: 'pending',
    createdAt: new Date(),
  });

  res.json({ message: 'Report submitted successfully' });
});

export default router;
