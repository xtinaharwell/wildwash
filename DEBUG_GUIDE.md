# SMS and Rider Assignment Debugging Guide

## Current Issues Being Debugged

### 1. SSL Error - WRONG_VERSION_NUMBER
**Status**: Enhanced SSL patching implemented

The SSL bypass has been improved to:
- Patch `urllib3.util.ssl_.create_urllib3_context()` function directly
- Create custom `NoVerifyHTTPAdapter` for requests.Session
- Patch both module-level and Session-level request methods
- Set environment variables to clear any certificate bundles

**What to look for in logs**:
```
[SMS] SSL verification disabled for sandbox environment
✓ SMS sent successfully
```

### 2. Rider Not Being Assigned
**Status**: Comprehensive debugging added

The auto-assignment logic now logs every step:

#### Debug Output Examples:

**Success Case:**
```
[DEBUG] Attempting to auto-assign rider for order WW-00194
[DEBUG] Order type: manual, Current rider: None
[DEBUG] Initial service_location: Nairobi
[DEBUG] Looking for riders in location: Nairobi
[DEBUG] Found 3 riders in Nairobi
[DEBUG]   - rider1 (completed_jobs: 5)
[DEBUG]   - rider2 (completed_jobs: 8)
[DEBUG]   - rider3 (completed_jobs: 12)
✓ Order WW-00194 auto-assigned to rider rider1
```

**Failure Case - No Location:**
```
[DEBUG] Attempting to auto-assign rider for order WW-00194
[DEBUG] Order type: manual, Current rider: None
[DEBUG] Initial service_location: None
[DEBUG] Trying to find location matching user location: nairobi
[DEBUG] Found location from user: Nairobi
[DEBUG] Looking for riders in location: Nairobi
[DEBUG] Found 0 riders in Nairobi
⚠ No active riders found in Nairobi
```

**Failure Case - No Location Found:**
```
[DEBUG] No location found, using first active location
[DEBUG] First active location: None
⚠ No service_location found, cannot assign rider
```

## What to Check

### 1. **Service Location Setup**
Make sure locations are created in the database:
```sql
SELECT id, name, is_active FROM users_location;
```

**Expected output:**
```
id | name     | is_active
---|----------|----------
1  | Nairobi  | true
2  | Mombasa  | true
```

### 2. **Rider Setup**
Check that riders exist and are linked to locations:
```sql
SELECT u.id, u.username, u.role, u.service_location_id, u.is_active
FROM auth_user u
WHERE u.role = 'rider' AND u.is_active = true;
```

**Expected output:**
```
id | username | role  | service_location_id | is_active
---|----------|-------|---------------------|----------
5  | rider1   | rider | 1                   | true
6  | rider2   | rider | 1                   | true
7  | rider3   | rider | 2                   | true
```

### 3. **RiderProfile Setup**
Riders must have a RiderProfile:
```sql
SELECT u.username, rp.completed_jobs, rp.phone
FROM auth_user u
LEFT JOIN riders_riderprofile rp ON u.id = rp.user_id
WHERE u.role = 'rider';
```

**Expected output:**
```
username | completed_jobs | phone
---------|----------------|------------------
rider1   | 5              | +254718693484
rider2   | 8              | +254718693485
```

### 4. **Order Creation Test**

**Test Case 1: Manual Order with Location**
```json
POST /orders/
{
  "order_type": "manual",
  "pickup_address": "Nairobi Downtown",
  "dropoff_address": "Karen",
  "services": [1],
  "items": "5 bags",
  "urgency": 3
}
```

**Expected Debug Output:**
```
[DEBUG] Order type: manual, Current rider: None
[DEBUG] Initial service_location: Nairobi
[DEBUG] Looking for riders in location: Nairobi
[DEBUG] Found X riders in Nairobi
✓ Order WW-XXXXX auto-assigned to rider riderX
✓ Rider SMS sent to riderX (+254...)
```

**Test Case 2: Online Order (not manual)**
```json
POST /orders/
{
  "order_type": "online",
  "pickup_address": "Westgate Mall",
  "services": [1]
}
```

**Expected Debug Output:**
```
[DEBUG] Order type: online, Current rider: None
[DEBUG] No rider auto-assignment for online orders
[DEBUG] Checking rider for SMS: None
[DEBUG] No rider assigned to order
```

## Troubleshooting Checklist

- [ ] Django server restarted after code changes?
- [ ] Service locations exist and are active?
- [ ] At least one rider exists with `is_active=true`?
- [ ] Rider has a service_location assigned?
- [ ] RiderProfile exists for the rider?
- [ ] SSL patches loading (check for `[SMS] SSL verification disabled` log)?
- [ ] Check order.order_type is 'manual' for auto-assignment?
- [ ] Verify rider has phone number for SMS?

## Key Variables to Monitor

1. **order.order_type**: Should be 'manual' for auto-assignment
2. **order.service_location**: Should be found or inferred
3. **service_location.is_active**: Must be True
4. **rider.is_active**: Must be True
5. **rider.role**: Must be 'rider'
6. **rider.service_location**: Must match order's location
7. **rider.phone**: Must exist for SMS

## Performance Note

The debug output is verbose intentionally. In production, you may want to reduce logging by:
- Removing `[DEBUG]` print statements
- Keeping only `[ERROR]` and `[SUCCESS]` messages
- Configuring Django logging appropriately

## SSL Debugging

If SSL errors persist, check:

1. **Environment variables are cleared:**
   ```
   echo %REQUESTS_CA_BUNDLE%  (should be empty)
   echo %CURL_CA_BUNDLE%      (should be empty)
   ```

2. **Patches are applied on import:**
   Look for message: `[SMS] SSL verification disabled for sandbox environment`

3. **Africa's Talking SDK is initialized:**
   Look for: `✓ Africa's Talking SMS Service initialized`

## Common Errors & Solutions

### "No riders found" 
- Check: Are riders in the same location as the order?
- Check: Is `rider.is_active = true`?
- Check: Does the rider have a service_location assigned?

### "No service_location found"
- Check: Are any locations marked `is_active = true`?
- Check: Does the order have a pickup_address?
- Check: Does the pickup_address contain a location name (case-insensitive)?

### SSL still failing
- Check: Has the server been restarted?
- Check: Is requests library version compatible?
- Check: Are there conflicting SSL/certificate tools?
- Try: `pip install --upgrade requests urllib3`

## Next Steps

1. Test with comprehensive debug output
2. Check database for proper setup (locations, riders, profiles)
3. Verify SSL is working with test SMS
4. Monitor logs for any exceptions during rider assignment
5. Adjust location matching logic if needed
