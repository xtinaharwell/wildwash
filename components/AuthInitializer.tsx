"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, finishInitialLoad, logout } from '@/redux/features/authSlice';
import { getStoredAuthState, isValidAuthState, AUTH_STORAGE_KEY } from '@/lib/auth';
import { validateToken } from '@/lib/api/auth';

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedState = getStoredAuthState();

      if (storedState && isValidAuthState(storedState)) {
        try {
          // Attempt to validate the token
          const isValid = await validateToken();
          
          if (isValid) {
            // Set the authentication state in Redux
            dispatch(setAuth({ 
              user: storedState.user, 
              token: storedState.token 
            }));
          } else {
            // If token is invalid, clear everything
            dispatch(logout());
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // On network error, we should logout to be safe
          dispatch(logout());
        }
      }

      dispatch(finishInitialLoad());
    };

    // Initialize immediately
    initializeAuth();

    // Set up periodic token validation (every 5 minutes)
    const validationInterval = setInterval(initializeAuth, 5 * 60 * 1000);

    // Re-initialize on storage changes from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        initializeAuth();
      }
    };

    // Re-initialize on window focus
    const handleFocus = () => {
      initializeAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(validationInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [dispatch]);

  return null;
}