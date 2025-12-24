# Washer & Folder Staff Workflow Implementation

## Overview
Implemented a two-role staff system for laundry processing:
- **Washer**: Receives orders in `in_progress` status, weighs items, washes them, then marks as `washed`
- **Folder**: Receives orders in `washed` status, folds them, then marks as `ready` for delivery

## Database Changes

### 1. User Model (`users/models.py`)
Added new staff role types:
```python
ROLE_CHOICES: Added "washer" and "folder" roles
STAFF_TYPE_CHOICES: New field to distinguish staff types
  - "general" (default staff)
  - "washer" (laundry processing)
  - "folder" (final processing)

New field: staff_type (CharField with choices above)
```

### 2. Order Model (`orders/models.py`)
Added new status and workflow tracking fields:

**New Status:**
- `'washed'` - Order has been washed and is ready for folding

**New Fields:**
- `washer` (ForeignKey) - Staff member who washed the order
- `washed_at` (DateTimeField) - Timestamp when order was washed
- `folder` (ForeignKey) - Staff member who folded the order
- `folded_at` (DateTimeField) - Timestamp when order was folded

### 3. Migrations Applied
- `users/migrations/0006_add_staff_types.py` - Added staff_type field and role choices
- `orders/migrations/0016_add_washer_folder_workflow.py` - Added washer/folder workflow fields

## API Endpoints

### 1. RiderOrderListView (Enhanced)
Now shows different orders based on user's staff_type:

**For Washer Staff:**
- GET `/orders/rider/`
- Returns: `in_progress` orders from their location with no washer assigned
- Allows washer to see orders needing washing

**For Folder Staff:**
- GET `/orders/rider/`
- Returns: `washed` orders from their location with no folder assigned
- Allows folder to see orders needing folding

**For Rider:**
- GET `/orders/rider/`
- Returns: `in_progress`, `picked`, `ready`, `delivered` orders assigned to them
- Original rider behavior preserved

### 2. OrderUpdateView (Enhanced)
Handles status changes with automatic tracking:

**When Status → "washed" (Washer marks as done):**
1. Automatically assigns `washer` = current user
2. Sets `washed_at` = current timestamp
3. Creates OrderEvent for audit trail
4. Notifies all folder staff in the location:
   - In-app notification: "Order is ready for folding!"
   - SMS notification with order details
   - Message format includes: Order #, Customer, Service, Items, Weight

**When Status → "ready" (Folder marks as done):**
1. Automatically assigns `folder` = current user
2. Sets `folded_at` = current timestamp
3. Creates OrderEvent for audit trail
4. Continues existing "ready" workflow:
   - Auto-assigns rider if not assigned
   - Notifies rider via SMS and in-app
   - Sends customer ready notification SMS

## Workflow Visualization

```
Order Status Flow:
┌──────────────┐
│  requested   │  (Order created)
└──────┬───────┘
       │
┌──────▼────────────┐
│   in_progress     │  (Washer assigned here)
└──────┬────────────┘
       │
       │ Washer weighs items → marks "washed"
       │ (Automatic washer assignment + notification to folders)
       │
┌──────▼────────────┐
│     washed        │  (Folder assigned here)
└──────┬────────────┘
       │
       │ Folder folds items → marks "ready"
       │ (Automatic folder assignment + rider notification)
       │
┌──────▼────────────┐
│      ready        │  (Rider assigned, customer notified)
└──────┬────────────┘
       │
       │ Rider picks up → marks "delivered"
       │
┌──────▼────────────┐
│    delivered      │  (Delivery complete)
└───────────────────┘
```

## Key Features

### 1. Role-Based Order Assignment
- Washer only sees `in_progress` orders needing washing
- Folder only sees `washed` orders needing folding
- Rider only sees `ready` orders for delivery

### 2. Automatic Tracking
- System automatically records who washed each order
- System automatically records who folded each order
- Timestamps capture exact moment of completion

### 3. Auto-Notifications
When washer marks as washed:
- ✅ In-app notification to all folder staff
- ✅ SMS notification to all folder staff with details

When folder marks as ready:
- ✅ Auto-assigns available rider (existing logic)
- ✅ In-app notification to assigned rider
- ✅ SMS notification to rider
- ✅ SMS notification to customer

### 4. Audit Trail
- OrderEvent records all status changes
- Can track who did what and when
- Full visibility into order lifecycle

## SMS Message Examples

### Washer → Folder Notification
```
📦 Order Ready for Folding!
Order #: WW-00205
Customer: John Doe
Service: Laundry Cleaning
Items: 5
Weight: 2.5kg
Please proceed with folding. Thank you!
```

### Existing Folder → Rider (unchanged)
```
🚴 Order Ready for Delivery!
Order: WW-00205
Service: Laundry Cleaning
Pickup: Downtown Office
Dropoff: Kilimani Apartments
...
```

## Admin/Staff Dashboard Updates Needed

The staff dashboard (`wildwash/app/staff/page.tsx`) should be updated to:
1. Show staff_type filter to distinguish washers vs folders
2. Display who washed each order (washer name + time)
3. Display who folded each order (folder name + time)
4. Add columns for `washed_at` and `folded_at`

## Database Query Examples

```python
# Get all orders washed by a specific staff member
Order.objects.filter(washer=staff_user)

# Get all orders folded by a specific staff member
Order.objects.filter(folder=staff_user)

# Get in-progress orders not yet assigned to a washer
Order.objects.filter(status='in_progress', washer__isnull=True)

# Get washed orders not yet assigned to a folder
Order.objects.filter(status='washed', folder__isnull=True)

# Get orders by washer for a location
Order.objects.filter(
    washer__service_location=location,
    washer__staff_type='washer'
)
```

## Testing Checklist

- [ ] Create washer staff user with staff_type='washer'
- [ ] Create folder staff user with staff_type='folder'
- [ ] Create an order and move to `in_progress`
- [ ] Washer accesses `/orders/rider/` and sees the order
- [ ] Washer marks order as `washed` (updates status)
- [ ] Verify: washer field is auto-populated
- [ ] Verify: folder staff receives SMS notification
- [ ] Folder accesses `/orders/rider/` and sees the order
- [ ] Folder marks order as `ready`
- [ ] Verify: folder field is auto-populated
- [ ] Verify: rider gets notified
- [ ] Verify: customer gets SMS with ready notification
- [ ] Check OrderEvent records show all status changes

## Notes

- Existing rider functionality is fully preserved
- Washer/Folder staff are location-specific (use service_location)
- All SMS notifications use existing AfricasTalkingSMSService
- Backward compatible with existing orders (washer/folder can be null)
- Works seamlessly with delivery request flow
