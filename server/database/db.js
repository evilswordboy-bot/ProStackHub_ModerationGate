import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'moderationgate.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Execute schema
db.exec(SCHEMA_SQL);

// Seed initial baseline records if database is new
const initSeed = () => {
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM moderation_events').get().count;
  if (eventCount === 0) {
    const seedEvents = [
      {
        id: 'evt_init_01',
        messageId: 'msg_init_01',
        messageSnippet: 'Can you help me debug my React hook?',
        decision: 'allowed',
        category: null,
        reason: 'Safe programming inquiry',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'evt_init_02',
        messageId: 'msg_init_02',
        messageSnippet: 'This argument makes no sense, I strongly disagree with this approach.',
        decision: 'allowed',
        category: null,
        reason: 'Respectful intellectual disagreement; no harassment detected',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'evt_init_03',
        messageId: 'msg_init_03',
        messageSnippet: 'You are completely worthless and everyone in your team should be fired immediately you idiot.',
        decision: 'flagged',
        category: 'harassment',
        reason: 'The message contains targeted abusive language and personal hostility.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'evt_init_04',
        messageId: 'msg_init_04',
        messageSnippet: 'How do I perform a port scan on my own home server for testing?',
        decision: 'allowed',
        category: null,
        reason: 'Educational networking and administrative query',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ];

    const insertEvent = db.prepare(`
      INSERT INTO moderation_events (id, messageId, messageSnippet, decision, category, reason, createdAt)
      VALUES (@id, @messageId, @messageSnippet, @decision, @category, @reason, @createdAt)
    `);

    const insertFlag = db.prepare(`
      INSERT INTO flagged_content (id, messageId, message, category, reason, status, reviewer, reviewedAt, createdAt)
      VALUES (@id, @messageId, @message, @category, @reason, @status, @reviewer, @reviewedAt, @createdAt)
    `);

    for (const evt of seedEvents) {
      insertEvent.run(evt);
      if (evt.decision === 'flagged') {
        insertFlag.run({
          id: 'flag_001',
          messageId: evt.messageId,
          message: evt.messageSnippet,
          category: evt.category,
          reason: evt.reason,
          status: 'pending',
          reviewer: null,
          reviewedAt: null,
          createdAt: evt.createdAt,
        });
      }
    }
  }

  // Seed default settings if not existing
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
    insertSetting.run('moderation_provider', 'gemini');
    insertSetting.run('model_name', 'gemini-1.5-flash');
    insertSetting.run('strictness', 'standard');
    insertSetting.run('auto_log_safe', 'true');
  }
};

initSeed();

export default db;
