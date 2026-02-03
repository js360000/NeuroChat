import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById } from '../db/index.js';
import { getIO } from '../realtime.js';

const router = Router();

router.use(authenticateToken);

// GET /conversations - Get all conversations for current user
router.get('/conversations', (req, res) => {
  const userId = (req as any).user.id;
  
  const userConversations = db.conversations.filter(
    c => c.participants.includes(userId)
  );
  
  const conversations = userConversations.map(conv => {
    const otherUserId = conv.participants.find(p => p !== userId) || '';
    const otherUser = findUserById(otherUserId);
    
    const convMessages = db.messages
      .filter(m => m.conversationId === conv.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const lastMessage = convMessages[0];
    const unreadCount = convMessages.filter(
      m => m.senderId !== userId && !m.readAt
    ).length;
    
    return {
      id: conv.id,
      tags: conv.tags || [],
      user: otherUser ? {
        id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar,
        isOnline: otherUser.isOnline,
        communicationPreferences: {
          responsePace: otherUser.communicationPreferences.responsePace || 'balanced',
          directness: otherUser.communicationPreferences.directness || 'gentle'
        },
        quietHours: otherUser.quietHours,
        boundaries: otherUser.boundaries || [],
        connectionGoals: otherUser.connectionGoals || [],
        verification: otherUser.verification
      } : null,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        content: lastMessage.content,
        toneTag: lastMessage.toneTag,
        createdAt: lastMessage.createdAt,
        isMe: lastMessage.senderId === userId
      } : undefined,
      unreadCount,
      updatedAt: conv.updatedAt
    };
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  res.json({ conversations });
});

// GET /conversations/:conversationId - Get messages in conversation
router.get('/conversations/:conversationId', (req, res) => {
  const userId = (req as any).user.id;
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string;
  
  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  if (!conversation.participants.includes(userId)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  let messages = db.messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (before) {
    const beforeIndex = messages.findIndex(m => m.id === before);
    if (beforeIndex !== -1) {
      messages = messages.slice(beforeIndex + 1);
    }
  }
  
  messages = messages.slice(0, limit);
  
  const formattedMessages = messages.map(m => {
    const sender = findUserById(m.senderId);
    return {
      id: m.id,
      content: m.content,
      toneTag: m.toneTag,
      sender: {
        id: m.senderId,
        name: sender?.name || 'Unknown',
        avatar: sender?.avatar
      },
      createdAt: m.createdAt,
      readAt: m.readAt,
      isMe: m.senderId === userId
    };
  });
  
  res.json({ messages: formattedMessages });
});

// POST /conversations/:conversationId - Send message
router.post('/conversations/:conversationId', (req, res) => {
  const userId = (req as any).user.id;
  const { conversationId } = req.params;
  const { content, toneTag } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  if (!conversation.participants.includes(userId)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  const sender = findUserById(userId);
  const message = {
    id: uuidv4(),
    conversationId,
    senderId: userId,
    content,
    toneTag,
    createdAt: new Date(),
    readAt: undefined
  };
  
  db.messages.push(message);
  conversation.updatedAt = new Date();
  
  const formattedMessage = {
    id: message.id,
    conversationId,
    content: message.content,
    toneTag: message.toneTag,
    sender: {
      id: userId,
      name: sender?.name || 'Unknown',
      avatar: sender?.avatar
    },
    createdAt: message.createdAt,
    readAt: message.readAt,
    isMe: true
  };

  const io = getIO();
  if (io) {
    io.to(conversationId).emit('message', {
      conversationId,
      message: {
        ...formattedMessage,
        isMe: false
      }
    });
  }

  res.json({ message: formattedMessage });
});

// POST /conversations/:conversationId/read - Mark as read
router.post('/conversations/:conversationId/read', (req, res) => {
  const userId = (req as any).user.id;
  const { conversationId } = req.params;
  
  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  if (!conversation.participants.includes(userId)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  db.messages
    .filter(m => m.conversationId === conversationId && m.senderId !== userId && !m.readAt)
    .forEach(m => {
      m.readAt = new Date();
    });

  const io = getIO();
  if (io) {
    io.to(conversationId).emit('read', {
      conversationId,
      userId
    });
  }

  res.json({ success: true });
});

// POST /conversations - Create new conversation
router.post('/conversations', (req, res) => {
  const userId = (req as any).user.id;
  const { userId: otherUserId } = req.body;
  
  if (!otherUserId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const existingConversation = db.conversations.find(
    c => c.participants.includes(userId) && c.participants.includes(otherUserId)
  );
  
  if (existingConversation) {
    return res.json({ conversationId: existingConversation.id });
  }
  
  const conversation = {
    id: uuidv4(),
    participants: [userId, otherUserId],
    tags: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.conversations.push(conversation);
  
  res.json({ conversationId: conversation.id });
});

// PATCH /conversations/:conversationId/tags - update conversation tags
router.patch('/conversations/:conversationId/tags', (req, res) => {
  const userId = (req as any).user.id;
  const { conversationId } = req.params;
  const tags = req.body.tags as string[] | undefined;

  if (!Array.isArray(tags)) {
    return res.status(400).json({ error: 'tags must be an array of strings' });
  }

  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  if (!conversation.participants.includes(userId)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  conversation.tags = tags.map((tag) => tag.trim()).filter(Boolean);
  conversation.updatedAt = new Date();

  res.json({ tags: conversation.tags });
});

export default router;
