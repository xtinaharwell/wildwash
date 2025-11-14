# Rider Notification System with Sound

## Overview

This system notifies riders when new orders are created in their assigned jurisdiction. When an order is created, all active riders assigned to that location receive a notification with:

- Visual notification with order details
- Sound alert (generated tone)
- Browser notification (if enabled)
- Automatic marking as read after notification

## Implementation Details

### Backend Changes

#### 1. **Notification Model** (`notifications/models.py`)

Added support for different notification types:

- `order_update` - Status updates for orders
- `new_order` - New orders in rider's jurisdiction
- `order_assigned` - When rider is assigned an order

```python
notification_type = models.CharField(
    max_length=20,
    choices=NOTIFICATION_TYPES,
    default='order_update'
)
```

#### 2. **Order Signals** (`orders/signals.py`)

Updated to create rider notifications when orders are created:

```python
@receiver(post_save, sender=Order)
def order_status_update(sender, instance, created, **kwargs):
    # Notify customers about status changes
    # NEW: Notify riders in the order's service_location
    if created and instance.service_location:
        riders = User.objects.filter(
            role='rider',
            service_location=instance.service_location,
            is_active=True
        )
        for rider in riders:
            Notification.objects.create(
                user=rider,
                order=instance,
                message=f"New order {instance.code} in your area...",
                notification_type='new_order'
            )
```

#### 3. **Notification Serializer** (`notifications/serializers.py`)

Updated to include `notification_type` field in API responses.

### Frontend Changes

#### 1. **Notifications Utility** (`lib/notifications.ts`)

Provides utilities for:

- Playing notification sounds (with fallback to generated tone)
- Fetching unread new_order notifications
- Marking notifications as read

Key functions:

```typescript
playNotificationSound() - Plays sound alert
fetchRiderNotifications(token) - Gets unread new_order notifications
markNotificationAsRead(id, token) - Marks notification as read
```

#### 2. **Rider Notifications Hook** (`lib/hooks/useRiderNotifications.ts`)

A React hook that:

- Polls the API every 5 seconds for new notifications
- Plays sound when new order is detected
- Shows browser notification if available
- Automatically marks as read
- Prevents duplicate notifications

Usage:

```typescript
useRiderNotifications(token, enabled, pollInterval);
```

#### 3. **Rider Page Integration** (`app/rider/page.tsx`)

Added to rider dashboard to:

- Monitor for new orders automatically
- Play sound alerts in real-time
- Request browser notification permissions

```typescript
const token = authState.token || null;
useRiderNotifications(token, true, 5000);
```

## How It Works

### User Flow

1. **Order Created**: Customer creates order with service_location
2. **Signal Triggered**: Order post_save signal fires
3. **Riders Notified**: All active riders in that location get notification
4. **Sound Played**: When rider page is open, sound plays immediately
5. **Browser Notification**: Optional native notification appears
6. **Auto-Read**: Notification marked as read after alerting rider

### Rider Listening

1. Rider dashboard loads with active authentication
2. Notification hook starts polling API every 5 seconds
3. New order notifications detected by `notification_type='new_order'`
4. Sound plays (generated tone or file-based)
5. Browser notification shows order details
6. Notification auto-marked as read in backend

## Data Models

### Order Requirements

Orders must have:

- `service_location` - The Location where order is being processed
- `pickup_address` - Address shown in notification
- `code` - Order code (WW-XXXXX format)

Example:

```python
Order.objects.create(
    user=customer,
    service_location=location,  # Location object for riders
    pickup_address="123 Main St",
    code="WW-ABC123",
    ...
)
```

### User Requirements

Riders must have:

- `role='rider'`
- `service_location` - The Location they cover
- `is_active=True`

Example:

```python
rider = User.objects.create(
    username="rider1",
    phone="254712345678",
    role="rider",
    service_location=location,  # Same location as orders
    is_active=True
)
```

## API Endpoints

### Get Notifications

```
GET /notifications/
Authorization: Token {token}

Response:
[
  {
    "id": 1,
    "order": 10,
    "message": "New order WW-ABC123 in your area...",
    "notification_type": "new_order",
    "created_at": "2025-11-14T10:30:00Z",
    "is_read": false
  }
]
```

### Mark Notification as Read

```
POST /notifications/{id}/mark_read/
Authorization: Token {token}
```

## Sound Notification

The system uses a fallback approach:

1. **First Attempt**: Tries to play `/sounds/notification.mp3`
2. **Fallback**: If file not found or error, generates a tone using Web Audio API
3. **Web Audio Tone**: 800Hz frequency, 0.5 second duration with exponential fade

The generated tone works on all modern browsers and doesn't require external audio files.

## Configuration

### Poll Interval

Modify the poll interval in rider page:

```typescript
useRiderNotifications(token, true, 5000); // 5000ms = 5 seconds
```

### Sound Volume

Adjust in `lib/notifications.ts`:

```typescript
audio.volume = 0.5; // Change to 0.1 - 1.0
```

## Browser Notification Permission

The hook automatically requests browser notification permission. Users can:

- Allow: See native notifications
- Deny: Still get sound alerts and visual feedback
- Default: Permission requested on first load

## Testing

### Manual Test

1. Log in as rider in browser
2. Create an order with the rider's service_location
3. Wait for sound notification (should play within 5 seconds)
4. Check `/notifications/` API endpoint to verify notification created
5. Verify browser notification appears (if permission granted)

### API Test

```bash
# As rider user
curl -H "Authorization: Token YOUR_TOKEN" \
  http://127.0.0.1:8000/notifications/

# Create notification manually (as staff/admin)
curl -X POST http://127.0.0.1:8000/notifications/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": 5,
    "order": 10,
    "message": "Test notification",
    "notification_type": "new_order"
  }'
```

## Troubleshooting

### Sound Not Playing

1. Check browser console for errors
2. Verify browser audio is not muted
3. Check speaker/headphone connection
4. Try in a different browser
5. Verify `/sounds/notification.mp3` exists if using file-based

### No Notifications Appearing

1. Verify rider is assigned correct `service_location`
2. Verify rider `is_active=True`
3. Check rider `role='rider'`
4. Verify order has `service_location` set
5. Check API endpoint `/notifications/` returns data

### Browser Notifications Not Showing

1. Check notification permission in browser settings
2. Grant permission when prompted
3. Verify browser supports notifications
4. Check browser's notification settings

## Future Enhancements

- WebSocket support for real-time notifications (no polling)
- Multiple sound options
- Notification history/log
- Notification filtering by order type
- Rider location-based auto-assignment
- Distance-based order recommendations
