const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hg_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status, data: err });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      apiFetch<{ user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      apiFetch<{ user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => apiFetch<User>('/api/auth/me'),
  },
  hooks: {
    generate: (body: GenerateRequest) =>
      apiFetch<{ hooks: GeneratedHook[]; count: number }>('/api/hooks/generate', { method: 'POST', body: JSON.stringify(body) }),
    history: (params?: { page?: number; platform?: string; favorites?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.platform) q.set('platform', params.platform);
      if (params?.favorites) q.set('favorites', 'true');
      return apiFetch<HistoryResponse>(`/api/hooks/history?${q}`);
    },
    favorite: (id: string) => apiFetch<GeneratedHook>(`/api/hooks/${id}/favorite`, { method: 'POST' }),
    delete: (id: string) => apiFetch<void>(`/api/hooks/${id}`, { method: 'DELETE' }),
    trending: (params?: { platform?: string; niche?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.platform) q.set('platform', params.platform);
      if (params?.niche) q.set('niche', params.niche);
      if (params?.limit) q.set('limit', String(params.limit));
      return apiFetch<TrendingResponse>(`/api/hooks/trending?${q}`);
    },
  },
  billing: {
    createCheckout: () => apiFetch<{ url: string }>('/api/billing/create-checkout', { method: 'POST' }),
    createPortal: () => apiFetch<{ url: string }>('/api/billing/create-portal', { method: 'POST' }),
  },
};

export interface User { id: string; email: string; name: string | null; plan: 'FREE' | 'PRO'; hooksGenerated?: number; createdAt?: string; }
export interface GenerateRequest { topic: string; platform: string; niche?: string; tone: string; count: number; useAI?: boolean; }
export interface GeneratedHook { id?: string; text: string; type: string; score: number; platform: string; isFavorite?: boolean; explanation?: string; }
export interface HistoryResponse { items: GeneratedHook[]; total: number; page: number; pages: number; }
export interface TrendingHook { id: string; text: string; platform: string; hookType: string; score: number; niche: string | null; sourceType: string; explanation: string; viewCount: number | null; }
export interface TrendingResponse { hooks: TrendingHook[]; total: number; planLimit: number | null; isPro: boolean; }
