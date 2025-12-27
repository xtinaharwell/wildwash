import axios from 'axios';
import { User } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { setAuth } from '@/redux/features/authSlice';
import { AUTH_STORAGE_KEY } from '../auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

interface CsrfResponse {
  csrfToken?: string;
  detail?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

// Function to get CSRF token from cookies
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Function to clear CSRF token from cookies
const clearCsrfToken = (): void => {
  if (typeof document === 'undefined') return;
  document.cookie = 'csrftoken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
};

// Function to ensure CSRF token is available
const ensureCsrfToken = async (): Promise<string | null> => {
  try {
    // Clear any stale CSRF token first
    clearCsrfToken();

    // Fetch a fresh CSRF token from the backend
    const response = await axios.get<CsrfResponse>(`${API_BASE}/users/csrf/`, {
      withCredentials: true,
    });

    // Wait a bit for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get the token from cookies
    let token = getCsrfToken();
    
    // If still not found, try from response data
    if (!token && response.data?.csrfToken) {
      token = response.data.csrfToken;
    }

    return token;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

export const handleLogin = async (
  endpoint: string,
  credentials: { phoneNumber: string; password: string } | { username: string; password: string },
  dispatch: AppDispatch
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Ensure CSRF token is available
    const csrfToken = await ensureCsrfToken();

    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const response = await axios.post<LoginResponse>(
      `${API_BASE}${endpoint}`,
      credentials,
      {
        withCredentials: true,
        headers,
      }
    );

    const { token, user } = response.data;

    // Store the auth state which will be used by the API client
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));

    // Update the Redux state
    dispatch(setAuth({ user, token }));

    return { success: true };
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'An error occurred during login';
    return { success: false, error: errorMessage };
  }
};

// Endpoint constants for different user types
export const LOGIN_ENDPOINTS = {
  USER: '/users/login/',
  ADMIN: '/users/admin/login/',
  STAFF: '/users/staff/login/',  // matches the Django URL configuration
};