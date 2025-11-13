import axios from 'axios';
import { getStoredAuthState, clearAuthState } from '../auth';

const API_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://8000-firebase-wild-wash-apigit-1760697854679.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev';

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