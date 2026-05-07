import { authClient } from '@/lib/auth-client';

const BASE = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly upgradeRequired?: boolean,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const cookie = authClient.getCookie();

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...init?.headers,
    },
    credentials: 'omit',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      error?: string; code?: string; upgrade_required?: boolean;
    };
    throw new ApiError(
      res.status,
      body.error ?? res.statusText,
      body.code,
      body.upgrade_required,
    );
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── Typed API surface ──────────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    me: () => api<{ user: User; plan: Plan }>('/v1/users/me'),
    updateProfile: (data: Partial<UserProfile>) =>
      api<{ user: User }>('/v1/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  plans: {
    list: () => api<{ plans: Plan[] }>('/v1/plans'),
  },

  conversations: {
    list: (limit = 20) => api<{ conversations: Conversation[]; total: number }>(`/v1/conversations?limit=${limit}`),
    create: (title?: string) =>
      api<{ conversation: Conversation }>('/v1/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    get: (id: string) => api<{ conversation: Conversation }>(`/v1/conversations/${id}`),
    messages: (id: string, limit = 50) =>
      api<{ messages: Message[] }>(`/v1/conversations/${id}/messages?limit=${limit}`),
    delete: (id: string) => api<void>(`/v1/conversations/${id}`, { method: 'DELETE' }),
  },

  guru: {
    get: () => api<{ customization: GuruCustomization }>('/v1/guru'),
    update: (data: Partial<GuruCustomization>) =>
      api<{ customization: GuruCustomization }>('/v1/guru', { method: 'PUT', body: JSON.stringify(data) }),
  },

  memory: {
    list: () => api<{ memories: MemoryItem[] }>('/v1/memory'),
    lockedCount: () => api<{ count: number }>('/v1/memory/locked-count'),
    delete: (id: string) => api<void>(`/v1/memory/${id}`, { method: 'DELETE' }),
    deleteAll: () => api<void>('/v1/memory', { method: 'DELETE' }),
  },

  mcp: {
    connections: () => api<{ connections: McpConnection[] }>('/v1/mcp/connections'),
    connect: (data: McpConnectPayload) =>
      api('/v1/mcp/connect', { method: 'POST', body: JSON.stringify(data) }),
    disconnect: (provider: string) =>
      api(`/v1/mcp/connect/${provider}`, { method: 'DELETE' }),
  },

  billing: {
    subscription: () => api<{ subscription: Subscription | null }>('/v1/billing/subscription'),
    initiate: (plan_id: string, frequency: string) =>
      api<{ subscriptionId: string; shortUrl: string }>('/v1/billing/mandate/initiate', {
        method: 'POST',
        body: JSON.stringify({ plan_id, frequency }),
      }),
    verify: (data: RazorpayVerifyPayload) =>
      api<{ verified: boolean; plan_id: string }>('/v1/billing/mandate/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancel: () => api('/v1/billing/subscription/cancel', { method: 'POST', body: '{}' }),
  },

  notifications: {
    register: (token: string, platform: 'ios' | 'android') =>
      api('/v1/notifications/tokens', { method: 'POST', body: JSON.stringify({ token, platform }) }),
    preferences: () => api<{ preferences: NotificationPrefs }>('/v1/notifications/preferences'),
    updatePreferences: (prefs: Partial<NotificationPrefs>) =>
      api<{ preferences: NotificationPrefs }>('/v1/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      }),
  },

  support: {
    create: (subject: string, body: string) =>
      api<{ ticket: SupportTicket }>('/v1/support', {
        method: 'POST',
        body: JSON.stringify({ subject, body }),
      }),
    list: () => api<{ tickets: SupportTicket[] }>('/v1/support'),
  },
};

// ── Domain types ───────────────────────────────────────────────────────────────

export interface User {
  id: string; email: string; name: string | null; avatar_url: string | null;
  plan_id: string; trial_started_at: string; trial_expires_at: string;
  status: string; job_title: string | null; company: string | null;
  industry: string | null; years_of_experience: number | null;
}

export interface UserProfile {
  name?: string; job_title?: string; company?: string;
  industry?: string; years_of_experience?: number;
}

export interface Plan {
  id: string; display_name: string; llm_model: string;
  description: string;
  rag_chunk_limit: number; knowledge_base_tier: string;
  memory_read_days: number | null; memory_result_limit: number;
  session_active_days: number; max_input_tokens: number; max_output_tokens: number;
  mcp_enabled: boolean; voice_mode_enabled: boolean;
  focus_areas_limit: number; response_depth_locked: boolean;
  price_paise_monthly: number | null; price_paise_quarterly: number | null;
  price_paise_annual: number | null; is_public: boolean;
}

export interface Conversation {
  id: string; title: string | null; is_read_only: boolean;
  read_only_at: string | null; last_turn_at: string | null; created_at: string;
}

export interface Message {
  id: string; role: 'user' | 'assistant'; content: string; created_at: string;
}

export interface GuruCustomization {
  guru_name: string; style: 'mentor' | 'coach' | 'strategist' | 'philosopher';
  focus_areas: string[]; checkin_frequency: 'weekly' | 'fortnightly' | 'never';
  response_depth: 'concise' | 'balanced' | 'detailed';
}

export interface MemoryItem { id: string; memory: string; created_at: string; }

export interface McpConnection {
  id: string; provider: string; is_active: boolean;
  scopes: string[] | null; expires_at: string | null;
}

export interface McpConnectPayload {
  provider: string; access_token: string; refresh_token?: string | null;
  expires_at?: string | null; scopes?: string[];
}

export interface Subscription {
  id: string; plan_id: string; status: string;
  current_period_start: string | null; current_period_end: string | null;
  failed_payment_count: number;
}

export interface RazorpayVerifyPayload {
  razorpay_payment_id: string; razorpay_subscription_id: string;
  razorpay_signature: string; plan_id: string;
}

export interface NotificationPrefs {
  weekly_checkin: boolean; new_source_alerts: boolean;
}

export interface SupportTicket {
  id: string; subject: string; body: string; category: string | null;
  priority: string; status: string; created_at: string;
}
