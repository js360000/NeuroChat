import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById, persistDb } from '../db/index.js';
import { getIO } from '../realtime.js';
import { getAppConfig } from '../config/settings.js';
import { getPlanLimits } from '../config/premium.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '..', '..', 'data', 'uploads');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

function saveBase64Image(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return dataUrl;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const filename = `${uuidv4()}.${ext}`;
  writeFileSync(join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

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

    // Check if the other user has priority inbox (premium/pro sender)
    const otherPlan = otherUser?.subscription?.plan || 'free';
    const otherLimits = getPlanLimits(otherPlan);
    
    return {
      id: conv.id,
      tags: conv.tags || [],
      prioritySender: otherLimits.priorityInbox,
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
        blockNsfwImages: otherUser.blockNsfwImages ?? true,
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
      imageUrl: m.imageUrl,
      isNsfw: m.isNsfw,
      nsfwBlocked: m.nsfwBlocked,
      sender: {
        id: m.senderId,
        name: sender?.name || 'Unknown',
        avatar: sender?.avatar
      },
      reactions: (m as any).reactions || [],
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
  const { content, toneTag, imageUrl, isNsfw } = req.body;
  
  if (!content && !imageUrl) {
    return res.status(400).json({ error: 'Content or image is required' });
  }
  
  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  if (!conversation.participants.includes(userId)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Enforce trust-level gating for images
  if (imageUrl) {
    const effectiveLevel = conversation.trustOverride ?? conversation.trustLevel ?? 1;
    if (effectiveLevel < 2) {
      return res.status(403).json({ error: 'Image sharing requires trust level 2 or higher' });
    }
  }
  
  const sender = findUserById(userId);

  // Check if recipient blocks NSFW images
  const recipientIdForNsfw = conversation.participants.find((p) => p !== userId);
  const recipient = recipientIdForNsfw ? findUserById(recipientIdForNsfw) : null;
  const nsfwBlocked = !!(isNsfw && recipient?.blockNsfwImages);

  const message = {
    id: uuidv4(),
    conversationId,
    senderId: userId,
    content: content || '',
    toneTag,
    imageUrl: imageUrl ? (imageUrl.startsWith('data:') ? saveBase64Image(imageUrl) : imageUrl) : undefined,
    isNsfw: isNsfw || false,
    nsfwBlocked,
    createdAt: new Date(),
    readAt: undefined
  };
  
  db.messages.push(message);
  conversation.messageCount = (conversation.messageCount || 0) + 1;
  conversation.updatedAt = new Date();

  // AI Guardian: auto-scan message for manipulation patterns
  const recipientId = conversation.participants.find((p) => p !== userId);
  if (recipientId) {
    const recipient = findUserById(recipientId);
    if (recipient && recipient.guardianSensitivity && recipient.guardianSensitivity !== 'off') {
      const config = getAppConfig();
      const lowerContent = content.toLowerCase();
      const threshold = recipient.guardianSensitivity === 'active' ? 1 : 2;
      for (const pattern of config.manipulationPatterns) {
        const matches = pattern.keywords.filter((kw: string) => lowerContent.includes(kw.toLowerCase()));
        if (matches.length >= threshold) {
          const confidence = Math.min(0.95, 0.3 + matches.length * 0.15);
          db.messageFlags.push({
            id: uuidv4(),
            messageId: message.id,
            conversationId,
            recipientId,
            patternType: pattern.type,
            confidence,
            snippet: content.substring(0, 120),
            dismissed: false,
            createdAt: new Date()
          });
        }
      }
    }
  }

  // Auto-calculate trust level based on engagement (if no manual override)
  if (conversation.trustOverride == null) {
    const ageHours = (Date.now() - conversation.createdAt.getTime()) / 3600000;
    const mc = conversation.messageCount;
    let newLevel = 1;
    if (mc >= 30 && ageHours >= 72) newLevel = 4;
    else if (mc >= 15 && ageHours >= 24) newLevel = 3;
    else if (mc >= 5 && ageHours >= 1) newLevel = 2;
    if (newLevel !== conversation.trustLevel) {
      conversation.trustLevel = newLevel;
    }
  }
  
  const formattedMessage = {
    id: message.id,
    conversationId,
    content: message.content,
    toneTag: message.toneTag,
    imageUrl: message.imageUrl,
    isNsfw: message.isNsfw,
    nsfwBlocked: message.nsfwBlocked,
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
    // Find sender's socket IDs so we can exclude them from the broadcast
    const senderSocketIds: string[] = [];
    for (const [sid, socket] of io.of('/').sockets) {
      if (socket.data.userId === userId) {
        senderSocketIds.push(sid);
      }
    }
    let target: any = io.to(conversationId);
    for (const sid of senderSocketIds) {
      target = target.except(sid);
    }
    target.emit('message', {
      conversationId,
      message: {
        ...formattedMessage,
        isMe: false
      }
    });
  }

  persistDb();
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
    trustLevel: 1,
    trustOverride: null as number | null,
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  db.conversations.push(conversation);
  persistDb();
  
  res.json({ conversationId: conversation.id });
});

// POST /conversations/:conversationId/messages/:messageId/react - toggle emoji reaction
router.post('/conversations/:conversationId/messages/:messageId/react', (req, res) => {
  const userId = (req as any).user.id;
  const { conversationId, messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji || typeof emoji !== 'string') {
    return res.status(400).json({ error: 'emoji is required' });
  }

  const conversation = db.conversations.find(c => c.id === conversationId);
  if (!conversation || !conversation.participants.includes(userId)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const message = db.messages.find(m => m.id === messageId && m.conversationId === conversationId) as any;
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (!message.reactions) message.reactions = [];

  // Toggle: remove if same emoji from same user already exists, otherwise add
  const existingIdx = message.reactions.findIndex((r: any) => r.userId === userId && r.emoji === emoji);
  if (existingIdx !== -1) {
    message.reactions.splice(existingIdx, 1);
  } else {
    message.reactions.push({ userId, emoji, createdAt: new Date() });
  }

  const io = getIO();
  if (io) {
    io.to(conversationId).emit('reaction', {
      conversationId,
      messageId,
      reactions: message.reactions
    });
  }

  persistDb();
  res.json({ reactions: message.reactions });
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
