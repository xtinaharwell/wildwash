# Manual Order Creation System - Implementation Guide

## Overview
This document describes the implementation of a manual order creation system that allows staff members to create orders for customers who physically drop off items at the service location. These orders are tracked with the staff member who received them, not assigned to a rider.

## Key Features
1. **Staff can create manual orders** through the staff dashboard
2. **Manual orders bypass rider assignment** - they stay with the staff member who created them
3. **Automatic location assignment** - orders inherit the staff member's service location
4. **Customer details tracking** - orders store customer name, phone, email for walk-in/phone customers
5. **Order type differentiation** - `online` vs `manual` orders have different workflows
6. **Drop-off type classification** - track how customer dropped off the order (`walk_in`, `phone`)

---

## Backend Changes

### 1. Order Model Updates (`wild-wash-api/orders/models.py`)

Added new fields to the `Order` model:

```python
# Order type: online or staff-created manual
order_type = CharField(
    max_length=20,
    choices=[('online', 'Online Order'), ('manual', 'Staff-Created Order')],
    default='online'
)

# How customer dropped off the order
drop_off_type = CharField(
    max_length=20,
    choices=[('delivery', 'Customer Delivery'), ('walk_in', 'Walk-in Customer'), ('phone', 'Phone Order')],
    default='delivery'
)

# Customer details for manual/walk-in orders
customer_name = CharField(max_length=200, null=True, blank=True)
customer_phone = CharField(max_length=20, null=True, blank=True)
customer_email = EmailField(null=True, blank=True)

# Staff member who created this order
created_by = ForeignKey(User, null=True, blank=True, related_name='created_orders')
```

Added new order status:
```python
STATUS_CHOICES = [
    ...
    ('pending_assignment', 'Pending Assignment'),  # For manual orders awaiting rider assignment
]
```

### 2. Order Serializer Updates (`wild-wash-api/orders/serializers.py`)

**OrderCreateSerializer:**
- Added fields: `order_type`, `drop_off_type`, `customer_name`, `customer_phone`, `customer_email`, `actual_price`
- Updated validation logic:
  - Manual orders require `customer_name` and `customer_phone` (no services needed)
  - Online orders require at least one service
- Updated create logic:
  - Tracks `created_by` staff member for manual orders
  - Sets status to `pending_assignment` for manual orders
  - Inherits staff location automatically

**OrderListSerializer:**
- Added `created_by` field with serialization method
- Added `created_by` to output fields
- Includes all manual order fields in response

### 3. Order Views Updates (`wild-wash-api/orders/views.py`)

**New StaffCreateOrderView:**
```python
POST /orders/create/ -> Create a manual order
- Requires authentication as staff member
- Uses OrderCreateSerializer
- Returns created order details with 201 status
```

**OrderUpdateView Changes:**
- Modified rider assignment logic to skip automatic rider assignment for manual orders
- Manual orders remain with their creator (`created_by` field)
- Only online orders get auto-assigned to available riders

### 4. URL Configuration (`wild-wash-api/orders/urls.py`)

Added new endpoint:
```python
path('create/', StaffCreateOrderView.as_view(), name='staff-create-order'),
```

### 5. Database Migration

Migration `0012_order_created_by_order_customer_email_and_more.py` created and applied.

Files modified:
- `orders/models.py`
- `orders/serializers.py`
- `orders/views.py`
- `orders/urls.py`
- Migration files

---

## Frontend Changes

### Staff Dashboard (`wildwash/app/staff/page.tsx`)

**New State Variables:**
```typescript
const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
const [creatingOrder, setCreatingOrder] = useState(false);
const [createOrderForm, setCreateOrderForm] = useState({
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  items: 1,
  weight_kg: '',
  pickup_notes: '',
  estimated_price: '',
  order_type: 'walk_in'  // 'walk_in' or 'phone'
});
```

**New Handler Function:**
```typescript
handleCreateOrder() - Validates form, sends POST to /orders/create/, refreshes order list
```

**UI Components:**
1. **Create Order Button** - Green button in dashboard header to open modal
2. **Create Order Modal** - Form with fields for:
   - Customer name (required)
   - Phone number (required)
   - Email (optional)
   - Drop-off type (walk-in/phone)
   - Quantity of items
   - Weight (kg)
   - Item description
   - Estimated price

3. **Updated Order Table Display:**
   - "Assigned To" column (was "Rider")
   - For manual orders: shows staff creator with "(Creator)" label
   - For online orders: shows assigned rider
   - Color-coded distinction between staff and rider assignments

4. **Updated Filters:**
   - "All staff/riders" filter label (was "All riders")
   - Search placeholder updated to include staff and customer names
   - Filter logic updated to check `created_by` for manual orders

### Filter Logic Updates:

```typescript
// Available riders/staff includes both rider names and staff creators
availableRiders = orders.map(o => {
  if (o.order_type === 'manual') return o.created_by
  return o.rider
})

// Filter matching
if (o.order_type === 'manual') {
  assignedTo = o.created_by
} else {
  assignedTo = o.rider
}
```

---

## API Endpoint Specifications

### POST /orders/create/
**Authentication:** Required (Staff/Superuser)

**Request Body:**
```json
{
  "order_type": "manual",
  "drop_off_type": "walk_in",  // or "phone"
  "customer_name": "John Doe",
  "customer_phone": "+254712345678",
  "customer_email": "john@example.com",  // optional
  "items": 5,
  "weight_kg": 2.5,
  "description": "5 shirts, 2 towels",
  "price": 500,
  "pickup_address": "Walk-in / Manual Order",
  "dropoff_address": "Staff to assign"
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "code": "WW-00123",
  "order_type": "manual",
  "drop_off_type": "walk_in",
  "customer_name": "John Doe",
  "customer_phone": "+254712345678",
  "customer_email": "john@example.com",
  "items": 5,
  "weight_kg": "2.50",
  "description": "5 shirts, 2 towels",
  "price": "500.00",
  "status": "pending_assignment",
  "created_by": {
    "username": "staff_member",
    "first_name": "Staff",
    "last_name": "Member",
    "service_location": {
      "name": "Nairobi Location"
    }
  },
  "service_location": {
    "id": 1,
    "name": "Nairobi Location"
  },
  "created_at": "2025-12-02T10:30:00Z",
  ...
}
```

---

## Workflow

### Manual Order Creation Flow:
1. Staff member clicks "+ Create Order" button
2. Fill in customer details (name, phone required)
3. Select drop-off type (walk-in/phone)
4. Enter order details (items, weight, description, price)
5. Click "Create Order"
6. Order is created with status `pending_assignment`
7. Order is assigned to the creating staff member via `created_by` field
8. Order is NOT assigned to a rider automatically

### Manual Order Completion Flow:
1. Staff member updates order status as they process it
2. When ready (status = 'ready'), NO automatic rider assignment happens
3. Staff can manually assign order to rider if needed, or customer picks it up
4. Order history tracks staff member as creator, not rider

### Differentiation from Online Orders:
- Online orders: Automatically assigned to available riders when marked "ready"
- Manual orders: Stay with staff creator, require manual assignment if needed

---

## Key Differences from Online Orders

| Aspect | Online Order | Manual Order |
|--------|--------------|--------------|
| Created by | Customer via app | Staff member |
| Services | Required | Optional |
| Customer details | Linked user | Form fields |
| Rider assignment | Auto-assigned when "ready" | NOT auto-assigned |
| Person responsible | Assigned rider | Creating staff member |
| Status flow | requested → picked → in_progress → ready → delivered | pending_assignment → ... → ready → delivered |
| Addresses | Customer provided | Staff provided |

---

## Database Schema

### New/Modified Columns in `orders_order`

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| order_type | VARCHAR(20) | 'online' | NO |
| drop_off_type | VARCHAR(20) | 'delivery' | NO |
| customer_name | VARCHAR(200) | NULL | YES |
| customer_phone | VARCHAR(20) | NULL | YES |
| customer_email | EmailField | NULL | YES |
| created_by_id | FK(User) | NULL | YES |
| status | VARCHAR(20) | 'requested' | NO |

---

## Testing Checklist

- [ ] Staff can see "Create Order" button
- [ ] Modal form validates required fields
- [ ] POST request sends correct payload to `/orders/create/`
- [ ] Order is created with `order_type = 'manual'`
- [ ] Order status is set to `pending_assignment`
- [ ] Staff member is tracked in `created_by` field
- [ ] Staff location is auto-assigned
- [ ] Order doesn't appear in rider's available orders list
- [ ] Order table shows staff creator, not blank/N/A for rider
- [ ] Filters work with manual orders (created_by)
- [ ] Search finds manual orders by customer name/staff name
- [ ] Order details page shows all manual order fields
- [ ] NO automatic rider assignment when status changes to 'ready'

---

## Future Enhancements

1. **Manual rider assignment** - Allow staff to manually select rider for manual orders
2. **Walk-in customer profiles** - Create lightweight customer profiles for repeat walk-ins
3. **Print order receipt** - Generate receipt for walk-in customers
4. **Quick-add service type** - Let staff quickly add service type when creating manual order
5. **Bulk order creation** - Upload CSV of walk-in orders
6. **Customer notification** - Send SMS/email to customer with order code
7. **QR code tracking** - Generate QR code for walk-in customer to track status

---

## Important Notes

1. **No Services Required** - Manual orders don't need services defined
2. **Location Auto-Inheritance** - Staff member's location automatically assigned
3. **Guest User Link** - Manual orders linked to "guest_orders" user if no specific user
4. **Creator Tracking** - `created_by` field shows who created the order
5. **Pending Assignment** - Orders wait for manual processing, not auto-rider-assignment
6. **Backward Compatibility** - Existing online order workflow unchanged

---

## Files Modified

### Backend
- `wild-wash-api/orders/models.py` - Added 6 new fields + status choice
- `wild-wash-api/orders/serializers.py` - Updated 2 serializers with validation and new fields
- `wild-wash-api/orders/views.py` - Added StaffCreateOrderView + modified OrderUpdateView logic
- `wild-wash-api/orders/urls.py` - Added new endpoint route
- `wild-wash-api/orders/migrations/0012_*.py` - Database migration (auto-generated)

### Frontend
- `wildwash/app/staff/page.tsx` - Added modal, form, handlers, updated table and filters

---

## Deployment Steps

1. Pull backend changes
2. Run migration: `python manage.py migrate orders`
3. Restart Django server
4. Pull frontend changes
5. Rebuild Next.js: `npm run build`
6. Restart Next.js server
7. Test order creation flow

---

## Support & Debugging

**Common Issues:**

1. **Form not submitting**
   - Check browser console for errors
   - Verify auth token in localStorage
   - Ensure user has `is_staff = true`

2. **Order not created**
   - Check API response status code
   - Verify staff user has `service_location` set
   - Check order creation endpoint returns 201

3. **Order shows as "—" in Rider column**
   - This is expected for manual orders during creation
   - Should show staff creator name after page refresh

4. **Riders can see manual orders**
   - Verify OrderListCreateView filters correctly
   - Manual orders should not appear in `/orders/` for riders
   - Only appear for staff and superusers

---

Generated: December 2, 2025
System: Wildwash Order Management
Version: 1.0.0
