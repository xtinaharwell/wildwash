import axios from 'axios';
import { User } from '@/redux/features/authSlice';
import { AppDispatch } from '@/redux/store';
import { setAuth } from '@/redux/features/authSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      `${API_URL}${endpoint}`,
      credentials
    );

    const { token, user } = response.data;

    // Dispatch the auth state with both user and token
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