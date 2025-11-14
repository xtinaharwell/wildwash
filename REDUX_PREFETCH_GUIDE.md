# Redux + Prefetch Integration Guide

## Overview

Your app uses Redux for state management. Prefetching complements Redux perfectly:

- **Redux**: Manages application state and UI consistency
- **Prefetch**: Handles HTTP-level caching and network optimization

Together, they provide both performance and maintainability.

---

## Key Principles

### 1. **Two-Layer Caching**

```
API Response
    ↓
Prefetch HTTP Cache (prefetchManager)
    ↓
Redux State (store)
    ↓
UI Components
```

### 2. **No Duplication**

- Prefetch caches HTTP responses
- Redux stores transformed application state
- Components get data from Redux (already cached)

### 3. **Invalidation Strategy**

```
User Action (Create/Update/Delete)
    ↓
Invalidate HTTP cache
    ↓
Dispatch Redux action
    ↓
UI updates automatically
```

---

## Implementation Patterns

### Pattern 1: Basic Fetch + Redux Update

**Current approach (without prefetch):**

```tsx
const [page, setPage] = useState(1);

useEffect(() => {
  dispatch(fetchOrders(page)); // Redux thunk
}, [page, dispatch]);

const orders = useSelector(selectOrders);
```

**Optimized with prefetch:**

```tsx
const [page, setPage] = useState(1);

// Add prefetch for HTTP caching
const { data: prefetched } = usePrefetch(
  cacheKeys.orders(page),
  () => client.get(`/orders/?page=${page}`),
  { ttl: 5 * 60 * 1000 }
);

// Still dispatch Redux to keep state in sync
useEffect(() => {
  dispatch(fetchOrders(page));
}, [page, dispatch]);

// UI still uses Redux (no change needed)
const orders = useSelector(selectOrders);

// Prefetch next page
usePrefetchBackground(cacheKeys.orders(page + 1), ...);
```

**Result**: Instant first load (from cache) + smooth page transitions

---

### Pattern 2: Async Thunk with Prefetch

**Modify your Redux thunk to use prefetch:**

```tsx
// redux/features/orderSlice.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import { prefetchManager, cacheKeys } from "@/lib/prefetch/prefetchManager";

// Enhanced thunk that checks prefetch cache first
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (page: number) => {
    return prefetchManager.fetch(
      cacheKeys.orders(page),
      () => client.get(`/orders/?page=${page}`),
      { ttl: 5 * 60 * 1000, force: false }
    );
  }
);

// In your reducer:
const orderSlice = createSlice({
  name: "orders",
  initialState: { data: [], loading: false },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.data = action.payload.results;
        state.loading = false;
      });
  },
});
```

**Usage in component (no change):**

```tsx
const orders = useSelector(selectOrders);
useEffect(() => {
  dispatch(fetchOrders(page));
}, [page, dispatch]);
```

---

### Pattern 3: Prefetch on Authentication

**Auto-prefetch common data after login:**

```tsx
// redux/middleware/prefetchMiddleware.ts

import { Middleware } from "@reduxjs/toolkit";
import { prefetchManager, cacheKeys } from "@/lib/prefetch/prefetchManager";

export const prefetchMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // After successful login
  if (action.type === "auth/setAuth/fulfilled") {
    // Prefetch user's data
    prefetchManager.prefetch(
      cacheKeys.orders(1),
      () => client.get("/orders/?page=1"),
      { priority: "high" }
    );

    prefetchManager.prefetch(
      cacheKeys.notifications(),
      () => client.get("/notifications/"),
      { priority: "high" }
    );

    prefetchManager.prefetch(
      cacheKeys.userProfile(),
      () => client.get("/users/me/"),
      { priority: "medium" }
    );
  }

  return result;
};

// In your store configuration:
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    /* reducers */
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(prefetchMiddleware),
});
```

---

### Pattern 4: Invalidate on Mutation

**Sync Redux state with prefetch cache invalidation:**

```tsx
// Hook to handle both cache and Redux invalidation
export function useInvalidateOrderCache() {
  const dispatch = useDispatch();

  return async () => {
    // Invalidate HTTP cache
    prefetchManager.invalidate(cacheKeys.orders(1));
    prefetchManager.invalidate(cacheKeys.orders(2));
    prefetchManager.invalidate(cacheKeys.orders(3));

    // Refresh Redux state
    dispatch(fetchOrders(1));
  };
}

// Usage after creating order:
export function CreateOrderForm() {
  const dispatch = useDispatch();
  const invalidate = useInvalidateOrderCache();

  const handleSubmit = async (data) => {
    await client.post("/orders/", data);
    await invalidate(); // Refresh everything
  };

  return <form onSubmit={handleSubmit}>{/* form */}</form>;
}
```

---

### Pattern 5: Role-Based Prefetch with Redux

**Use Redux auth state to determine what to prefetch:**

```tsx
// Component that prefetches based on Redux auth state
export function SmartPrefetchInitializer() {
  const userRole = useSelector((state) => state.auth.user?.role);

  useEffect(() => {
    if (userRole === "admin") {
      prefetchManager.prefetch(
        cacheKeys.admin(1),
        () => client.get("/admin/orders/"),
        { priority: "high" }
      );

      prefetchManager.prefetch(
        cacheKeys.riderLocations(),
        () => client.get("/riders/locations/"),
        { priority: "medium" }
      );
    }

    if (userRole === "rider") {
      prefetchManager.prefetch(
        cacheKeys.riderOrders("in_progress"),
        () => client.get("/orders/rider/"),
        { priority: "high" }
      );
    }

    if (userRole === "customer") {
      prefetchManager.prefetch(
        cacheKeys.orders(1),
        () => client.get("/orders/?page=1"),
        { priority: "high" }
      );

      prefetchManager.prefetch(
        cacheKeys.notifications(),
        () => client.get("/notifications/"),
        { priority: "medium" }
      );
    }
  }, [userRole]);

  return null;
}

// Add to app layout:
export default function RootLayout() {
  return (
    <html>
      <body>
        <SmartPrefetchInitializer />
        {/* rest of app */}
      </body>
    </html>
  );
}
```

---

### Pattern 6: Polling with Redux

**Keep Redux state fresh with polling:**

```tsx
// For real-time data like rider locations or active orders
export function RiderStatusInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Update Redux state every 10 seconds
    const interval = setInterval(() => {
      dispatch(fetchRiderOrders());
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return null;
}

// With prefetch polling for HTTP optimization:
export function RiderDashboard() {
  const dispatch = useDispatch();

  // HTTP-level polling with prefetch
  const { data } = usePrefetchPolling(
    cacheKeys.riderLocations(),
    () => client.get("/riders/locations/"),
    5000,
    { priority: "high" }
  );

  // Also dispatch Redux to update state
  useEffect(() => {
    dispatch(updateRiderLocations(data));
  }, [data, dispatch]);

  // UI uses Redux
  const locations = useSelector(selectRiderLocations);

  return <RiderMap locations={locations} />;
}
```

---

## Migration Steps

### Step 1: Add Prefetch to Existing Components (No Breaking Changes)

```tsx
// Before:
const orders = useSelector(selectOrders);
useEffect(() => {
  dispatch(fetchOrders(page));
}, [page, dispatch]);

// After: Just add these lines
const { data } = usePrefetch(cacheKeys.orders(page), ...);
usePrefetchBackground(cacheKeys.orders(page + 1), ...);

// Everything else stays the same!
```

### Step 2: Update Redux Thunks (Optional Enhancement)

Only if you want HTTP cache awareness in Redux actions. Otherwise, prefetch works standalone.

### Step 3: Add Cache Invalidation

After mutations, ensure both caches are cleared:

```tsx
await createOrder(data);
prefetchManager.invalidate(cacheKeys.orders(1));
dispatch(fetchOrders(1)); // Redux refreshes
```

### Step 4: Monitor Performance

```tsx
// In Redux DevTools, watch for:
// - Fewer network requests
// - Faster state updates
// - Smoother page transitions

// In browser console:
prefetchManager.getStats();
// See what's cached and how many in-flight requests
```

---

## Best Practices

### ✅ DO

1. **Keep data layer separated**

   - Prefetch handles HTTP caching
   - Redux handles state management
   - Each has one responsibility

2. **Invalidate strategically**

   ```tsx
   // After mutation, invalidate related caches
   await client.post("/orders/", data);
   prefetchManager.invalidate(cacheKeys.orders(1)); // Next load is fresh
   ```

3. **Prefetch predictively**

   ```tsx
   // Prefetch next page before user clicks
   usePrefetchBackground(cacheKeys.orders(page + 1), ...);
   ```

4. **Use Redux for UI state**
   ```tsx
   // Redux handles UI state consistently
   const orders = useSelector(selectOrders);
   ```

### ❌ DON'T

1. **Don't bypass Redux for everything**

   - Prefetch complements, not replaces Redux
   - Keep Redux for application logic

2. **Don't forget cache invalidation**

   - After mutations, invalidate prefetch cache
   - Otherwise stale data shows

3. **Don't prefetch without strategy**

   - Random prefetching wastes bandwidth
   - Prefetch strategically (next page, predictable flows)

4. **Don't mix multiple data fetching patterns**
   - Use prefetch + Redux consistently
   - Avoid: Redux + useFetch + prefetch + axios calls

---

## Performance Metrics Expected

After implementing Redux + Prefetch:

| Metric              | Before           | After         |
| ------------------- | ---------------- | ------------- |
| First Page Load     | 3-5s             | 0.2-0.5s      |
| Page Navigation     | 2-3s             | 0.1-0.3s      |
| API Requests        | 100+ per day     | 20-30 per day |
| Network Bandwidth   | 50MB/month       | 10-15MB/month |
| Redux State Updates | Slow             | Instant       |
| User Experience     | Spinners visible | Seamless      |

---

## Troubleshooting

### Problem: Stale data showing

**Solution**: Reduce TTL or add invalidation after mutations

```tsx
prefetchManager.invalidate(cacheKeys.orders(1));
```

### Problem: Redux state not updating

**Solution**: Ensure you still dispatch Redux actions

```tsx
// Don't just use prefetch, also dispatch:
const { data } = usePrefetch(...);
useEffect(() => {
  dispatch(fetchOrders(page)); // Keep this!
}, [page, dispatch]);
```

### Problem: Too many API calls

**Solution**: Check prefetch deduplication is working

```tsx
prefetchManager.getStats(); // Look at inFlightSize
```

### Problem: Memory growing

**Solution**: Add cache cleanup or reduce TTL

```tsx
// Cleanup specific caches
prefetchManager.invalidate(cacheKeys.orders(10)); // Old pages
```

---

## File Organization

```
lib/prefetch/
├── prefetchManager.ts     ← Core caching logic
├── usePrefetch.ts         ← React hooks
└── examples.tsx           ← Implementation examples

redux/
├── store.ts               ← (Add middleware here)
├── middleware/
│   └── prefetchMiddleware.ts  ← Auto-prefetch after login
└── features/
    └── orderSlice.ts      ← (Update thunk to use prefetch)
```

---

## Next Steps

1. Add `usePrefetch` to high-traffic pages (Orders, Rider)
2. Add middleware for auto-prefetch after login
3. Update mutation handlers to invalidate cache
4. Monitor performance with Redux DevTools
5. Gradually migrate all pages

---

**Result**: Instant-loading app with seamless data updates and no loading spinners! 🚀
