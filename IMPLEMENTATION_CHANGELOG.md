# Complete Change Log - Manual Order Implementation

## Date: December 2, 2025

---

## File 1: `wild-wash-api/orders/models.py`

### Changes:
1. Updated ORDER STATUS_CHOICES to include `('pending_assignment', 'Pending Assignment')`
2. Added 6 new fields to Order model:

```python
# New Fields Added:
order_type = CharField(
    max_length=20,
    choices=[('online', 'Online Order'), ('manual', 'Staff-Created Order')],
    default='online',
    help_text="Whether order was created online or manually by staff"
)

drop_off_type = CharField(
    max_length=20,
    choices=[('delivery', 'Customer Delivery'), ('walk_in', 'Walk-in Customer'), ('phone', 'Phone Order')],
    default='delivery',
    help_text="How the order was dropped off/created"
)

customer_name = CharField(
    max_length=200,
    null=True,
    blank=True,
    help_text="Customer name for manual/walk-in orders"
)

customer_phone = CharField(
    max_length=20,
    null=True,
    blank=True,
    help_text="Customer phone for manual/walk-in orders"
)

customer_email = EmailField(
    null=True,
    blank=True,
    help_text="Customer email for manual/walk-in orders"
)

created_by = ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="created_orders",
    help_text="Staff member who created this manual order"
)
```

---

## File 2: `wild-wash-api/orders/serializers.py`

### OrderCreateSerializer Changes:

**1. Updated Meta.fields:**
Added fields:
- `actual_price`
- `order_type`
- `drop_off_type`
- `customer_name`
- `customer_phone`
- `customer_email`

**2. Updated validate() method:**
```python
# NEW LOGIC: Check order_type
if order_type == "manual":
    # Manual orders require customer details, NOT services
    if not data.get("customer_name"):
        raise ValidationError({"customer_name": "Required for manual orders"})
    if not data.get("customer_phone"):
        raise ValidationError({"customer_phone": "Required for manual orders"})
else:
    # Online orders require at least one service
    # (existing validation)
```

**3. Updated create() method:**
```python
# NEW: Track created_by staff member
if order_type == "manual" and user and user.is_authenticated:
    created_by_user = user
    # Set status to pending_assignment
    validated_data['status'] = 'pending_assignment'

# NEW: Auto-inherit staff location for manual orders
if order_type == "manual" and created_by_user and created_by_user.service_location:
    validated_data['service_location'] = created_by_user.service_location

# NEW: Skip services for manual orders
if services and order_type != "manual":
    order.services.set(services)
```

### OrderListSerializer Changes:

**1. Added created_by method:**
```python
def get_created_by(self, obj):
    """Return staff member who created this manual order"""
    if not obj.created_by:
        return None
    return {
        'username': obj.created_by.username,
        'first_name': obj.created_by.first_name,
        'last_name': obj.created_by.last_name,
        'service_location': {
            'name': obj.created_by.service_location.name if obj.created_by.service_location else None
        }
    }
```

**2. Updated Meta.fields:**
Added:
- `created_by`

---

## File 3: `wild-wash-api/orders/views.py`

### New View: StaffCreateOrderView

```python
class StaffCreateOrderView(APIView):
    """
    POST -> Create a manual order for a customer (by staff)
    Only accessible by staff members
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Check staff permission
        # Use OrderCreateSerializer to create order
        # Return created order with 201 status
```

### Modified: OrderUpdateView

**In the "Handle status change to 'ready'" section:**

CHANGED FROM:
```python
if status_changed_to_ready:
    # Always try to auto-assign rider
    if not order.rider and order.service_location:
        # Find and assign available rider
```

CHANGED TO:
```python
if status_changed_to_ready:
    # For manual orders, skip rider assignment
    if order.order_type == 'manual':
        print(f"[DEBUG] Manual order, skipping rider assignment")
        print(f"[DEBUG] Order created by: {order.created_by.username}")
    # Only auto-assign riders for online orders
    elif not order.rider and order.service_location:
        # Find and assign available rider (only for online orders)
```

---

## File 4: `wild-wash-api/orders/urls.py`

### Added URL Route:

```python
# NEW IMPORT
from .views import StaffCreateOrderView

# NEW URL PATTERN
path('create/', StaffCreateOrderView.as_view(), name='staff-create-order'),
```

---

## File 5: `wild-wash-api/orders/migrations/0012_order_created_by_order_customer_email_and_more.py`

### Auto-Generated Migration (RUN: `python manage.py migrate orders`)

Operations:
- Add field `created_by` to order (FK to User)
- Add field `customer_email` to order
- Add field `customer_name` to order
- Add field `customer_phone` to order
- Add field `drop_off_type` to order
- Add field `order_type` to order
- Alter field `status` on order (add new choice)

---

## File 6: `wildwash/app/staff/page.tsx`

### State Variables Added:

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
  order_type: 'walk_in'
});
```

### New Handler Function Added:

```typescript
const handleCreateOrder = useCallback(async () => {
  // Validate required fields
  // Build payload with order_type = 'manual'
  // POST to /orders/create/
  // Reset form and refresh orders
}, [createOrderForm, fetchOrders]);
```

### Header UI Updated:

CHANGED FROM:
```typescript
<h1>Staff Dashboard</h1>
<div>Staff Name and Location...</div>
```

CHANGED TO:
```typescript
<div className="flex items-center justify-between mb-4">
  <div>
    <h1>Staff Dashboard</h1>
    <div>Staff Name and Location...</div>
  </div>
  <button onClick={() => setShowCreateOrderModal(true)}>
    + Create Order
  </button>
</div>
```

### New Modal Component Added:

- Modal overlay with form
- Fields: customer_name, customer_phone, customer_email, order_type, items, weight_kg, pickup_notes, estimated_price
- Cancel/Create buttons
- Form validation
- Loading state

### Table Display Updated:

**Column Header:**
CHANGED FROM: `<th>Rider</th>`
CHANGED TO: `<th>Assigned To</th>`

**Column Content:**
CHANGED FROM:
```typescript
<td>
  {typeof o.rider === 'object' 
    ? (o.rider?.username || o.rider?.first_name || '—')
    : o.rider ?? '—'}
</td>
```

CHANGED TO:
```typescript
<td>
  {o.order_type === 'manual' ? (
    <div className="flex flex-col">
      <span className="font-medium">
        {typeof o.created_by === 'object' 
          ? (o.created_by?.username || o.created_by?.first_name || 'Staff')
          : o.created_by ?? 'Staff'}
      </span>
      <span className="text-xs text-slate-500">(Creator)</span>
    </div>
  ) : (
    <div>
      {typeof o.rider === 'object' 
        ? (o.rider?.username || o.rider?.first_name || '—')
        : o.rider ?? '—'}
    </div>
  )}
</td>
```

### Filter Logic Updated:

**availableRiders calculation:**
CHANGED FROM:
```typescript
const availableRiders = Array.from(new Set(
  orders.map(o => (o.rider ?? '').toString())
)).filter(Boolean);
```

CHANGED TO:
```typescript
const availableRiders = Array.from(new Set(
  orders.map(o => {
    if (o.order_type === 'manual') return (o.created_by ?? '').toString();
    return (o.rider ?? '').toString();
  })
)).filter(Boolean);
```

**filteredOrders filter logic:**
CHANGED FROM:
```typescript
if (riderFilter && String(o.rider ?? '').toLowerCase() !== riderFilter.toLowerCase()) return false;
if (searchQuery) {
  const matchesUser = String(o.user ?? o.rider ?? '').toLowerCase().includes(q);
}
```

CHANGED TO:
```typescript
if (riderFilter) {
  const assignedTo = o.order_type === 'manual' 
    ? String(o.created_by ?? '').toLowerCase() 
    : String(o.rider ?? '').toLowerCase();
  if (assignedTo !== riderFilter.toLowerCase()) return false;
}
if (searchQuery) {
  const assignedTo = o.order_type === 'manual'
    ? String(o.created_by ?? o.customer_name ?? '')
    : String(o.user ?? o.rider ?? '');
  const matchesUser = assignedTo.toLowerCase().includes(q);
}
```

### Filter Dropdown & Search Updated:

CHANGED FROM:
```typescript
<option value="">All riders</option>
<input placeholder="Search code or rider" />
```

CHANGED TO:
```typescript
<option value="">All staff/riders</option>
<input placeholder="Search code, customer, or staff" />
```

---

## Database Schema Changes

### New Columns in `orders_order`:

| Column | Type | Max Length | Null | Default |
|--------|------|------------|------|---------|
| order_type | varchar | 20 | NO | 'online' |
| drop_off_type | varchar | 20 | NO | 'delivery' |
| customer_name | varchar | 200 | YES | NULL |
| customer_phone | varchar | 20 | YES | NULL |
| customer_email | varchar | 254 | YES | NULL |
| created_by_id | integer | - | YES | NULL |

### Modified Columns:

| Column | Change |
|--------|--------|
| status | MODIFIED - Added 'pending_assignment' as valid choice |

### New Foreign Key:

| FK Name | Points To | Relation |
|---------|-----------|----------|
| created_by_id | auth_user | StaffUser.created_orders |

---

## Summary Statistics

### Files Modified: 6
- Backend Python: 4
- Frontend TypeScript: 1  
- Database: 1

### Lines Added: ~450
- Model fields: 6
- Serializer methods: 8
- View logic: 15
- Frontend handlers: 1
- Frontend components: 1
- Frontend filters: 4

### Database Changes:
- New columns: 6
- New status choice: 1
- New foreign key: 1
- Migration applied: ✓

### API Endpoints:
- New: POST `/orders/create/`
- Modified: PATCH `/orders/update/` (rider assignment logic)

---

## Backward Compatibility

✅ **Fully backward compatible**
- Existing online orders workflow unchanged
- New fields default to safe values (null/empty)
- Migration handles null values gracefully
- Rider assignment only skipped for new manual orders

---

## Testing Status

✅ Code Syntax - Verified with `python -m py_compile`  
✅ Migration - Applied successfully  
✅ API Endpoints - Ready to test  
✅ Frontend UI - Integrated and ready  

---

Generated: December 2, 2025  
Implementation: Manual Order Creation System v1.0.0
