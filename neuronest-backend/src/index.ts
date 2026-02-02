import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import routes from './routes/index.js';
import webhooksRouter from './routes/webhooks.js';
import { setIO } from './realtime.js';
import { db } from './db/index.js';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Warn if optional AI features are disabled
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not provided - AI features will be disabled');
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not provided - payments will be disabled');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('STRIPE_WEBHOOK_SECRET not provided - webhooks will be disabled');
}

const app = express();
const httpServer = createServer(app);

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('Missing required environment variable: FRONTEND_URL');
  process.exit(1);
}

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST'],
  },
});
setIO(io);

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

app.use(cors({
  origin: frontendUrl,
}));

// Stripe webhooks need raw body - must be before express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksRouter);

// JSON parsing for all other routes
app.use(express.json());

app.use('/api', routes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../app/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else if (process.env.NODE_ENV === 'production') {
  console.warn(`Frontend build not found at ${frontendDist}`);
}

io.use((socket, next) => {
  const authToken = socket.handshake.auth?.token as string | undefined;
  const header = socket.handshake.headers.authorization;
  const headerToken = header?.toString().split(' ')[1];
  const token = authToken || headerToken;

  if (!token) {
    return next(new Error('Unauthorized'));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
    socket.data.userId = decoded.id;
    socket.data.userEmail = decoded.email;
    return next();
  } catch {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (conversationId: string) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    const conversation = db.conversations.find((c) => c.id === conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return;
    }
    socket.join(conversationId);
  });

  socket.on('leave', (conversationId: string) => {
    socket.leave(conversationId);
  });

  socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    socket.to(data.conversationId).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
