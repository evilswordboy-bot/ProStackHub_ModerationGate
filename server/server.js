import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import moderationRoutes from './routes/moderation.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import './database/db.js'; // Ensure database initialization

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

// Security and CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly fallback
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ModerationGate AI',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route registration
app.use('/api', moderationRoutes);
app.use('/api', chatRoutes);
app.use('/api/admin', adminRoutes);

// If in production and client build exists, serve static client files
const clientDistPath = path.join(__dirname, '..', 'dist');
app.use(express.static(clientDistPath));

// Client SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ModerationGate AI Server running on http://localhost:${PORT}`);
  console.log(`🛡️  Moderation Engine: Provider [${process.env.MODERATION_PROVIDER || 'gemini'}]`);
  console.log(`🔑 Gemini Key Configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
  console.log(`======================================================\n`);
});

export default app;
