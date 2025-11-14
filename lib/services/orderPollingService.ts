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
   * Manual refresh
   */
  async refreshNow(token: string): Promise<void> {
    await this.fetchOrders(token);
  }
}

export default OrderPollingService;
