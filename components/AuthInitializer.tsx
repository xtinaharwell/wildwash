"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, finishInitialLoad, logout } from '@/redux/features/authSlice';
import { getStoredAuthState, isValidAuthState } from '@/lib/auth';
import { validateToken } from '@/lib/api/auth';

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedState = getStoredAuthState();

      if (storedState && isValidAuthState(storedState)) {
        const isValid = await validateToken();
        
        if (isValid) {
          dispatch(setAuth({ 
            user: storedState.user, 
            token: storedState.token 
          }));
        } else {
          dispatch(logout());
        }
      }

      dispatch(finishInitialLoad());
    };

    // Initialize immediately
    initializeAuth();

    // Re-initialize on storage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'wildwash_auth_state') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dispatch]);

  return null;
}