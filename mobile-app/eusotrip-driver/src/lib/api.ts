// ═══════════════════════════════════════════════════════════════════════════════
// API CLIENT
// Thin wrapper for HTTP requests to the EusoTrip backend.
// Used by the sync engine and cache manager to communicate with the server.
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'
  : 'https://eusotrip.com/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request(method: string, path: string, body?: any) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API ${method} ${path} failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body),
  put: (path: string, body?: any) => request('PUT', path, body),
  patch: (path: string, body?: any) => request('PATCH', path, body),
  delete: (path: string) => request('DELETE', path),
};
