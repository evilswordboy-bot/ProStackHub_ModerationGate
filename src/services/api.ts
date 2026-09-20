import type {
  ModerationResult,
  ChatMessage,
  ModerationEvent,
  FlaggedContent,
  AdminStats,
  TestRun,
  TestRunSummary,
  TestCase,
  SystemSettings
} from '../types/moderation';

const API_BASE = '/api';

const ADMIN_TOKEN_KEY = 'moderationgate_admin_token';

export const getAdminToken = (): string => {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || 'moderationgate-admin-secret-2026';
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const removeAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

const getHeaders = (isAdmin: boolean = false): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isAdmin) {
    const token = getAdminToken();
    if (token) {
      headers['x-admin-key'] = token;
    }
  }
  return headers;
};

export const api = {
  async moderate(message: string): Promise<ModerationResult> {
    const res = await fetch(`${API_BASE}/moderate`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "We couldn't complete the safety check. Please try again.");
    }
    return res.json();
  },

  async sendChatMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<{
    allowed: boolean;
    flagged: boolean;
    category: string | null;
    reason: string | null;
    message: ChatMessage | null;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory.map(m => ({ role: m.role, content: m.content }))
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "We couldn't complete the safety check. Please try again.");
    }
    return res.json();
  },

  async getChatHistory(): Promise<{ messages: ChatMessage[] }> {
    const res = await fetch(`${API_BASE}/chat/history`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  async clearChatHistory(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/chat/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear chat history');
    return res.json();
  },

  async adminLogin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setAdminToken(data.token);
    }
    return data;
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to load moderation statistics');
    return res.json();
  },

  async getActivity(limit: number = 25): Promise<{ events: ModerationEvent[] }> {
    const res = await fetch(`${API_BASE}/admin/activity?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load activity');
    return res.json();
  },

  async getFlags(params?: { status?: string; category?: string; search?: string }): Promise<{ flags: FlaggedContent[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE}/admin/flags?${query.toString()}`, {
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to load flagged messages');
    return res.json();
  },

  async getFlag(id: string): Promise<{ flag: FlaggedContent }> {
    const res = await fetch(`${API_BASE}/admin/flags/${id}`, {
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to load flag details');
    return res.json();
  },

  async reviewFlag(
    id: string,
    action: 'confirm' | 'allow' | 'dismiss',
    reviewer: string = 'Security Admin'
  ): Promise<{ success: boolean; flag: FlaggedContent }> {
    const res = await fetch(`${API_BASE}/admin/flags/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ action, reviewer })
    });
    if (!res.ok) throw new Error('Failed to submit human review');
    return res.json();
  },

  async runTestSuite(testCases?: TestCase[]): Promise<{
    success: boolean;
    runId: string;
    createdAt: string;
    summary: TestRunSummary;
    results: TestCase[];
  }> {
    const res = await fetch(`${API_BASE}/admin/tests/run`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ testCases })
    });
    if (!res.ok) throw new Error('Failed to execute test suite');
    return res.json();
  },

  async getTestHistory(): Promise<{ runs: TestRun[] }> {
    const res = await fetch(`${API_BASE}/admin/tests/history`, {
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to retrieve test history');
    return res.json();
  },

  async getSettings(): Promise<{ settings: SystemSettings }> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(settings: Record<string, string>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/data/reset`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  }
};

export default api;
