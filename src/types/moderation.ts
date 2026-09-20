export type ModerationCategory =
  | 'harassment'
  | 'hate'
  | 'threats'
  | 'sexual'
  | 'violence'
  | 'self-harm'
  | 'dangerous_activity'
  | 'spam'
  | 'other'
  | 'safe';

export type ReviewStatus = 'pending' | 'confirmed' | 'allowed' | 'dismissed';

export interface ModerationResult {
  allowed: boolean;
  flagged: boolean;
  category: ModerationCategory | null;
  reason: string | null;
  messageId?: string;
  error?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  moderation?: ModerationResult;
}

export interface ModerationEvent {
  id: string;
  messageId: string;
  messageSnippet: string;
  decision: 'allowed' | 'flagged';
  category: string | null;
  reason: string | null;
  createdAt: string;
}

export interface FlaggedContent {
  id: string;
  messageId: string;
  message: string;
  category: ModerationCategory;
  reason: string;
  status: ReviewStatus;
  reviewer: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface AdminStats {
  messagesChecked: number;
  messagesAllowed: number;
  messagesFlagged: number;
  pendingReviews: number;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    allowed: number;
    dismissed: number;
  };
  categoryBreakdown: CategoryStat[];
  latestTestRun?: TestRun | null;
}

export interface TestCase {
  id: string;
  group: 'Clearly Benign' | 'Contextual' | 'Moderation Cases' | string;
  message: string;
  expected: 'allowed' | 'flagged';
  expectedCategory?: string;
  actual?: 'allowed' | 'flagged';
  category?: string | null;
  reason?: string | null;
  passed?: boolean;
  isFalsePositive?: boolean;
}

export interface TestRunSummary {
  totalTests: number;
  allowed: number;
  flagged: number;
  benignTotal: number;
  falsePositives: number;
  falsePositiveRate: number;
}

export interface TestRun {
  id: string;
  totalTests: number;
  allowed: number;
  flagged: number;
  falsePositives: number;
  falsePositiveRate: number;
  details: TestCase[];
  createdAt: string;
}

export interface SystemSettings {
  moderation_provider?: string;
  model_name?: string;
  strictness?: string;
  auto_log_safe?: string;
  hasApiKey?: boolean;
}
