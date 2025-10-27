"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, finishInitialLoad } from '@/redux/features/authSlice';

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        dispatch(setAuth(user));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }

    dispatch(finishInitialLoad());
  }, [dispatch]);

  return null;
}