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
  document.cookie = 'csrftoken=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
};

// Function to ensure CSRF token is available with retries
const ensureCsrfToken = async (retries: number = 3): Promise<string | null> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Clear any stale CSRF token
      clearCsrfToken();

      // Fetch a fresh CSRF token from the backend
      const response = await axios.get<CsrfResponse>(`${API_BASE}/users/csrf/`, {
        withCredentials: true,
        timeout: 5000, // 5 second timeout
      });

      // Wait for the cookie to be set
      await new Promise(resolve => setTimeout(resolve, 150));

      // Get the token from cookies
      let token = getCsrfToken();
      
      // If still not found, try from response data
      if (!token && response.data?.csrfToken) {
        token = response.data.csrfToken;
      }

      if (token) {
        return token;
      }

      // Token not found, will retry
      console.warn(`CSRF token attempt ${attempt + 1}/${retries} failed, retrying...`);
    } catch (error) {
      console.warn(`CSRF token fetch attempt ${attempt + 1}/${retries} failed:`, error);
      
      // Wait before retrying
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.error('Failed to get CSRF token after retries');
  return null;
};

export const handleLogin = async (
  endpoint: string,
  credentials: { phoneNumber: string; password: string } | { username: string; password: string },
  dispatch: AppDispatch
): Promise<{ success: boolean; error?: string }> => {
  let lastError: string | null = null;

  // Try login with CSRF token, with automatic retry on CSRF failure
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Ensure CSRF token is available
      const csrfToken = await ensureCsrfToken();

      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Build the request data
      const requestData: any = { ...credentials };

      // Add CSRF token in multiple ways to ensure it's recognized
      if (csrfToken) {
        // Method 1: X-CSRFToken header (most common for AJAX)
        headers['X-CSRFToken'] = csrfToken;
        
        // Method 2: Also include in request body as fallback
        requestData['csrfmiddlewaretoken'] = csrfToken;
      }

      console.log(`Login attempt ${attempt + 1}/3 with CSRF token:`, csrfToken ? 'present' : 'missing');

      const response = await axios.post<LoginResponse>(
        `${API_BASE}${endpoint}`,
        requestData,
        {
          withCredentials: true,
          headers,
          timeout: 10000, // 10 second timeout
        }
      );

      const { token, user } = response.data;

      // Store the auth state which will be used by the API client
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));

      // Update the Redux state
      dispatch(setAuth({ user, token }));

      return { success: true };
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || error.message || 'Login failed';
      lastError = errorDetail;

      console.error(`Login attempt ${attempt + 1}/3 failed:`, errorDetail);

      // Check if it's a CSRF token error
      const isCsrfError = errorDetail.includes('CSRF') || error.response?.status === 403;

      if (isCsrfError && attempt < 2) {
        console.warn(`CSRF error detected, attempting recovery (${attempt + 1}/3)...`);
        
        // Clear all CSRF-related data and retry
        clearCsrfToken();
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('csrf_token');
        }
        
        // Wait before retrying with fresh CSRF token
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Not a CSRF error or final attempt, break out of loop
      break;
    }
  }

  return { success: false, error: lastError || 'An error occurred during login' };
};

// Endpoint constants for different user types
export const LOGIN_ENDPOINTS = {
  USER: '/users/login/',
  ADMIN: '/users/admin/login/',
  STAFF: '/users/staff/login/',  // matches the Django URL configuration
};