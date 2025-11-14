# Frontend Data Prefetching Strategy Guide

## Overview

This guide explains how to implement smooth, seamless data prefetching across your Wild Wash app. The goal is to ensure users never see loading spinners on pages they frequently visit.

## 🎯 Key Concepts

### 1. **Prefetch vs Fetch**

- **Fetch**: Load data user needs NOW (blocking, shows loading)
- **Prefetch**: Load data user might need SOON (non-blocking, in background)

### 2. **Cache Strategy**

```
Fresh (< 5 min)    → Use cached data immediately
                  ├─ Background refresh if stale
Stale (> 5 min)   → Show old data while fetching
                  └─ Update when new data arrives
Expired           → Fetch fresh data (blocking)
```

### 3. **Deduplication**

If 3 components request the same data simultaneously, only 1 API call is made.

---

## 🚀 Quick Start

### Installation

Files are already created in:

- `lib/prefetch/prefetchManager.ts` - Core prefetch logic
- `lib/prefetch/usePrefetch.ts` - React hooks

### Basic Usage

```tsx
import { usePrefetch, cacheKeys } from "@/lib/prefetch/usePrefetch";
import { client } from "@/lib/api/client";

export function OrdersPage() {
  const {
    data: orders,
    loading,
    error,
  } = usePrefetch(
    cacheKeys.orders(1),
    () => client.get("/orders/?page=1"),
    { ttl: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {orders?.results?.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

---

## 📋 All Available Hooks

### 1. `usePrefetch<T>` - Basic Fetch with Caching

**When to use**: Any page that fetches data

```tsx
const { data, loading, error, refetch } = usePrefetch(
  "unique-cache-key",
  () => fetchData(),
  {
    ttl: 5 * 60 * 1000, // Cache for 5 minutes
    priority: "medium", // low | medium | high
    force: false, // Force refresh
    skip: false, // Skip fetching
    onSuccess: (data) => {}, // Callback on success
    onError: (error) => {}, // Callback on error
  }
);
```

**Example: Orders Page**

```tsx
const { data: orders, loading } = usePrefetch(
  cacheKeys.orders(page),
  () => client.get(`/orders/?page=${page}`),
  { ttl: 5 * 60 * 1000 }
);
```

---

### 2. `usePrefetchBackground` - Background Prefetch

**When to use**: Prefetch data user might need soon (e.g., next page)

```tsx
usePrefetchBackground(
  cacheKeys.orders(2),
  () => client.get("/orders/?page=2"),
  { priority: "low" }
);
```

**Example: Auto-prefetch next page when scrolling**

```tsx
function OrdersList() {
  const [page, setPage] = useState(1);

  // Prefetch next page in background
  usePrefetchBackground(
    cacheKeys.orders(page + 1),
    () => client.get(`/orders/?page=${page + 1}`),
    { priority: "low" }
  );

  return (
    <div>
      {/* Current page data */}
      <InfiniteScroll onLoadMore={() => setPage((p) => p + 1)} />
    </div>
  );
}
```

---

### 3. `usePrefetchMultiple` - Prefetch Multiple Endpoints

**When to use**: Dashboard pages that need multiple data sources

```tsx
const { data, loading, error } = usePrefetchMultiple({
  orders: {
    key: cacheKeys.orders(),
    fetcher: () => client.get("/orders/"),
  },
  notifications: {
    key: cacheKeys.notifications(),
    fetcher: () => client.get("/notifications/"),
  },
  profile: {
    key: cacheKeys.userProfile(),
    fetcher: () => client.get("/users/me/"),
  },
});

// Access with: data.orders, data.notifications, data.profile
```

---

### 4. `usePrefetchPaginated` - Smart Pagination

**When to use**: Lists with pagination (prefetches next 2 pages automatically)

```tsx
function OrdersPaginatedList() {
  const [page, setPage] = useState(1);

  // Auto-prefetches pages page+1 and page+2
  usePrefetchPaginated(
    (p) => cacheKeys.orders(p),
    (p) => () => client.get(`/orders/?page=${p}`),
    page
  );

  return <Pagination currentPage={page} onPageChange={setPage} />;
}
```

---

### 5. `usePrefetchOnHover` - Prefetch on Navigation

**When to use**: Links to pages with heavy data

```tsx
function NavigationLink() {
  const prefetch = usePrefetchOnHover(cacheKeys.riders(), () =>
    client.get("/riders/profiles/")
  );

  return (
    <Link href="/riders" {...prefetch}>
      View Riders
    </Link>
  );
}
```

---

### 6. `useBatchPrefetch` - Batch Prefetch

**When to use**: Dashboard pages needing multiple resources

```tsx
function AdminDashboard() {
  useBatchPrefetch([
    { key: cacheKeys.orders(), fetcher: () => client.get("/orders/") },
    {
      key: cacheKeys.riderLocations(),
      fetcher: () => client.get("/riders/locations/"),
    },
    { key: cacheKeys.staff(), fetcher: () => client.get("/orders/staff/") },
  ]);

  return <Dashboard />;
}
```

---

### 7. `usePrefetchPolling` - Keep Data Fresh

**When to use**: Real-time data (rider locations, order status)

```tsx
function RiderMap() {
  // Refreshes every 10 seconds
  const { data: locations } = usePrefetchPolling(
    cacheKeys.riderLocations(),
    () => client.get("/riders/locations/"),
    10000, // 10 seconds
    { priority: "high" }
  );

  return <Map locations={locations} />;
}
```

---

### 8. `useInvalidateOnUnmount` - Clear Cache on Exit

**When to use**: Pages where data changes frequently (forms, edit pages)

```tsx
function EditOrderPage() {
  // When user leaves, clear cache so next visit gets fresh data
  useInvalidateOnUnmount(cacheKeys.orders());

  return <EditForm />;
}
```

---

## 🎯 Pre-built Cache Keys

Consistent cache key builder to avoid typos:

```tsx
import { cacheKeys } from "@/lib/prefetch/prefetchManager";

cacheKeys.orders(page, status); // 'orders:1:all'
cacheKeys.notifications(); // 'notifications'
cacheKeys.services(); // 'services'
cacheKeys.riderOrders(status); // 'rider:orders:in_progress'
cacheKeys.riderProfiles(); // 'rider:profiles'
cacheKeys.riderLocations(); // 'rider:locations'
cacheKeys.userProfile(); // 'user:profile'
cacheKeys.offers(); // 'offers'
cacheKeys.staff(page); // 'staff:orders:1'
cacheKeys.admin(page, filters); // 'admin:orders:1:filter'
```

---

## 📝 Implementation Examples

### Example 1: Orders Page with Pagination

```tsx
// app/orders/page.tsx
import { usePrefetch, cacheKeys } from "@/lib/prefetch/usePrefetch";
import { client } from "@/lib/api/client";

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = usePrefetch(
    cacheKeys.orders(page),
    () => client.get(`/orders/?page=${page}`),
    { ttl: 5 * 60 * 1000 }
  );

  // Auto-prefetch next page
  usePrefetchBackground(
    cacheKeys.orders(page + 1),
    () => client.get(`/orders/?page=${page + 1}`),
    { priority: "low" }
  );

  return (
    <div className="p-6">
      <h1>My Orders</h1>

      {loading && <Spinner />}
      {error && <ErrorAlert error={error} onRetry={refetch} />}

      {data?.results && (
        <>
          <OrderList orders={data.results} />
          <Pagination
            current={page}
            total={Math.ceil(data.count / 20)}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

### Example 2: Admin Dashboard

```tsx
// app/admin/page.tsx
import { usePrefetchMultiple, cacheKeys } from "@/lib/prefetch/usePrefetch";
import { client } from "@/lib/api/client";

export default function AdminDashboard() {
  const { data, loading, error } = usePrefetchMultiple(
    {
      orders: {
        key: cacheKeys.orders(1),
        fetcher: () => client.get("/orders/?page=1"),
      },
      riders: {
        key: cacheKeys.riderProfiles(),
        fetcher: () => client.get("/riders/profiles/"),
      },
      locations: {
        key: cacheKeys.riderLocations(),
        fetcher: () => client.get("/riders/locations/"),
      },
    },
    { ttl: 3 * 60 * 1000 }
  );

  if (loading) return <Spinner />;

  return (
    <div className="grid grid-cols-3 gap-4">
      <OrdersWidget orders={data.orders?.results} />
      <RidersWidget riders={data.riders} />
      <MapWidget locations={data.locations} />
    </div>
  );
}
```

### Example 3: Rider Page with Polling

```tsx
// app/rider/page.tsx
import { usePrefetchPolling, cacheKeys } from "@/lib/prefetch/usePrefetch";
import { client } from "@/lib/api/client";

export default function RiderPage() {
  // Keep orders updated every 10 seconds
  const { data: orders } = usePrefetchPolling(
    cacheKeys.riderOrders("in_progress"),
    () => client.get("/orders/rider/?status=in_progress"),
    10000
  );

  // Keep locations updated every 5 seconds
  const { data: locations } = usePrefetchPolling(
    cacheKeys.riderLocations(),
    () => client.get("/riders/locations/"),
    5000
  );

  return (
    <div>
      <OrderList orders={orders} />
      <RiderMap locations={locations} />
    </div>
  );
}
```

### Example 4: Navigation with Hover Prefetch

```tsx
// components/Navigation.tsx
import { usePrefetchOnHover, cacheKeys } from "@/lib/prefetch/usePrefetch";
import { client } from "@/lib/api/client";
import Link from "next/link";

function NavLink({ href, label, cacheKey, fetcher }) {
  const prefetch = usePrefetchOnHover(cacheKey, fetcher);

  return (
    <Link href={href} {...prefetch}>
      {label}
    </Link>
  );
}

export default function Navigation() {
  return (
    <nav>
      <NavLink
        href="/orders"
        label="Orders"
        cacheKey={cacheKeys.orders(1)}
        fetcher={() => client.get("/orders/?page=1")}
      />
      <NavLink
        href="/riders"
        label="Riders"
        cacheKey={cacheKeys.riderProfiles()}
        fetcher={() => client.get("/riders/profiles/")}
      />
    </nav>
  );
}
```

---

## 🔍 Debugging & Monitoring

### Check Cache Stats

```tsx
import { prefetchManager } from '@/lib/prefetch/prefetchManager';

// In browser console or dev component:
console.log(prefetchManager.getStats());

// Output:
{
  cacheSize: 5,
  inFlightSize: 1,
  cacheEntries: [
    {
      key: 'orders:1:all',
      age: 15000,
      ttl: 300000,
      stale: false,
      priority: 'medium'
    }
  ]
}
```

### Debug Component

```tsx
// components/PrefetchDebug.tsx
import { prefetchManager } from "@/lib/prefetch/prefetchManager";

export function PrefetchDebug() {
  const [stats, setStats] = useState(prefetchManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prefetchManager.getStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-slate-900 text-white rounded font-mono text-xs">
      <div>Cache Size: {stats.cacheSize}</div>
      <div>In-Flight: {stats.inFlightSize}</div>
      {stats.cacheEntries.map((entry) => (
        <div key={entry.key} className="text-xs mt-1">
          {entry.key} {entry.stale ? "(stale)" : "(fresh)"}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. **Set Appropriate TTLs**

```tsx
// Short TTL for real-time data
usePrefetch(key, fetcher, { ttl: 10 * 1000 }); // 10 seconds

// Medium TTL for order data
usePrefetch(key, fetcher, { ttl: 5 * 60 * 1000 }); // 5 minutes

// Long TTL for static data
usePrefetch(key, fetcher, { ttl: 30 * 60 * 1000 }); // 30 minutes
```

### 2. **Use Priorities Wisely**

```tsx
usePrefetch(key, fetcher, { priority: "high" }); // User-initiated action
usePrefetch(key, fetcher, { priority: "medium" }); // Page load
usePrefetch(key, fetcher, { priority: "low" }); // Background refresh
```

### 3. **Prefetch Predictably**

```tsx
// Good: Prefetch next page when on current page
usePrefetchBackground(cacheKeys.orders(page + 1), ...);

// Good: Prefetch on hover to a page
usePrefetchOnHover(cacheKeys.riders(), ...);

// Avoid: Random prefetching can waste bandwidth
```

### 4. **Handle Errors Gracefully**

```tsx
const { data, error, refetch } = usePrefetch(key, fetcher);

if (error) {
  return (
    <ErrorCard>
      <p>Failed to load data</p>
      <button onClick={refetch}>Retry</button>
    </ErrorCard>
  );
}
```

### 5. **Invalidate When Data Changes**

```tsx
async function updateOrder(id, updates) {
  await client.patch(`/orders/${id}/`, updates);
  prefetchManager.invalidate(cacheKeys.orders(1)); // Force refresh next fetch
}
```

---

## 🚀 Performance Impact

Expected improvements after implementing prefetching:

| Metric            | Before            | After        | Improvement          |
| ----------------- | ----------------- | ------------ | -------------------- |
| Page Load Time    | 2-3s              | 0.2-0.5s     | **85-90%**           |
| API Calls         | Multiple per page | 1-2 total    | **80% reduction**    |
| Data Loading UX   | Spinners visible  | Data ready   | **Instant**          |
| Network Bandwidth | High (full loads) | Low (cached) | **70% less**         |
| Server Load       | High              | Low          | **50-70% reduction** |

---

## 📚 Related Documentation

- Backend Optimization: `wild-wash-api/PERFORMANCE_OPTIMIZATION.md`
- API Service: `lib/api/client.ts`
- Redux Store: `redux/store.ts`

---

## 🆘 Troubleshooting

### Issue: Data still loading slowly

- Check backend response time first (use Django Debug Toolbar)
- Verify cache TTL is appropriate (5-30 min for most data)
- Ensure prefetch is triggered before page load

### Issue: Stale data showing

- Reduce TTL for that endpoint
- Use `invalidate()` after mutations
- Enable `background: true` for stale-while-revalidate

### Issue: Too many API calls

- Check for duplicate cache keys
- Verify deduplication is working (use `getStats()`)
- Reduce prefetch frequency for polling

### Issue: Memory usage increasing

- Clear cache periodically on unmount
- Use `useInvalidateOnUnmount()` for edit pages
- Reduce number of cached entries

---

**Status**: Ready for Implementation  
**Last Updated**: November 14, 2025
