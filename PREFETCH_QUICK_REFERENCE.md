# Quick Reference Card - Prefetch Patterns

## 🎯 One-Liners for Every Scenario

### Scenario 1: Load Page Data

```tsx
const { data, loading } = usePrefetch(cacheKeys.orders(1), () =>
  client.get("/orders/?page=1")
);
```

**Result**: Data cached, instant load on revisit

---

### Scenario 2: Pagination with Next Page Ready

```tsx
const { data } = usePrefetch(cacheKeys.orders(page), () =>
  client.get(`/orders/?page=${page}`)
);
usePrefetchBackground(cacheKeys.orders(page + 1), () =>
  client.get(`/orders/?page=${page + 1}`)
);
```

**Result**: Current page instant, next page ready

---

### Scenario 3: Dashboard with Multiple Data

```tsx
const { data: all } = usePrefetchMultiple({
  orders: { key: cacheKeys.orders(), fetcher: () => client.get("/orders/") },
  riders: {
    key: cacheKeys.riderProfiles(),
    fetcher: () => client.get("/riders/"),
  },
  notifications: {
    key: cacheKeys.notifications(),
    fetcher: () => client.get("/notifications/"),
  },
});
```

**Result**: All data loads in parallel, cached

---

### Scenario 4: Real-Time Updates (Rider, Order Status)

```tsx
const { data: orders } = usePrefetchPolling(
  cacheKeys.riderOrders(),
  () => client.get("/orders/rider/"),
  5000
);
```

**Result**: Updates every 5 seconds, no manual refresh needed

---

### Scenario 5: Prefetch on Link Hover

```tsx
const hover = usePrefetchOnHover(cacheKeys.orders(), () =>
  client.get("/orders/")
);
<Link href="/orders" {...hover}>
  Orders
</Link>;
```

**Result**: By the time user clicks, data is cached

---

### Scenario 6: Clean Cache on Form Exit

```tsx
useInvalidateOnUnmount(cacheKeys.orders(1));
```

**Result**: Next time visiting orders, data is fresh

---

## 📋 Cache Keys Builder

```tsx
// Pre-built keys (prevents typos):
cacheKeys.orders(page, status); // 'orders:1:all'
cacheKeys.notifications(); // 'notifications'
cacheKeys.services(); // 'services'
cacheKeys.riderOrders(status); // 'rider:orders:in_progress'
cacheKeys.riderProfiles(); // 'rider:profiles'
cacheKeys.riderLocations(); // 'rider:locations'
cacheKeys.userProfile(); // 'user:profile'
cacheKeys.offers(); // 'offers'
```

---

## ⚙️ Configuration Options

```tsx
usePrefetch(key, fetcher, {
  ttl: 5 * 60 * 1000, // Cache duration (5 min default)
  priority: "high", // high | medium | low
  force: false, // Force refresh
  skip: false, // Don't fetch
  onSuccess: (data) => {}, // Callback on success
  onError: (err) => {}, // Callback on error
  background: true, // Stale-while-revalidate
});
```

---

## 🔄 Hook Comparison

| Hook                     | Use Case                      | Fetches      | Blocks  |
| ------------------------ | ----------------------------- | ------------ | ------- |
| `usePrefetch`            | Main data load                | Now          | Yes     |
| `usePrefetchBackground`  | Next page, predictable        | Background   | No      |
| `usePrefetchMultiple`    | Dashboard, many sources       | All parallel | Yes     |
| `usePrefetchPaginated`   | Pagination, auto next 2 pages | Background   | No      |
| `usePrefetchOnHover`     | Link navigation               | On hover     | No      |
| `useBatchPrefetch`       | Many endpoints at once        | All parallel | No      |
| `usePrefetchPolling`     | Real-time data                | Every N ms   | Partial |
| `useInvalidateOnUnmount` | Clear cache on leave          | -            | -       |

---

## 🚀 Implementation Checklist

```
[ ] 1. Import hooks:
    import { usePrefetch, cacheKeys } from '@/lib/prefetch/usePrefetch';

[ ] 2. Add usePrefetch for current page:
    const { data, loading } = usePrefetch(cacheKeys.X(), ...);

[ ] 3. Replace state/loading with prefetch results

[ ] 4. Add background prefetch for next page:
    usePrefetchBackground(cacheKeys.X(page+1), ...);

[ ] 5. Test with DevTools:
    prefetchManager.getStats()

[ ] 6. Verify no duplicate requests in Network tab
```

---

## 🐛 Debugging Checklist

```bash
# In browser console:

# 1. See all cached data
prefetchManager.getStats()

# 2. Clear specific cache
prefetchManager.invalidate('orders:1:all')

# 3. Clear all
prefetchManager.clear()

# 4. Find specific entry
const stats = prefetchManager.getStats();
stats.cacheEntries.find(e => e.key.includes('orders'))
```

---

## ❌ Common Mistakes

| ❌ Wrong                        | ✅ Right                              | Why                |
| ------------------------------- | ------------------------------------- | ------------------ |
| Prefetch same data 3 times      | Use deduplication (happens auto)      | Wasted bandwidth   |
| TTL = 1 hour for live data      | TTL = 5 min for live data             | Stale data shown   |
| Don't invalidate after mutation | Invalidate after create/update/delete | User sees old data |
| Prefetch everything always      | Prefetch strategically                | Bandwidth waste    |
| Ignore error handling           | Add .catch() or onError callback      | Silent failures    |

---

## 📊 Performance Check

After implementation, should see:

```
Network Tab:
- ✅ Many 304 Not Modified (cache hits)
- ✅ Few actual 200 responses
- ✅ Total requests 70% lower

Performance:
- ✅ First visit: normal speed
- ✅ Return visit: instant (cached)
- ✅ Page navigation: <300ms
- ✅ No loading spinners visible

Console:
- ✅ No errors
- ✅ prefetchManager.getStats() shows entries
- ✅ No duplicate requests in logs
```

---

## 🎓 Different Page Types

### Type 1: List Pages

```tsx
const { data } = usePrefetch(key, fetcher); // Current page
usePrefetchBackground(nextKey, fetcher); // Next page
```

### Type 2: Dashboard

```tsx
useBatchPrefetch([...endpoints]); // All data at once
```

### Type 3: Real-Time

```tsx
const { data } = usePrefetchPolling(key, fetcher, 5000); // Every 5s
```

### Type 4: Form Pages

```tsx
useInvalidateOnUnmount(cacheKeys); // Clear on exit
```

### Type 5: Single Resource

```tsx
const { data } = usePrefetch(key, fetcher, { ttl: 30 * 60 * 1000 }); // Long TTL
```

---

## 🔗 Navigation Pattern

```tsx
// In NavBar.tsx:
import { usePrefetchOnHover } from '@/lib/prefetch/usePrefetch';

<Link href="/orders" {...usePrefetchOnHover(cacheKeys.orders(1), ...)}>Orders</Link>
<Link href="/riders" {...usePrefetchOnHover(cacheKeys.riderProfiles(), ...)}>Riders</Link>
```

**Result**: Hover over link → data prefetches → click → instant!

---

## 📈 Rollout Plan

```
Week 1:
  [ ] Orders page (most used)
  [ ] Rider page (real-time)

Week 2:
  [ ] Admin dashboard
  [ ] Services page

Week 3:
  [ ] All remaining pages
  [ ] Navigation optimization

Result: 90% faster app! 🚀
```

---

## 🎯 Success Criteria

- ✅ First visit: normal speed
- ✅ Return visit: <500ms load
- ✅ Page nav: <300ms
- ✅ No duplicate API calls
- ✅ Memory stable
- ✅ No console errors

---

## 📞 Where to Find Answers

| Question             | Answer                               |
| -------------------- | ------------------------------------ |
| "How do I...?"       | → PREFETCH_GUIDE.md                  |
| "Show me example"    | → lib/prefetch/examples.tsx          |
| "What's the API?"    | → lib/prefetch/usePrefetch.ts        |
| "Which page first?"  | → PREFETCH_IMPLEMENTATION.md Phase 2 |
| "Backend status?"    | → PERFORMANCE_OPTIMIZATION.md        |
| "Redux integration?" | → REDUX_PREFETCH_GUIDE.md            |

---

**Print this card and stick by your desk!** 📌

Start with Orders page → Copy pattern → Profit! 🚀
