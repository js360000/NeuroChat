import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById, User, persistDb } from '../db/index.js';

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

router.get('/me/export', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const user = findUserById(currentUserId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const conversations = db.conversations.filter((conversation) =>
    conversation.participants.includes(currentUserId)
  );
  const conversationIds = new Set(conversations.map((conversation) => conversation.id));

  const exportBundle = {
    profile: toUserProfile(user),
    matches: db.matches.filter(
      (match) => match.userId1 === currentUserId || match.userId2 === currentUserId
    ),
    conversations,
    messages: db.messages.filter(
      (message) => message.senderId === currentUserId || conversationIds.has(message.conversationId)
    ),
    likes: db.likes.filter(
      (like) => like.fromUserId === currentUserId || like.toUserId === currentUserId
    ),
    blocks: db.blocks.filter(
      (block) => block.blockerId === currentUserId || block.blockedId === currentUserId
    ),
    reports: db.reports.filter(
      (report) => report.reporterId === currentUserId || report.targetId === currentUserId
    ),
    communityPosts: db.communityPosts.filter((post) => post.authorId === currentUserId),
    communityComments: db.communityComments.filter((comment) => comment.authorId === currentUserId),
    communityReactions: db.communityReactions.filter((reaction) => reaction.userId === currentUserId),
    blogPosts: db.blogPosts.filter((post) => post.authorId === currentUserId),
    blogComments: db.blogComments.filter((comment) => comment.authorId === currentUserId)
  };

  res.json({ data: exportBundle });
});

router.delete('/me', authenticateToken, (req: Request, res: Response): void => {
  const currentUserId = req.user!.id;
  const confirm = req.body?.confirm;
  if (confirm !== 'DELETE') {
    res.status(400).json({ error: 'Confirmation required' });
    return;
  }

  const user = findUserById(currentUserId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const conversationsToRemove = db.conversations
    .filter((conversation) => conversation.participants.includes(currentUserId))
    .map((conversation) => conversation.id);

  db.users = db.users.filter((u) => u.id !== currentUserId);
  db.matches = db.matches.filter(
    (match) => match.userId1 !== currentUserId && match.userId2 !== currentUserId
  );
  db.likes = db.likes.filter(
    (like) => like.fromUserId !== currentUserId && like.toUserId !== currentUserId
  );
  db.blocks = db.blocks.filter(
    (block) => block.blockerId !== currentUserId && block.blockedId !== currentUserId
  );
  db.reports = db.reports.filter(
    (report) => report.reporterId !== currentUserId && report.targetId !== currentUserId
  );
  db.communityPosts = db.communityPosts.filter((post) => post.authorId !== currentUserId);
  db.communityComments = db.communityComments.filter((comment) => comment.authorId !== currentUserId);
  db.communityReactions = db.communityReactions.filter((reaction) => reaction.userId !== currentUserId);
  db.blogPosts = db.blogPosts.filter((post) => post.authorId !== currentUserId);
  db.blogComments = db.blogComments.filter((comment) => comment.authorId !== currentUserId);
  db.messages = db.messages.filter(
    (message) =>
      message.senderId !== currentUserId &&
      !conversationsToRemove.includes(message.conversationId)
  );
  db.conversations = db.conversations.filter(
    (conversation) => !conversationsToRemove.includes(conversation.id)
  );

  db.auditLogs.push({
    id: uuidv4(),
    actorId: currentUserId,
    action: 'delete_account',
    targetType: 'system',
    metadata: { userId: currentUserId },
    createdAt: new Date()
  });
  persistDb();

  res.json({ ok: true });
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
    targetType: 'user',
    targetId: targetUserId,
    reason,
    description: details,
    status: 'pending',
    createdAt: new Date(),
  });

  res.json({ message: 'Report submitted successfully' });
});

export default router;
