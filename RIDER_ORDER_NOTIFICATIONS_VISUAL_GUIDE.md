# Rider Order Notifications - Visual Guide

## Feature Overview

### NavBar Notification Badge

```
┌──────────────────────────────────────────────────────┐
│  🎯  Wild Wash    Financing  Offers  [Cart]  📦 5  👤 │
│  (logo)                                    ↑
│                                    Notification Dot
│                                    (orange, pulsing)
└──────────────────────────────────────────────────────┘
```

---

## Badge Styles

### Default (No Orders)

```
No badge appears - icon alone
[📦]
```

### With Orders (1-99)

```
Orange badge with number
[📦]
  └─ [5]  ← Orange, pulsing
```

### With Many Orders (100+)

```
Shows "99+" cap
[📦]
  └─ [99+]  ← Orange, pulsing
```

---

## User Journey

### Step 1: Rider Opens App

```
┌─────────────────────────────────────────┐
│         🎯 Wild Wash               │
│  Financing  Offers  [Cart]  📦 5  👤   │
│                               ↑         │
│                    "5 orders available" │
│                    (animated pulsing)   │
└─────────────────────────────────────────┘
        ↓
   Click on badge
        ↓
```

### Step 2: Open Rider Dashboard

```
┌─────────────────────────────────────────┐
│    🎯 Wild Wash               📦 5  👤  │
│                                          │
│  [requested] [in_progress] [picked]     │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Order #001 - Dry Cleaning         │ │
│  │ Pickup: 123 Main St               │ │
│  │ Dropoff: 456 Oak Ave              │ │
│  │ [Assign]  [Details]               │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Order #002 - Laundry              │ │
│  │ Pickup: 789 Pine Rd               │ │
│  │ Dropoff: 321 Elm St               │ │
│  │ [Assign]  [Details]               │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ... (3 more orders)                    │
└─────────────────────────────────────────┘
```

### Step 3: Assign First Order

```
Rider clicks "Assign" on Order #001
         ↓
API processes assignment
         ↓
IMMEDIATE FEEDBACK:
┌─────────────────────────────────────────┐
│    🎯 Wild Wash               📦 4  👤  │
│                               ↑          │
│                  Count decremented!      │
└─────────────────────────────────────────┘

View switches to [in_progress] tab
Order #001 now shows under "in_progress"
Remaining 4 orders shown under "requested"
```

### Step 4: Continue Assigning

```
Assign Order #002  → Badge shows 3
Assign Order #003  → Badge shows 2
Assign Order #004  → Badge shows 1
Assign Order #005  → Badge shows 0 (disappears)

Timeline:
┌────────────┐
│ [5] → [4] → [3] → [2] → [1] → [0] ✓ Done
└────────────┘
```

---

## Badge Appearance

### Color Reference

```
Badge: Orange (bg-orange-500)
├─ Light: #f97316
├─ Medium: #ea580c
└─ Dark: #c2410c

Icon: Current text color (matches theme)
├─ Light mode: Black
└─ Dark mode: White
```

### Animation

```
Pulsing effect (animate-pulse)

Full brightness ─────┐
                     │
Fading out ──────────┤  ← Repeat every 2 seconds
                     │
Fading in ───────────┤
                     │
Full brightness ─────┘
```

### Responsiveness

```
DESKTOP (md and up):
┌────────────────────────────────────┐
│ [WW] Wild Wash  Financing  [Cart] 📦 5 │
│                                      │
│ Full nav bar visible                 │
└────────────────────────────────────┘

MOBILE (below md):
┌──────────────────┐
│ [≡] [WW]  [Cart] 📦 5 │
│                     │
│ Hamburger menu     │
└──────────────────┘
```

---

## Order Status Flow

```
Requested Orders    →  In Progress  →  Picked  →  Ready  →  Delivered
(New, need rider)      (Assigned,      (Pickup   (Waiting  (Complete)
                        in transit)    done)     customer)

Notification Badge tracks ONLY "Requested" orders:

Available: 5  (showing in badge)
   │
   ├─ Order #1 ─ Requested ✓ (counted)
   ├─ Order #2 ─ Requested ✓ (counted)
   ├─ Order #3 ─ Requested ✓ (counted)
   ├─ Order #4 ─ Requested ✓ (counted)
   └─ Order #5 ─ Requested ✓ (counted)

Not counted:
   ├─ Order #6 ─ In Progress ✗
   ├─ Order #7 ─ Picked ✗
   ├─ Order #8 ─ Ready ✗
   └─ Order #9 ─ Delivered ✗
```

---

## Real-time Updates

### Scenario: Two Riders Online

```
BEFORE (Same available pool):
Rider A sees: 📦 5
Rider B sees: 📦 5

Rider A assigns Order #1
         ↓
Rider A sees: 📦 4 (updates immediately)

CURRENT STATE (Without real-time sync):
Rider B still sees: 📦 5
(until page refresh or timeout)

TO FIX: Add WebSocket listener (see enhancement docs)
```

---

## State Transitions

### Redux Store Updates

```
INITIAL STATE:
{
  availableOrdersCount: 0,
  unseenOrdersCount: 0,
  lastUpdated: null
}

AFTER PAGE LOAD (API fetches 5 orders):
{
  availableOrdersCount: 5,
  unseenOrdersCount: 5,
  lastUpdated: "2024-01-15T10:30:00Z"
}

AFTER ASSIGNING ORDER:
{
  availableOrdersCount: 4,
  unseenOrdersCount: 5,
  lastUpdated: "2024-01-15T10:31:15Z"
}
```

---

## API Integration

### GET /orders/rider/ - Fetch Available Orders

```
REQUEST:
GET /orders/rider/
Authorization: Token {token}

RESPONSE (Example):
{
  "results": [
    {
      "id": 1,
      "code": "WW-001",
      "status": "requested",
      "service_name": "Dry Cleaning",
      "pickup_address": "123 Main St",
      "dropoff_address": "456 Oak Ave"
    },
    {
      "id": 2,
      "code": "WW-002",
      "status": "requested",
      ...
    },
    ...
  ]
}

PROCESSING:
→ Filter by status === "requested"
→ Count filtered orders
→ Update Redux state: availableOrdersCount = count
→ Display in nav bar
```

### POST /orders/rider/ - Assign Order

```
REQUEST:
POST /orders/rider/
Authorization: Token {token}
{
  "order_id": 1,
  "action": "accept"
}

RESPONSE:
{
  "success": true,
  "message": "Order assigned successfully"
}

ON SUCCESS:
→ Decrement Redux count by 1
→ Fetch updated orders list
→ Switch to "in_progress" tab
→ Nav bar badge updates immediately
```

---

## Troubleshooting Visual Reference

### Badge Not Showing?

```
Check list:
✓ User logged in?       YES → Continue
                        NO  → Show login button
✓ Is rider?            YES → Continue
                        NO  → Rider only feature
✓ Orders exist?        YES → Continue
                        NO  → Badge doesn't show (by design)
✓ Redux initialized?   YES → ✓ Should display
                        NO  → Check store config
```

### Count Not Decreasing?

```
Debug flow:
1. Click "Assign"        → Network tab shows POST request
2. API responds OK       → Check response status 200/201
3. onClick handler runs  → Check browser console for logs
4. decrementCount() called → Check Redux DevTools
5. Count updates        → Check nav bar updates
6. Re-render            → Should see new count immediately
```

---

## Browser DevTools

### Redux DevTools Inspection

```
Store Path:
store.riderOrderNotification.availableOrdersCount

Example:
{
  riderOrderNotification: {
    availableOrdersCount: 5,
    unseenOrdersCount: 5,
    lastUpdated: "2024-01-15T10:30:00Z"
  }
}

Action Log:
▶ setAvailableOrdersCount(5)
▶ decrementAvailableOrdersCount(1)
▶ updateAvailableOrdersCount(4)
```

### Network Tab

```
Requests to watch:
1. GET /orders/rider/
   └─ Response: Array of orders
   └─ Count filter: status === "requested"
   └─ Result: Update badge count

2. POST /orders/rider/ (assign)
   └─ Body: { order_id: X, action: "accept" }
   └─ Response: Success message
   └─ Trigger: Decrement badge
```

---

## Summary

| Feature          | Details                                   |
| ---------------- | ----------------------------------------- |
| **Location**     | Top nav bar, right side (before profile)  |
| **Color**        | Orange (bg-orange-500)                    |
| **Animation**    | Pulsing fade in/out                       |
| **Shows**        | Available orders count (status=requested) |
| **Updates**      | Immediately on order assignment           |
| **Visibility**   | Only for authenticated riders             |
| **Display**      | Shows number or "99+" if >99              |
| **Click action** | Links to `/rider` page                    |
