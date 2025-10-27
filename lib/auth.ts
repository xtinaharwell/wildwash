import { User } from '@/redux/features/authSlice';

interface StoredAuthState {
  user: User;
  token: string;
}

export const AUTH_STORAGE_KEY = 'wildwash_auth_state';

export const persistAuthState = (user: User, token: string) => {
  if (typeof window !== 'undefined') {
    const state: StoredAuthState = { user, token };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  }
};

export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const getStoredAuthState = (): StoredAuthState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedState = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedState) {
    return null;
  }

  try {
    return JSON.parse(storedState);
  } catch {
    clearAuthState();
    return null;
  }
};

export const isValidAuthState = (state: StoredAuthState): boolean => {
  return (
    !!state &&
    typeof state === 'object' &&
    !!state.user &&
    typeof state.user === 'object' &&
    typeof state.token === 'string' &&
    state.token.length > 0
  );
};