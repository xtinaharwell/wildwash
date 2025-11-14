# Rider Order Notifications - Implementation Guide

## Overview

This feature adds a **notification dot on the nav bar** that displays the count of available orders for riders. The notification dot:

- Shows the number of new/unassigned orders (`requested` status)
- Updates when the rider opens the `/rider` page
- **Decrements by 1** each time the rider assigns an order by clicking "Assign"
- Automatically refreshes when the orders list is loaded
- Displays with an **orange color** and **pulsing animation** for visibility
- Only appears for authenticated riders (checks `user.role === 'rider'`)

---

## How It Works

### 1. **Order Count Tracking (Redux Store)**

#### File: `redux/features/riderOrderNotificationSlice.ts`

Redux slice manages the state of rider order notifications:

```typescript
// State structure
{
  availableOrdersCount: number; // Total available orders
  unseenOrdersCount: number; // New unseen orders
  lastUpdated: string | null; // Timestamp of last update
}

// Available actions:
-setAvailableOrdersCount(count) - // Set initial count from API
  updateAvailableOrdersCount(count) - // Update count from refresh
  decrementAvailableOrdersCount(1) - // Decrement when order assigned
  resetOrderNotifications() - // Clear all notifications
  markOrdersAsSeen(); // Mark as seen
```

### 2. **Custom Hook for Management**

#### File: `lib/hooks/useRiderOrderNotifications.ts`

Provides a clean interface to manage order notifications:

```typescript
const {
  availableOrdersCount, // Current count (0-99+)
  unseenOrdersCount, // Unseen count
  decrementCount, // Decrement by 1 (or specified amount)
  resetNotifications, // Clear all
  markAsSeen, // Mark as seen
  updateCount, // Update count
  setAvailableOrdersCount, // Set count directly
  fetchAndUpdateOrdersCount, // Fetch from API and update
} = useRiderOrderNotifications();
```

**Key Features:**

- Auto-fetches orders on mount (for riders only)
- Filters for `status === 'requested'` orders
- Syncs with Redux store
- Returns current count for display

### 3. **NavBar Integration**

#### File: `components/NavBar.tsx`

The notification dot appears in the nav bar:

```tsx
{
  /* Rider Orders Notification Dot */
}
{
  isRider && isAuthenticated && (
    <Link
      href="/rider"
      className="relative p-2 rounded-full hover:bg-slate-100..."
      title="Available orders"
    >
      <svg>...</svg>
      {availableOrdersCount > 0 && (
        <span className="... bg-orange-500 animate-pulse">
          {availableOrdersCount > 99 ? "99+" : availableOrdersCount}
        </span>
      )}
    </Link>
  );
}
```

**Styling:**

- **Color:** Orange (bg-orange-500)
- **Animation:** Pulsing (`animate-pulse`)
- **Position:** Top-right badge style
- **Display:** Shows "99+" if count exceeds 99

### 4. **Rider Page Integration**

#### File: `app/rider/page.tsx`

When a rider assigns an order:

```tsx
const handleAssignOrder = async (orderId: number) => {
  // ... API call to assign order ...

  // Decrement the available orders count in navbar
  decrementOrderCount(1);

  // Refresh orders and switch status
  await fetchOrders();
  setCurrentStatus("in_progress");
};
```

**Flow:**

1. Rider clicks "Assign" on an order
2. Order is sent to backend API
3. On success → count decrements by 1 in navbar
4. Orders list refreshes from API
5. View switches to "in_progress" tab

---

## User Experience Flow

```
┌─────────────────────────────────────────────────────┐
│ Rider opens app - NavBar shows 5 available orders   │
│ (orange dot with "5" pulsing in nav bar)            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Rider clicks nav notification dot or /rider link    │
│ Rider page loads and fetches available orders       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Rider sees 5 orders with "Assign" buttons           │
│ NavBar still shows "5"                              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Rider clicks "Assign" on first order                │
│ API processes assignment                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ ✅ SUCCESS:                                         │
│ - NavBar dot now shows "4" (decremented from 5)     │
│ - Orders list refreshes                            │
│ - View switches to "in_progress" tab                │
│ - Order disappears from "requested" tab             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Rider continues assigning remaining orders...       │
│ NavBar updates: 4 → 3 → 2 → 1 → 0                   │
│ When 0, dot disappears from nav bar                 │
└─────────────────────────────────────────────────────┘
```

---

## API Flow

### Fetching Available Orders Count

```
GET /orders/rider/
Headers: Authorization: Token {token}

Response: Array of orders
Filter: orders where status === 'requested'
Count: filtered_orders.length
Store: in Redux state
Display: in nav bar dot
```

### Assigning an Order

```
POST /orders/rider/
Headers: Authorization: Token {token}
Body: { order_id: 123, action: 'accept' }

Response: Success/Error
On Success:
  1. Decrement count: current - 1
  2. Fetch orders again
  3. Switch to in_progress tab
```

---

## File Structure

```
wildwash/
├── redux/
│   ├── features/
│   │   ├── riderOrderNotificationSlice.ts (NEW)
│   │   ├── authSlice.ts
│   │   └── ...
│   └── store.ts (UPDATED)
├── lib/
│   └── hooks/
│       ├── useRiderOrderNotifications.ts (NEW)
│       └── ...
├── components/
│   └── NavBar.tsx (UPDATED)
└── app/
    └── rider/
        └── page.tsx (UPDATED)
```

---

## Configuration & Customization

### Styling the Notification Dot

Edit `components/NavBar.tsx`:

```tsx
// Color: Change bg-orange-500 to any Tailwind color
<span className="... bg-amber-500 ...">  // Change color

// Animation: Change animate-pulse to another animation
<span className="... animate-bounce ...">  // Or animate-bounce

// Size: Change h-5 w-5 to another size
<span className="... h-6 w-6 ...">  // Larger badge

// Position: Change -top-1 -right-1 to adjust position
<span className="-top-2 -right-2 ...">  // Different position
```

### Changing TTL/Refresh Interval

Edit `lib/hooks/useRiderOrderNotifications.ts`:

```typescript
// The hook fetches on mount (no polling by default)
// To add auto-refresh, add a useEffect:

useEffect(() => {
  const interval = setInterval(() => {
    fetchAndUpdateOrdersCount();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);
```

### Change Display Threshold

```tsx
// Only show dot if count > 3 (instead of > 0)
{
  availableOrdersCount > 3 && (
    <span className="...">{availableOrdersCount}</span>
  );
}
```

---

## Troubleshooting

### ❌ Dot not showing

**Check:**

1. Is user authenticated? (`isAuthenticated === true`)
2. Is user role 'rider'? (`user.role === 'rider'`)
3. Are there available orders? (`availableOrdersCount > 0`)
4. Redux store properly initialized? Check Redux DevTools

**Fix:**

```tsx
// Add debug logging
console.log("isRider:", isRider);
console.log("isAuthenticated:", isAuthenticated);
console.log("availableOrdersCount:", availableOrdersCount);
```

### ❌ Count not updating after assignment

**Check:**

1. API call successful? Check network tab in DevTools
2. `decrementOrderCount()` called? Add console.log
3. Redux store updating? Check Redux DevTools

**Fix:**

```tsx
const handleAssignOrder = async (orderId: number) => {
  // ... code ...
  console.log("Before decrement:", availableOrdersCount);
  decrementOrderCount(1);
  console.log("After decrement: should update");
};
```

### ❌ Count not syncing across tabs

**Reason:** Redux state is client-side only. Refreshing the page will reset count.

**Solution:** Add polling in the hook:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchAndUpdateOrdersCount();
  }, 60000); // Poll every minute

  return () => clearInterval(interval);
}, []);
```

---

## Testing the Feature

### Manual Testing

1. **Login as Rider**

   - Go to `/rider-login`
   - Sign in with rider credentials

2. **Check NavBar**

   - Should see orange dot with number (if orders available)
   - Should be pulsing

3. **Test Assignment**

   - Click on rider nav link → `/rider`
   - Click "Assign" on an order
   - Watch nav bar count decrease by 1
   - Verify order moves to "in_progress"

4. **Test Refresh**
   - Click refresh button
   - Count should update from latest API data
   - Should match actual available orders

### Browser DevTools Testing

**Redux DevTools:**

```javascript
// Check state in console
store.getState().riderOrderNotification;
// Output: { availableOrdersCount: 5, unseenOrdersCount: 5, lastUpdated: '...' }
```

**Network Tab:**

```
GET /orders/rider/ → Check response count
POST /orders/rider/ → Check assignment response
```

---

## Performance Considerations

### Optimization

- ✅ **Redux caching:** Count cached in store, no re-fetch on nav bar render
- ✅ **Debounced updates:** Only fetch when needed (on page load, after assignment)
- ✅ **Selective rendering:** Dot only renders for riders
- ✅ **Minimal re-renders:** Uses selector to get specific state slice

### Scalability

- **Count limit:** Displays "99+" for 100+ orders (prevents UI overflow)
- **Memory:** Redux stores single number, minimal memory footprint
- **API calls:** Only fetches on page mount and after explicit actions

---

## Future Enhancements

1. **Real-time updates via WebSocket**

   ```typescript
   // Could add WebSocket listener to update count
   // as orders come in or are assigned by other riders
   ```

2. **Notification sound**

   ```typescript
   // Play sound when order count increases
   const playNotificationSound = () => {
     new Audio("/notification.mp3").play();
   };
   ```

3. **Desktop notifications**

   ```typescript
   // Show OS notification when new orders arrive
   new Notification("New Order", { body: "5 orders available" });
   ```

4. **Persistent storage**

   ```typescript
   // Save last count to localStorage
   // Compare on load to detect new orders
   ```

5. **Order type filtering**
   ```typescript
   // Show dots for specific order types
   // e.g., only "urgent" orders
   ```

---

## Code References

### Redux Slice Actions

- `setAvailableOrdersCount(5)` - Set count to 5
- `decrementAvailableOrdersCount(1)` - Reduce by 1
- `updateAvailableOrdersCount(3)` - Update from API
- `resetOrderNotifications()` - Clear count

### Hook Usage

```typescript
const {
  availableOrdersCount, // Use in JSX
  decrementCount, // Call on assign
  fetchAndUpdateOrdersCount, // Call on refresh
} = useRiderOrderNotifications();
```

### NavBar Integration

```tsx
{
  isRider && isAuthenticated && (
    <Link href="/rider" className="...">
      <svg>...</svg>
      {availableOrdersCount > 0 && (
        <span className="... bg-orange-500 animate-pulse">
          {availableOrdersCount > 99 ? "99+" : availableOrdersCount}
        </span>
      )}
    </Link>
  );
}
```

---

## Summary

✅ **Feature complete:**

- Notification dot shows available order count
- Updates on rider page load
- Decrements when order assigned
- Redux-powered state management
- Zero external dependencies
- Mobile responsive
- Accessible UI

**Key Benefits:**

- Riders always know how many orders are available
- Real-time count updates
- Encourages order assignment
- Clean, simple implementation
- Scalable architecture
