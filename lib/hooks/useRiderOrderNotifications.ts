import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useCallback } from 'react';
import type { RootState } from '@/redux/store';
import {
  setAvailableOrdersCount,
  updateAvailableOrdersCount,
  decrementAvailableOrdersCount,
  resetOrderNotifications,
  markOrdersAsSeen,
} from '@/redux/features/riderOrderNotificationSlice';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

interface UseRiderOrderNotificationsReturn {
  availableOrdersCount: number;
  unseenOrdersCount: number;
  decrementCount: (amount?: number) => void;
  resetNotifications: () => void;
  markAsSeen: () => void;
  updateCount: (count: number) => void;
  fetchAndUpdateOrdersCount: () => Promise<void>;
  setAvailableOrdersCount: (count: number) => void;
}

/**
 * Hook to manage rider order notifications
 * Syncs with Redux and handles order count updates
 */
export function useRiderOrderNotifications(): UseRiderOrderNotificationsReturn {
  const dispatch = useDispatch();
  const availableOrdersCount = useSelector(
    (state: RootState) => state.riderOrderNotification.availableOrdersCount
  );
  const unseenOrdersCount = useSelector(
    (state: RootState) => state.riderOrderNotification.unseenOrdersCount
  );
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const isRider = userRole === 'rider';

  /**
   * Fetch orders from API and update count
   */
  const fetchAndUpdateOrdersCount = useCallback(async () => {
    if (!isRider) return;

    try {
      const authState = JSON.parse(localStorage.getItem('wildwash_auth_state') || '{}');
      const token = authState.token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/orders/rider/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      const orders = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      // Count only requested orders (available for assignment)
      const requestedOrdersCount = orders.filter(
        (order: any) => order.status?.toLowerCase?.() === 'requested'
      ).length;

      dispatch(setAvailableOrdersCount(requestedOrdersCount));
    } catch (err) {
      console.error('Failed to fetch orders count:', err);
    }
  }, [isRider, dispatch]);

  /**
   * Initialize count on mount
   */
  useEffect(() => {
    if (isRider) {
      fetchAndUpdateOrdersCount();
    }
  }, [isRider, fetchAndUpdateOrdersCount]);

  return {
    availableOrdersCount,
    unseenOrdersCount,
    decrementCount: (amount = 1) => {
      dispatch(decrementAvailableOrdersCount(amount));
    },
    resetNotifications: () => {
      dispatch(resetOrderNotifications());
    },
    markAsSeen: () => {
      dispatch(markOrdersAsSeen());
    },
    updateCount: (count: number) => {
      dispatch(updateAvailableOrdersCount(count));
    },
    setAvailableOrdersCount: (count: number) => {
      dispatch(setAvailableOrdersCount(count));
    },
    fetchAndUpdateOrdersCount,
  };
}
