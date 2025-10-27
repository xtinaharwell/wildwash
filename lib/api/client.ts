const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://wildwosh.kibeezy.com";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: token ? 'omit' : 'include',
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