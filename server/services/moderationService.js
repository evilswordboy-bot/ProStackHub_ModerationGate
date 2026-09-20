import crypto from 'crypto';
import db from '../database/db.js';
import { moderateWithGemini, validateModerationResult } from './geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

class ModerationService {
  constructor() {
    this.provider = process.env.MODERATION_PROVIDER || 'gemini';
  }

  /**
   * Main entry point for content moderation.
   * Replaceable provider architecture.
   * Returns: { allowed: boolean, flagged: boolean, category: string | null, reason: string | null, messageId: string }
   */
  async moderate(message) {
    if (typeof message !== 'string') {
      throw new Error('Invalid message payload: text must be a string');
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return {
        allowed: false,
        flagged: true,
        category: 'other',
        reason: 'Empty message submitted',
        messageId: `msg_${crypto.randomUUID()}`
      };
    }

    if (trimmed.length > 4000) {
      return {
        allowed: false,
        flagged: true,
        category: 'other',
        reason: 'Your message is too long. Please shorten it and try again.',
        messageId: `msg_${crypto.randomUUID()}`
      };
    }

    const messageId = `msg_${crypto.randomUUID()}`;
    const apiKey = process.env.GEMINI_API_KEY || '';
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    let result;
    try {
      if (this.provider === 'gemini') {
        result = await moderateWithGemini(trimmed, apiKey, modelName);
      } else {
        // Fallback or secondary provider plug-in point
        result = await moderateWithGemini(trimmed, apiKey, modelName);
      }

      // Final strict schema verification
      result = validateModerationResult(result);
    } catch (err) {
      console.error('Moderation engine internal failure:', err);
      // FAIL-CLOSED: Never allow messages through if safety check fails
      const failClosedError = new Error("We couldn't complete the safety check. Please try again.");
      failClosedError.statusCode = 503;
      throw failClosedError;
    }

    // Persist moderation event in SQLite
    const nowIso = new Date().toISOString();
    const eventId = `evt_${crypto.randomUUID()}`;

    try {
      // Record moderation event
      const insertEvent = db.prepare(`
        INSERT INTO moderation_events (id, messageId, messageSnippet, decision, category, reason, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertEvent.run(
        eventId,
        messageId,
        trimmed.slice(0, 150),
        result.allowed ? 'allowed' : 'flagged',
        result.category,
        result.reason,
        nowIso
      );

      // If flagged, log in flagged_content table for Admin Review workflow
      if (result.flagged) {
        const flagId = `flag_${crypto.randomUUID().slice(0, 8)}`;
        const insertFlag = db.prepare(`
          INSERT INTO flagged_content (id, messageId, message, category, reason, status, reviewer, reviewedAt, createdAt)
          VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, ?)
        `);
        insertFlag.run(
          flagId,
          messageId,
          trimmed,
          result.category,
          result.reason,
          nowIso
        );
      }
    } catch (dbErr) {
      console.error('Database logging error for moderation event:', dbErr);
      // Keep going if write fails, but preserve safety decision
    }

    return {
      ...result,
      messageId
    };
  }
}

export const moderationService = new ModerationService();
export default moderationService;
