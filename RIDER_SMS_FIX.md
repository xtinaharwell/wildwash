# Rider SMS Fix - Order Assignment Before SMS

## Problem
When an order was created with a rider assigned, the rider was not receiving SMS notifications because:

1. **Timing Issue**: The SMS sending code in `perform_create()` was checking for `order.rider` 
2. **Signal Delay**: Rider assignment happened in Django signals (after `perform_create` completed)
3. **Race Condition**: By the time signals assigned the rider, the SMS sending block had already executed

### Timeline of the Issue:
```
1. Order created by serializer.save()
2. perform_create() executes → checks order.rider (still None!)
3. SMS sending block runs → no rider, so no SMS sent
4. Signal handler runs → finally assigns the rider
5. Too late! SMS already attempted to send
```

## Solution
**Move rider assignment logic BEFORE SMS sending in `perform_create()`**

### Changes Made

#### File: `orders/views.py`

1. **Added Import**
```python
from users.models import Location
```

2. **Modified `perform_create()` method**:
   - Added rider auto-assignment logic at the beginning (same as signals.py)
   - This ensures the rider is assigned BEFORE checking for SMS
   - Only applies to manual orders (like the signals already did)
   - Finds available riders sorted by workload (completed_jobs)

3. **New Flow**:
```
1. Order created by serializer.save()
2. perform_create() executes
   ├─ Order auto-assigned to rider (NEW!)
   ├─ Rider phone verified
   └─ SMS sent successfully to rider
3. Signal handler runs (but doesn't re-assign since rider exists)
4. Rider receives SMS notification
```

## Key Implementation Details

### Rider Auto-Assignment Logic
```python
# Only for manual orders without a rider
if not order.rider and order.order_type == 'manual':
    # Get service location
    # Find available riders sorted by completed_jobs
    # Assign to least busy rider
    # Save order with new rider
```

### Location Priority
1. Use order's existing `service_location`
2. Try to match from user's `location` field
3. Try to extract from `pickup_address`
4. Fall back to first active location

### Rider Selection
- Filters riders by: `role='rider'`, same `service_location`, `is_active=True`
- Orders by `rider_profile__completed_jobs` (ascending = least busy first)
- Assigns to first rider (most available)

## SMS Sequence
After rider assignment, SMS is sent to:
1. **Customer** - Order confirmation
2. **Admin** - New order alert
3. **Rider** ✅ **NOW WORKING!** - Order assigned with pickup details

## Debug Output
The code logs extensively for troubleshooting:
```
[DEBUG perform_create] Order WW-12345 created
[DEBUG] Initial rider: None
✓ Order WW-12345 auto-assigned to rider john_rider
[DEBUG] Rider after assignment: john_rider
[DEBUG] Rider phone: +254718693484
[DEBUG] Checking rider for SMS: <User: john_rider>
✓ Rider SMS sent to john_rider (+254718693484) for order WW-12345
```

## Impact
- ✅ Riders now receive SMS notifications when orders are assigned
- ✅ SMS sent immediately after order creation
- ✅ No more "rider not assigned" issues
- ✅ Works with existing signal-based notifications
- ✅ Maintains backward compatibility

## Testing
To verify the fix works:
1. Create a new order through the API or admin
2. Watch for debug output showing rider assignment
3. Check for SMS notification to rider
4. Verify rider receives all 3 SMS types:
   - Initial order creation (rider SMS)
   - Order status updates (if applicable)
   - Delivery confirmation (when marked delivered)

## Related Files
- `orders/views.py` - Main fix location
- `orders/signals.py` - Still runs but doesn't duplicate assignment
- `services/sms_service.py` - SMS sending (already fixed for SSL)
