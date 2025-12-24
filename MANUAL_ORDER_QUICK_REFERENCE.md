# Manual Order Creation - Quick Reference

## For Staff Users

### How to Create a Walk-in Order:

1. Go to Staff Dashboard
2. Click **+ Create Order** button (green, top right)
3. Fill in form:
   - **Customer Name** ⚠️ Required
   - **Phone Number** ⚠️ Required
   - Email (optional)
   - Drop-off Type: Walk-in ✓ (or Phone)
   - Quantity, Weight, Description, Price (all optional)
4. Click **Create Order**
5. ✅ Order created with status "Pending Assignment"

### What Happens Next:

- Order is assigned to **YOU** (the staff member who created it)
- Order appears in your staff dashboard
- You can update order details as you process it
- Order will NOT be auto-assigned to a rider
- You can manually assign a rider if needed

### Order Status Flow:

```
Walk-in Customer Arrives
    ↓
Create Order [Status: pending_assignment]
    ↓
Process & Update Details [Status: in_progress]
    ↓
Order Ready [Status: ready]
    ↓
Customer Pickup / Manual Rider Assignment
    ↓
Mark Delivered [Status: delivered]
```

### Difference from Online Orders:

| Online Orders | Manual Orders (Walk-in) |
|---|---|
| Customer creates via app | Staff creates in dashboard |
| Automatically assigned to rider | Assigned to staff creator |
| Rider delivers | Staff holds / manual handoff |

---

## For System Administrators

### Key Fields Added to Orders:

```
order_type          → 'online' or 'manual'
drop_off_type       → 'delivery', 'walk_in', or 'phone'
customer_name       → Walk-in customer name
customer_phone      → Walk-in customer phone
customer_email      → Walk-in customer email (optional)
created_by          → Staff member who created order
status              → New option: 'pending_assignment'
```

### API Endpoint:

```
POST /orders/create/
Authorization: Required (Staff User)
Content-Type: application/json

{
  "order_type": "manual",
  "drop_off_type": "walk_in",
  "customer_name": "John Doe",
  "customer_phone": "+254712345678",
  "items": 5,
  "weight_kg": 2.5,
  "description": "Clothing items",
  "price": 500,
  "pickup_address": "Walk-in / Manual Order",
  "dropoff_address": "Staff to assign"
}
```

### Database Changes:

Migration `0012_order_created_by_order_customer_email_and_more.py` added:
- 4 new character fields
- 1 new email field
- 1 new foreign key to User (created_by)
- 1 new status choice

### Important Logic:

**Rider Assignment (OrderUpdateView):**
```
IF order.order_type == 'manual'
  → SKIP automatic rider assignment
  → Order stays with created_by staff member
ELSE (online order)
  → Find available rider
  → Auto-assign when status = 'ready'
```

---

## Changes Summary

### Backend Files
1. `orders/models.py` - Added 6 fields to Order model
2. `orders/serializers.py` - Updated validation & added new fields
3. `orders/views.py` - Added StaffCreateOrderView + modified assignment logic
4. `orders/urls.py` - Added `/orders/create/` endpoint
5. `orders/migrations/0012_*.py` - Database migration

### Frontend Files
1. `wildwash/app/staff/page.tsx`
   - Added create order modal
   - Updated order table columns
   - Updated filter logic
   - Added form state management

---

## Testing Commands

### Check Backend Syntax:
```bash
cd wild-wash-api
python -m py_compile orders/models.py orders/serializers.py orders/views.py
```

### Run Migration:
```bash
python manage.py migrate orders
```

### Test Create Order API:
```bash
curl -X POST http://localhost:8000/orders/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "manual",
    "drop_off_type": "walk_in",
    "customer_name": "Test User",
    "customer_phone": "+254712345678",
    "items": 1,
    "pickup_address": "Walk-in",
    "dropoff_address": "TBD"
  }'
```

---

## Key Features

✅ **Staff creates walk-in orders** in dashboard  
✅ **No services needed** for manual orders  
✅ **Auto location assignment** from staff member  
✅ **Tracks customer details** (name, phone, email)  
✅ **No auto-rider assignment** for manual orders  
✅ **Staff creator tracking** via created_by field  
✅ **Search & filter** by staff/rider and customer  
✅ **Backward compatible** with online orders  

---

## Troubleshooting

### Modal doesn't open?
- Check browser console for errors
- Ensure you're logged in as staff user
- Check `is_staff = true` in user profile

### Form won't submit?
- Name and phone are **required**
- Check network tab for API errors
- Ensure staff user has service_location set

### Order shows wrong person?
- Manual orders show staff creator (top right)
- Refresh page to see updated data
- Check order_type in database

### Riders seeing manual orders?
- Manual orders filtered out by LocationBasedPermission
- OrderListCreateView excludes them from rider view
- Should only show for staff/superusers

---

## Contact & Support

For issues:
1. Check browser console (F12)
2. Check server logs: `python manage.py tail`
3. Review migration: `python manage.py showmigrations orders`
4. Check order details in admin panel

---

Last Updated: December 2, 2025  
Version: 1.0.0  
System: Wildwash Order Management
