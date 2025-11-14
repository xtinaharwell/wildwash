# Rider Notification Setup - Quick Start

## Backend Setup

### 1. Run Migrations

```bash
cd wild-wash-api
python manage.py makemigrations notifications
python manage.py migrate
```

This adds the `notification_type` field to the `Notification` model.

### 2. Verify Models are Configured

Make sure your `Order` model has:

- ✅ `service_location` - ForeignKey to Location
- ✅ `pickup_address` - TextField
- ✅ `code` - CharField (e.g., "WW-ABC123")

Make sure your `User` model has:

- ✅ `service_location` - ForeignKey to Location (for riders)
- ✅ `role` - CharField with value "rider"
- ✅ `is_active` - BooleanField

### 3. Test API Endpoint

```bash
# As a rider user, fetch notifications
curl -H "Authorization: Token YOUR_RIDER_TOKEN" \
  http://127.0.0.1:8000/notifications/
```

## Frontend Setup

No additional setup needed! The notification system is already integrated into the rider dashboard.

### Automatic Features

- ✅ Polls for new orders every 5 seconds when rider is on `/rider` page
- ✅ Plays sound notification when new order detected
- ✅ Shows browser notification (if enabled)
- ✅ Auto-marks notifications as read

## Testing the System

### Test Case 1: Create Order and Listen for Notification

1. Open two browsers/tabs:

   - Tab 1: Customer booking page (`/book`)
   - Tab 2: Rider dashboard (`/rider`)

2. In Tab 1, create order with:

   - Service: Any service
   - Pickup: Any address
   - **Important**: Order must have `service_location` matching rider's location

3. In Tab 2, you should:
   - 🔊 Hear a notification sound
   - 👁️ See browser notification (if enabled)
   - 📨 See order details in notification

### Test Case 2: Verify Database Notification

```bash
# In Django shell
python manage.py shell

from notifications.models import Notification
# Should see new notification with type='new_order'
print(Notification.objects.filter(notification_type='new_order').last())
```

### Test Case 3: Check API Response

```bash
# Browser console while logged in as rider
fetch('/api/notifications/', {
  headers: { 'Authorization': `Token ${TOKEN}` }
}).then(r => r.json()).then(data => console.log(data))
```

## Troubleshooting

### Issue: No Sound Playing

**Solution:**

- Check browser console for errors (F12 → Console)
- Ensure browser audio isn't muted
- Verify `/rider` page is open (notifications only poll when page active)
- Try another browser

### Issue: No Notifications in API

**Solution:**

- Verify order has `service_location` set
- Verify rider has `is_active=True`
- Verify rider `role='rider'`
- Verify rider's `service_location` matches order's `service_location`
- Check Django logs for signal errors

### Issue: Browser Notification Not Showing

**Solution:**

- Grant notification permission when prompted
- Check browser notification settings (⚙️ Settings → Notifications)
- Notifications work even if disabled (sound will still play)

## API Reference

### Notification Fields

```json
{
  "id": 1,
  "user": 5,
  "order": 10,
  "message": "New order WW-ABC123 in your area. Pickup: 123 Main St...",
  "notification_type": "new_order",
  "created_at": "2025-11-14T10:30:00Z",
  "is_read": false
}
```

### Get All Notifications

```
GET /notifications/
Headers: Authorization: Token {token}
```

### Mark as Read

```
POST /notifications/{id}/mark_read/
Headers: Authorization: Token {token}
```

## Configuration

### Change Poll Interval

Edit `app/rider/page.tsx`:

```typescript
// Change 5000 to your preferred milliseconds
useRiderNotifications(token, true, 5000);
```

### Change Sound Volume

Edit `lib/notifications.ts`:

```typescript
// Change 0.5 to 0.1 (quiet) or 1.0 (loud)
audio.volume = 0.5;
```

## What Happens Behind the Scenes

1. **Order Created** → Django signal fires
2. **Signal Handler** → Finds all riders with matching `service_location`
3. **Notifications Created** → Inserts rows with `type='new_order'`
4. **Rider Page Polls** → Every 5 seconds, checks for unread `new_order` notifications
5. **New Notification Found** → Plays sound, shows browser notification
6. **Auto Read** → Marks notification as read in API

## Files Modified/Created

### Backend

- ✏️ `notifications/models.py` - Added `notification_type` field
- ✏️ `notifications/serializers.py` - Added `notification_type` to response
- ✏️ `orders/signals.py` - Added rider notification logic

### Frontend

- ✨ `lib/notifications.ts` - Notification utilities and sound
- ✨ `lib/hooks/useRiderNotifications.ts` - React hook for polling
- ✏️ `app/rider/page.tsx` - Integrated notification hook
- ✨ `RIDER_NOTIFICATIONS.md` - Detailed documentation

## Next Steps

### Recommended: WebSocket Real-Time Notifications

Replace polling with WebSocket for instant notifications:

- Uses Django Channels + Redis
- No polling = instant notification
- Better performance on server

### Optional: Multiple Sound Options

Allow riders to choose notification sound:

- Bell
- Ding
- Alarm
- Custom sounds

### Optional: Notification History

Add full notification history view:

- All notifications (read/unread)
- Filter by type
- Search by order code
