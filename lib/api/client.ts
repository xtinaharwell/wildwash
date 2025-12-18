import { AUTH_STORAGE_KEY } from '../auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    // Primary source: new unified auth state used across the app
    const authState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authState) {
      try {
        const parsed = JSON.parse(authState);
        // support several possible token property names from different flows
        token = parsed?.token ?? parsed?.access ?? parsed?.key ?? null;
      } catch (e) {
        console.error('Error parsing auth state:', e);
      }
    }

    // Fallbacks for older code paths that write different localStorage keys
    if (!token) {
      token = localStorage.getItem('access_token') || localStorage.getItem('token') || null;
    }
  }
  
  const headers = {
    'Content-Type': 'application/json',
    // If token exists, attach DRF Token auth header. If it looks like a Bearer token,
    // client code should still work with DRF TokenAuthentication for local dev.
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const client = {
  get: (url: string) => fetchWithAuth(url, { method: 'GET' }),
  post: (url: string, data?: any) => fetchWithAuth(url, { 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  }),
  put: (url: string, data: any) => fetchWithAuth(url, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  patch: (url: string, data: any) => fetchWithAuth(url, { 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};