export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_events (
  id TEXT PRIMARY KEY,
  messageId TEXT,
  messageSnippet TEXT,
  decision TEXT NOT NULL,
  category TEXT,
  reason TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flagged_content (
  id TEXT PRIMARY KEY,
  messageId TEXT,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer TEXT,
  reviewedAt TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  totalTests INTEGER NOT NULL,
  allowed INTEGER NOT NULL,
  flagged INTEGER NOT NULL,
  falsePositives INTEGER NOT NULL,
  falsePositiveRate REAL NOT NULL,
  details TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
