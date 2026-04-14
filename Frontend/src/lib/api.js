export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const TOKEN_KEY = 'chat_token';
export const USER_KEY = 'chat_user';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}
