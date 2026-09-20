import express from 'express';
import crypto from 'crypto';
import db from '../database/db.js';
import { moderationService } from '../services/moderationService.js';
import { generateChatResponse } from '../services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/**
 * POST /api/chat
 * Moderation gate strictly runs BEFORE any assistant generation.
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        allowed: false,
        flagged: false,
        error: true,
        message: 'Please enter a message.'
      });
    }

    if (message.trim().length > 4000) {
      return res.status(400).json({
        allowed: false,
        flagged: true,
        category: 'other',
        reason: 'Your message is too long. Please shorten it and try again.'
      });
    }

    // 1. STEP 1: MODERATION GATE (Mandatory Server-Side Enforcement)
    const modResult = await moderationService.moderate(message);

    // 2. STEP 2: CHECK MODERATION OUTCOME
    if (modResult.flagged) {
      // Message blocked. Never deliver to chat or generate response.
      return res.status(200).json({
        allowed: false,
        flagged: true,
        category: modResult.category,
        reason: modResult.reason,
        message: null
      });
    }

    // 3. STEP 3: MESSAGE APPROVED -> SAVE TO DB & DISPATCH TO GEMINI ASSISTANT
    const nowIso = new Date().toISOString();
    const userMsgId = modResult.messageId || `msg_${crypto.randomUUID()}`;

    try {
      db.prepare(`
        INSERT INTO messages (id, content, role, createdAt)
        VALUES (?, ?, 'user', ?)
      `).run(userMsgId, message.trim(), nowIso);
    } catch (dbErr) {
      console.error('Failed to log user message in DB:', dbErr);
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    // Generate assistant reply
    const assistantReplyText = await generateChatResponse(
      message.trim(),
      conversationHistory,
      apiKey,
      modelName
    );

    const assistantMsgId = `msg_${crypto.randomUUID()}`;
    const assistantTimestamp = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO messages (id, content, role, createdAt)
        VALUES (?, ?, 'assistant', ?)
      `).run(assistantMsgId, assistantReplyText, assistantTimestamp);
    } catch (dbErr) {
      console.error('Failed to log assistant message in DB:', dbErr);
    }

    return res.status(200).json({
      allowed: true,
      flagged: false,
      category: null,
      reason: null,
      message: {
        id: assistantMsgId,
        role: 'assistant',
        content: assistantReplyText,
        createdAt: assistantTimestamp
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/history
 * Returns recent approved chat messages.
 */
router.get('/chat/history', (req, res) => {
  try {
    const messages = db.prepare('SELECT id, content, role, createdAt FROM messages ORDER BY createdAt ASC LIMIT 50').all();
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

/**
 * DELETE /api/chat/history
 * Clears chat conversation history.
 */
router.delete('/chat/history', (req, res) => {
  try {
    db.prepare('DELETE FROM messages').run();
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

export default router;
