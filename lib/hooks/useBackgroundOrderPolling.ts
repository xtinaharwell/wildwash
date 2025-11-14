/**
 * Hook for subscribing to background order polling
 * 
 * Usage:
 * const orders = useBackgroundOrderPolling(token, true);
 * 
 * This subscribes the component to order updates from the background service
 * without causing page reloads or unnecessary re-renders.
 */

import { useEffect, useState, useRef } from 'react';
import OrderPollingService from '@/lib/services/orderPollingService';

interface Order {
  id: number;
  code: string;
  status: string;
  [key: string]: any;
}

export function useBackgroundOrderPolling(
  token: string | null,
  enabled: boolean = true,
  pollIntervalMs: number = 60000
): Order[] {
  const [orders, setOrders] = useState<Order[]>([]);
  const serviceRef = useRef(OrderPollingService.getInstance());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!token || !enabled) {
      // Stop polling if disabled or no token
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      serviceRef.current.stopPolling();
      return;
    }

    // Get service instance
    const service = serviceRef.current;

    // Start polling
    service.startPolling(token, pollIntervalMs);

    // Subscribe to updates
    unsubscribeRef.current = service.subscribe((newOrders) => {
      setOrders(newOrders);
    });

    // Set initial cached orders
    const cachedOrders = service.getCachedOrders();
    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [token, enabled, pollIntervalMs]);

  return orders;
}

/**
 * Hook to manually refresh orders immediately
 */
export function useOrderPollingRefresh() {
  const serviceRef = useRef(OrderPollingService.getInstance());

  return async (token: string) => {
    await serviceRef.current.refreshNow(token);
  };
}
