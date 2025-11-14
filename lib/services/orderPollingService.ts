/**
 * Background Order Polling Service
 * 
 * Periodically fetches orders from the backend and caches them
 * without triggering component re-renders or page reloads.
 * This runs as a separate service that components can subscribe to.
 */

interface Order {
  id: number;
  code: string;
  status: string;
  [key: string]: any;
}

type PollingCallback = (orders: Order[]) => void;

class OrderPollingService {
  private static instance: OrderPollingService;
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollDuration: number = 60000; // 1 minute default
  private subscribers: Set<PollingCallback> = new Set();
  private cachedOrders: Order[] = [];
  private isPolling: boolean = false;
  private apiBase: string = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';
  private lastOrderIds: Set<number> = new Set(); // Track seen order IDs

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): OrderPollingService {
    if (!OrderPollingService.instance) {
      OrderPollingService.instance = new OrderPollingService();
    }
    return OrderPollingService.instance;
  }

  /**
   * Start background polling
   */
  startPolling(token: string, intervalMs: number = 60000): void {
    if (this.isPolling) {
      console.log('Order polling already active');
      return;
    }

    this.pollDuration = intervalMs;
    this.isPolling = true;

    console.log(`Starting order polling every ${intervalMs}ms`);

    // Poll immediately on start
    this.fetchOrders(token).catch(err => 
      console.error('Initial order poll failed:', err)
    );

    // Set up interval
    this.pollingInterval = setInterval(() => {
      this.fetchOrders(token).catch(err =>
        console.error('Order polling error:', err)
      );
    }, this.pollDuration);
  }

  /**
   * Stop background polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Order polling stopped');
  }

  /**
   * Subscribe to order updates
   * Callback is called whenever new orders are fetched
   */
  subscribe(callback: PollingCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get cached orders
   */
  getCachedOrders(): Order[] {
    return [...this.cachedOrders];
  }

  /**
   * Fetch orders from backend and notify subscribers
   */
  private async fetchOrders(token: string): Promise<void> {
    try {
      const res = await fetch(`${this.apiBase}/orders/rider/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Token ${token}`
        },
      });

      if (!res.ok) {
        throw new Error(`Orders fetch failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json().catch(() => null);
      const list: any[] = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.results) 
        ? data.results 
        : [];

      // Process orders
      const orders: Order[] = list.map((o: any) => ({
        id: o.id,
        code: o.code,
        service: {
          name: o.service_name,
          package: o.package
        },
        pickup_address: o.pickup_address,
        dropoff_address: o.dropoff_address,
        status: o.status?.toLowerCase?.() ?? o.status,
        urgency: o.urgency,
        items: o.items,
        weight_kg: o.weight_kg,
        price: o.price,
        created_at: o.created_at,
        estimated_delivery: o.estimated_delivery,
        user: o.user,
        pickup_location: o.pickup_location,
        dropoff_location: o.dropoff_location,
      }));

      // Check for new orders (only for 'requested' status orders)
      const newOrders = orders.filter(o => 
        o.status === 'requested' && !this.lastOrderIds.has(o.id)
      );

      // Notify about new orders
      if (newOrders.length > 0) {
        this.notifyNewOrders(newOrders);
      }

      // Update lastOrderIds with all current order IDs
      orders.forEach(o => this.lastOrderIds.add(o.id));

      // Update cache
      this.cachedOrders = orders;

      // Notify all subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(orders);
        } catch (err) {
          console.error('Error in order polling subscriber:', err);
        }
      });

    } catch (err) {
      console.error('Background order fetch error:', err);
    }
  }

  /**
   * Show browser notification and play sound for new orders
   */
  private notifyNewOrders(newOrders: Order[]): void {
    newOrders.forEach(order => {
      // Play notification sound
      this.playNotificationSound();

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const service = order.service?.name || 'New Service';
        const message = `${order.code} - ${service}`;
        
        new Notification('🎉 New Order Available!', {
          body: message,
          icon: '/icon.png',
          tag: `order-${order.id}`,
          requireInteraction: true, // Keep notification visible until user interacts
          badge: '/icon.png',
        });
      }
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set up the sound (3 beeps)
      oscillator.frequency.value = 800; // 800 Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // Second beep
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime + 0.15);
      osc2.stop(audioContext.currentTime + 0.25);

      // Third beep
      const osc3 = audioContext.createOscillator();
      osc3.connect(gainNode);
      osc3.frequency.value = 1200;
      osc3.type = 'sine';
      osc3.start(audioContext.currentTime + 0.3);
      osc3.stop(audioContext.currentTime + 0.4);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }

  /**
   * Manual refresh
   */
  async refreshNow(token: string): Promise<void> {
    await this.fetchOrders(token);
  }
}

export default OrderPollingService;
