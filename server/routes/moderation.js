import express from 'express';
import { moderationService } from '../services/moderationService.js';

const router = express.Router();

/**
 * POST /api/moderate
 * Request: { "message": "text" }
 * Response: { "allowed": boolean, "flagged": boolean, "category": string | null, "reason": string | null }
 */
router.post('/moderate', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (message === undefined || message === null) {
      return res.status(400).json({
        allowed: false,
        flagged: false,
        error: true,
        message: 'Please enter a message.'
      });
    }

    const result = await moderationService.moderate(message);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
