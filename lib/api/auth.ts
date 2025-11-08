import axios from 'axios';
import { getStoredAuthState, clearAuthState } from '../auth';

const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://wildwosh.kibeezy.com';

export const validateToken = async (): Promise<boolean> => {
  const authState = getStoredAuthState();
  if (!authState?.token) {
    return false;
  }

  try {
    await axios.get(`${API_URL}/users/me/`, {
      headers: {
        Authorization: `Token ${authState.token}`
      }
    });
    return true;
  } catch (error) {
    clearAuthState();
    return false;
  }
};