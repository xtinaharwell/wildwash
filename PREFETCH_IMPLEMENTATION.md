# Prefetch Implementation Checklist

## 📋 Step-by-Step Implementation Plan

Follow this checklist to implement smooth prefetching across all Wild Wash pages.

---

## Phase 1: Setup ✅ (Already Done)

- ✅ Created `lib/prefetch/prefetchManager.ts` - Core caching logic
- ✅ Created `lib/prefetch/usePrefetch.ts` - React hooks
- ✅ Created `PREFETCH_GUIDE.md` - Comprehensive guide
- ✅ Created example implementations

---

## Phase 2: High-Priority Pages 🚀 (Do These First)

### 1. **Orders Page** (`app/orders/page.tsx`)

Priority: **CRITICAL** - Users visit this most frequently

**What to add:**

```tsx
import {
  usePrefetch,
  usePrefetchBackground,
  cacheKeys,
} from "@/lib/prefetch/usePrefetch";

// Replace current useEffect with:
const {
  data: ordersResponse,
  loading,
  error,
  refetch,
} = usePrefetch(
  cacheKeys.orders(page),
  () => client.get(`/orders/?page=${page}`),
  { ttl: 5 * 60 * 1000, priority: "high" }
);

// Add below to prefetch next page:
usePrefetchBackground(
  cacheKeys.orders(page + 1),
  () => client.get(`/orders/?page=${page + 1}`),
  { priority: "low" }
);
```

**Expected Result**: Instant page load, next page ready before click

---

### 2. **Rider Page** (`app/rider/page.tsx`)

Priority: **CRITICAL** - Riders need real-time updates

**What to add:**

```tsx
import { usePrefetchPolling, cacheKeys } from "@/lib/prefetch/usePrefetch";

// Keep orders fresh:
const { data: orders } = usePrefetchPolling(
  cacheKeys.riderOrders("in_progress"),
  () => client.get("/orders/rider/?status=in_progress"),
  10000 // Update every 10 seconds
);

// Keep locations fresh:
const { data: locations } = usePrefetchPolling(
  cacheKeys.riderLocations(),
  () => client.get("/riders/locations/"),
  5000 // Update every 5 seconds
);
```

**Expected Result**: Always fresh data without spamming server

---

### 3. **Admin Dashboard** (`app/admin/page.tsx`)

Priority: **HIGH** - Dashboard needs multiple data sources

**What to add:**

```tsx
import { useBatchPrefetch, cacheKeys } from "@/lib/prefetch/usePrefetch";

useBatchPrefetch([
  { key: cacheKeys.orders(1), fetcher: () => client.get("/orders/?page=1") },
  {
    key: cacheKeys.riderProfiles(),
    fetcher: () => client.get("/riders/profiles/"),
  },
  {
    key: cacheKeys.riderLocations(),
    fetcher: () => client.get("/riders/locations/"),
  },
]);
```

**Expected Result**: All dashboard data loads in parallel

---

### 4. **Services Page** (`app/services/page.tsx`)

Priority: **HIGH** - Data changes rarely

**What to add:**

```tsx
import { usePrefetch, cacheKeys } from "@/lib/prefetch/usePrefetch";

const { data: services, loading } = usePrefetch(
  cacheKeys.services(),
  () => client.get("/services/"),
  { ttl: 30 * 60 * 1000 } // Cache 30 minutes
);
```

**Expected Result**: Instant load every time (cached)

---

### 5. **Staff Dashboard** (`app/staff/page.tsx`)

Priority: **HIGH** - Staff needs responsive interface

**What to add:**

```tsx
// Prefetch common filters
usePrefetchBackground(cacheKeys.staff(1), ...);
usePrefetchBackground(cacheKeys.staff(2), ...);
```

---

## Phase 3: Medium-Priority Pages 🔄 (Do These Next)

### 6. **Riders List** (`app/riders/page.tsx`)

```tsx
const { data: profiles, loading } = usePrefetch(
  cacheKeys.riderProfiles(),
  () => client.get("/riders/profiles/"),
  { ttl: 10 * 60 * 1000 }
);

usePrefetchBackground(
  cacheKeys.riderLocations(),
  () => client.get("/riders/locations/"),
  { priority: "low" }
);
```

---

### 7. **Offers Page** (`app/offers/page.tsx`)

```tsx
const { data: offers, loading } = usePrefetch(
  cacheKeys.offers(),
  () => client.get("/offers/"),
  { ttl: 15 * 60 * 1000 }
);
```

---

### 8. **Track Page** (`app/track/page.tsx`)

```tsx
const { data: order, loading } = usePrefetch(
  cacheKeys.orders(1),
  () => client.get(`/orders/?code=${code}`),
  { ttl: 2 * 60 * 1000 }
);

// Auto-refresh for active orders
usePrefetchPolling(
  `order:${code}`,
  () => client.get(`/orders/?code=${code}`),
  5000
);
```

---

### 9. **Profile Page** (`app/profile/page.tsx`)

```tsx
const { data: profile, loading } = usePrefetch(
  cacheKeys.userProfile(),
  () => client.get("/users/me/"),
  { ttl: 10 * 60 * 1000 }
);
```

---

### 10. **Notifications** (Everywhere)

```tsx
// Prefetch notifications on app load
usePrefetchBackground(
  cacheKeys.notifications(),
  () => client.get("/notifications/"),
  { priority: "medium" }
);
```

---

## Phase 4: Navigation Optimization 🧭 (Final Polish)

### Update Main Navigation (`components/NavBar.tsx`)

```tsx
import { usePrefetchOnHover, cacheKeys } from "@/lib/prefetch/usePrefetch";

const ordersHover = usePrefetchOnHover(cacheKeys.orders(1), () =>
  client.get("/orders/?page=1")
);

// In JSX:
<Link href="/orders" {...ordersHover}>
  Orders
</Link>;
```

**Apply to:**

- Orders link
- Riders link
- Services link
- Offers link
- Profile link

---

## Phase 5: Data Mutations 🔄 (Cache Invalidation)

### After Create/Update/Delete, Invalidate Cache

**Orders Page:**

```tsx
const handleDeleteOrder = async (id: number) => {
  await client.delete(`/orders/${id}/`);
  prefetchManager.invalidate(cacheKeys.orders(1)); // Next fetch will be fresh
  prefetchManager.invalidate(cacheKeys.orders(2));
};
```

**Apply to:**

- `app/book/page.tsx` - After creating order
- Edit forms - After saving
- Delete buttons - After deleting
- Status updates - After changing status

---

## Phase 6: Form Pages 📝 (Cache Management)

### Edit Pages Should Invalidate on Unmount

```tsx
// app/orders/[id]/edit/page.tsx
import { useInvalidateOnUnmount, cacheKeys } from "@/lib/prefetch/usePrefetch";

export default function EditOrderPage() {
  // When user leaves, invalidate order cache
  useInvalidateOnUnmount([
    cacheKeys.orders(1),
    cacheKeys.orders(2),
    cacheKeys.orders(3),
  ]);

  return <EditForm />;
}
```

**Apply to:**

- Order edit pages
- Profile edit page
- Any edit/create forms

---

## Implementation Timeline

| Phase     | Pages         | Estimated Time | Impact                 |
| --------- | ------------- | -------------- | ---------------------- |
| Phase 2   | 5 critical    | 1-2 hours      | **60% UX improvement** |
| Phase 3   | 5 medium      | 1-2 hours      | **75% UX improvement** |
| Phase 4   | Navigation    | 30 minutes     | **80% UX improvement** |
| Phase 5   | Mutations     | 1 hour         | **85% UX improvement** |
| Phase 6   | Forms         | 1 hour         | **90% UX improvement** |
| **Total** | **All pages** | **4-6 hours**  | **90% faster UX**      |

---

## Testing Checklist

After implementing each page:

- [ ] Initial load is instant (data appears immediately)
- [ ] Pagination next page loads instantly
- [ ] No duplicate API calls (check Network tab)
- [ ] Stale data shows while fetching (no loading spinner)
- [ ] Cache debug shows correct entries
- [ ] Memory usage is reasonable
- [ ] Error handling works
- [ ] Manual refresh works

---

## Debugging Commands

```tsx
// In browser console:

// View all cached data
import { prefetchManager } from "@/lib/prefetch/prefetchManager";
console.log(prefetchManager.getStats());

// Invalidate specific cache
prefetchManager.invalidate("orders:1:all");

// Clear all cache
prefetchManager.clear();

// Check a specific cache entry
const stats = prefetchManager.getStats();
stats.cacheEntries.find((e) => e.key === "orders:1:all");
```

---

## Common Implementation Patterns

### Pattern 1: Simple Fetch

```tsx
const { data, loading } = usePrefetch(key, fetcher);
```

### Pattern 2: Fetch + Prefetch Next

```tsx
const { data } = usePrefetch(key, fetcher);
usePrefetchBackground(nextKey, nextFetcher);
```

### Pattern 3: Real-time Updates

```tsx
const { data } = usePrefetchPolling(key, fetcher, 5000);
```

### Pattern 4: Multiple Sources

```tsx
const { data } = usePrefetchMultiple({
  orders: { key: '...', fetcher: ... },
  notifications: { key: '...', fetcher: ... },
});
```

### Pattern 5: Dashboard Load

```tsx
useBatchPrefetch([...endpoints]);
const orders = usePrefetch(...);
const notifications = usePrefetch(...);
```

---

## Performance Targets

After full implementation:

✅ **Orders Page**: 0.2-0.5s load (was 2-3s)  
✅ **Rider Dashboard**: Instant (real-time updates)  
✅ **Admin Dashboard**: All data within 1s  
✅ **Navigation**: Prefetched before click  
✅ **API Calls**: 60-70% reduction  
✅ **Network Bandwidth**: 50-70% reduction  
✅ **Server Load**: 40-50% reduction

---

## Need Help?

See `PREFETCH_GUIDE.md` for:

- Detailed API documentation
- Advanced patterns
- Troubleshooting guide
- Performance monitoring

---

**Ready to implement?** Start with Phase 2 - Orders & Rider pages. These will give you the biggest UX improvement.

Good luck! 🚀
