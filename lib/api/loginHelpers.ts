import axios from 'axios';
import { User } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { setAuth } from '@/redux/features/authSlice';
import { AUTH_STORAGE_KEY } from '../auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://wildwosh.kibeezy.com";

interface LoginResponse {
  token: string;
  user: User;
}

export const handleLogin = async (
  endpoint: string,
  credentials: { username: string; password: string },
  dispatch: AppDispatch
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE}${endpoint}`,
      credentials,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
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
  STAFF: '/users/staff/login/',
};