# Washer & Folder Staff Setup Guide

## Quick Start: Creating Washer and Folder Staff

### Using Django Admin (Easiest)
1. Go to `/admin/`
2. Navigate to Users
3. Create two new users:

#### User 1: Washer
```
Username: washer1
First Name: John
Last Name: Smith
Email: john@example.com
Phone: +254712345678
Role: staff
Staff Type: washer
Service Location: [Your Location]
Is Staff: ✓ (checked)
Is Active: ✓ (checked)
```

#### User 2: Folder
```
Username: folder1
First Name: Jane
Last Name: Doe
Email: jane@example.com
Phone: +254712345679
Role: staff
Staff Type: folder
Service Location: [Your Location]
Is Staff: ✓ (checked)
Is Active: ✓ (checked)
```

### Using Management Command (Alternative)
```bash
python manage.py shell
```

```python
from users.models import User, Location

# Get your location
location = Location.objects.get(name='Downtown')

# Create washer
User.objects.create_user(
    username='washer1',
    email='washer@example.com',
    password='secure_password_123',
    phone='+254712345678',
    role='staff',
    staff_type='washer',
    service_location=location,
    is_staff=True
)

# Create folder
User.objects.create_user(
    username='folder1',
    email='folder@example.com',
    password='secure_password_123',
    phone='+254712345679',
    role='staff',
    staff_type='folder',
    service_location=location,
    is_staff=True
)
```

## Testing the Workflow

### Step 1: Create an Order
```bash
# Create order via API or admin panel
# Status should be: requested
# Rider: Not assigned yet
```

### Step 2: Washer Login & Access Orders
```
URL: http://localhost:3000/rider-orders  (or equivalent)
Username: washer1
Password: secure_password_123
```

**Expected:** Washer sees orders in `in_progress` status

### Step 3: Washer Records Measurements
Washer should:
1. Click on an order
2. Enter quantity and weight
3. Add notes if needed

### Step 4: Washer Marks as Washed
1. Change order status to `washed`
2. System automatically:
   - Records washer name
   - Records wash timestamp
   - Notifies all folder staff
   - Sends SMS to folder staff

### Step 5: Folder Login & Access Orders
```
URL: http://localhost:3000/rider-orders
Username: folder1
Password: secure_password_123
```

**Expected:** Folder sees orders in `washed` status

### Step 6: Folder Marks as Ready
1. Change order status to `ready`
2. System automatically:
   - Records folder name
   - Records fold timestamp
   - Auto-assigns rider (if not assigned)
   - Notifies rider via SMS
   - Sends ready notification to customer

## Staff Dashboard Integration

The staff dashboard at `/staff` should be updated to show:

### Washer View
- Filter to show only `in_progress` orders
- Display columns:
  - Order Code
  - Customer Name
  - Weight (from details form)
  - Items/Quantity
  - Status
  - Action: Mark as Washed

### Folder View  
- Filter to show only `washed` orders
- Display columns:
  - Order Code
  - Customer Name
  - Weight
  - Items/Quantity
  - Washed By (washer name)
  - Washed At (timestamp)
  - Action: Mark as Ready

## Database Verification

Check if staff were created:
```bash
python manage.py shell
```

```python
from users.models import User

# List all washer staff
washers = User.objects.filter(staff_type='washer')
for w in washers:
    print(f"{w.username} - {w.service_location}")

# List all folder staff
folders = User.objects.filter(staff_type='folder')
for f in folders:
    print(f"{f.username} - {f.service_location}")

# Check an order's workflow
from orders.models import Order
order = Order.objects.get(code='WW-00205')
print(f"Order: {order.code}")
print(f"Washer: {order.washer}")
print(f"Washed at: {order.washed_at}")
print(f"Folder: {order.folder}")
print(f"Folded at: {order.folded_at}")
```

## Common Issues & Solutions

### Issue: Washer/Folder not seeing orders
**Solution:** Check that:
1. User has `is_staff=True`
2. User has `service_location` set
3. User has correct `staff_type`
4. Orders are in the right status
5. Orders are in the same location as staff member

### Issue: SMS not being sent
**Solution:**
1. Verify `ADMIN_PHONE_NUMBER` is set in settings
2. Check folder staff have phone numbers
3. Verify Africas Talking API credentials
4. Check console logs for SMS errors

### Issue: Rider not auto-assigned when marked ready
**Solution:**
1. Ensure rider exists in that location
2. Rider must have `is_active=True`
3. Check `LocationBasedPermission` logic

## API Testing with cURL

### Get Washer's Orders
```bash
curl -H "Authorization: Token <washer_token>" \
  http://localhost:8000/orders/rider/
```

### Get Folder's Orders
```bash
curl -H "Authorization: Token <folder_token>" \
  http://localhost:8000/orders/rider/
```

### Mark Order as Washed (by Washer)
```bash
curl -X PATCH \
  -H "Authorization: Token <washer_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "washed"}' \
  http://localhost:8000/orders/update/?id=<order_id>
```

### Mark Order as Ready (by Folder)
```bash
curl -X PATCH \
  -H "Authorization: Token <folder_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready"}' \
  http://localhost:8000/orders/update/?id=<order_id>
```

## Notes

- Each location can have multiple washer and folder staff
- The workflow is fully automatic for notifications
- Washer/Folder are tracked at order level for auditing
- All status changes are logged in OrderEvent table
- SMS messages include order and staff information
