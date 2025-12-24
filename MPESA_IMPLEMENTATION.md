# M-Pesa STK Push Checkout Implementation

This document outlines the complete M-Pesa STK Push integration for the Wildwash platform, enabling customers to pay for orders using M-Pesa.

## Architecture Overview

```
Frontend (Next.js)
    ↓
Checkout Page (collect payment details)
    ↓
Backend API (Django)
    ↓
Daraja API (Safaricom M-Pesa)
    ↓
STK Push to Customer's Phone
    ↓
Payment Callback (Payment status update)
    ↓
Database (Payment record)
```

## Components

### Backend (Django REST API)

#### 1. **MpesaSTKPushView** (`payments/views.py`)
- **Endpoint:** `POST /api/payments/mpesa/stk-push/`
- **Authentication:** Token-based (user must be authenticated)
- **Request Parameters:**
  - `amount` (required): Payment amount in KES
  - `phone` (required): M-Pesa phone number (format: 254712345678 or 0712345678)
  - `order_id` (required): Order identifier
  
- **Response:**
  ```json
  {
    "status": "success",
    "message": "STK push sent to your phone",
    "checkout_request_id": "ws_CO_123456789",
    "order_id": "ORD-2025-001",
    "amount": "500"
  }
  ```

#### 2. **MpesaCallbackView** (`payments/views.py`)
- **Endpoint:** `POST /api/payments/mpesa/callback/`
- **Purpose:** Receives callback from Daraja API after user completes/cancels transaction
- **Updates:** Payment status in database based on result code

#### 3. **Payment Model** (`payments/models.py`)
- Stores payment records with the following fields:
  - `user`: Foreign key to User
  - `order_id`: Associated order
  - `amount`: Payment amount
  - `phone_number`: M-Pesa phone used
  - `status`: Payment status (pending, initiated, success, failed)
  - `checkout_request_id`: Reference from Daraja API
  - `provider_reference`: M-Pesa transaction ID
  - `created_at`, `updated_at`: Timestamps

### Frontend (Next.js)

#### 1. **Checkout Page** (`app/checkout/page.tsx`)
- User-friendly form to collect:
  - Order ID
  - Amount (KES)
  - M-Pesa Phone Number
  - Customer details (optional)
  
- **Features:**
  - Real-time form validation
  - Phone number format validation
  - Error handling with user-friendly messages
  - Loading state during API call
  - Automatic redirect after successful STK push

#### 2. **Payment Status Page** (`app/orders/[id]/payment-status/page.tsx`)
- Real-time payment status tracking
- Polls backend every 5 seconds for updates
- Shows success, failure, or pending states
- Provides retry options
- Auto-stops polling after 60 seconds

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# Next.js
NEXT_PUBLIC_API_URL=https://api.wildwash.co.ke
```

### Settings Configuration

Update `api/settings.py`:

```python
# M-Pesa Configuration
MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY', '')
MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET', '')
MPESA_BUSINESS_SHORTCODE = os.getenv('MPESA_BUSINESS_SHORTCODE', '')
MPESA_PASSKEY = os.getenv('MPESA_PASSKEY', '')
MPESA_CALLBACK_URL = os.getenv('MPESA_CALLBACK_URL', 'https://api.wildwash.co.ke/api/payments/mpesa/callback/')
```

## API Endpoints

### STK Push Request
```
POST /api/payments/mpesa/stk-push/
Content-Type: application/json
Authorization: Token <user_token>

{
  "amount": "500",
  "phone": "254712345678",
  "order_id": "ORD-2025-001"
}
```

### M-Pesa Callback
```
POST /api/payments/mpesa/callback/
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "...",
      "CheckoutRequestID": "ws_CO_123456789",
      "ResultCode": 0,
      "ResultDesc": "The service request has been accepted successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 500},
          {"Name": "MpesaReceiptNumber", "Value": "LHG31H500"},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

## Flow Diagram

### User Payment Flow

1. **User initiates checkout**
   - Navigates to `/checkout`
   - Fills in order details and M-Pesa phone

2. **Frontend sends STK Push request**
   - `POST /api/payments/mpesa/stk-push/`
   - Backend validates inputs
   - Gets access token from Daraja API
   - Sends STK Push request

3. **STK Push displayed on phone**
   - User enters M-Pesa PIN
   - M-Pesa processes transaction

4. **Daraja sends callback**
   - Backend receives callback
   - Updates Payment status
   - Frontend polls and detects change

5. **Payment confirmation**
   - User sees success/failure message
   - Can proceed with order or retry

## Testing

### Using Postman

1. **Get Authentication Token**
   ```
   POST /api/users/login/
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```

2. **Test STK Push Endpoint**
   ```
   POST /api/payments/mpesa/stk-push/
   Headers: Authorization: Token <token>
   Body: {
     "amount": "100",
     "phone": "254712345678",
     "order_id": "TEST-001"
   }
   ```

### Sandbox Testing Credentials

For development, use Safaricom's sandbox environment:
- **Consumer Key**: (from Daraja portal)
- **Consumer Secret**: (from Daraja portal)
- **Business Shortcode**: 174379 (test code)
- **Passkey**: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

## Error Handling

The implementation includes comprehensive error handling:

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid phone number | Wrong format | Use 254712345678 or 0712345678 |
| Failed to get access token | Invalid credentials | Check MPESA_CONSUMER_KEY/SECRET |
| STK push failed | Network/API issue | Retry after few seconds |
| Callback timeout | User didn't respond | Payment marked as timeout |

### Response Codes

- **200**: STK Push sent successfully
- **400**: Invalid request parameters
- **401**: Unauthorized (no valid token)
- **500**: Server error (Daraja API issue)

## Security Considerations

1. **Token Authentication**: All endpoints require valid user tokens
2. **CSRF Protection**: Enabled in Django settings
3. **SSL/TLS**: Use HTTPS in production
4. **Sensitive Data**: M-Pesa credentials stored in environment variables only
5. **Phone Number Validation**: Validates Kenyan phone numbers
6. **Amount Validation**: Ensures positive amounts

## Database Migrations

After adding the Payment model, run:

```bash
python manage.py makemigrations
python manage.py migrate
```

## URL Configuration

The URLs are already configured in `payments/urls.py`:

```python
urlpatterns = [
    path('mpesa/stk-push/', MpesaSTKPushView.as_view(), name='mpesa_stk_push'),
    path('mpesa/callback/', MpesaCallbackView.as_view(), name='mpesa_callback'),
    path('', include(router.urls)),
]
```

## Frontend Integration

### Accessing Checkout

```typescript
// Navigate to checkout
router.push('/checkout');

// With order details
router.push(`/checkout?order_id=ORD-2025-001&amount=500`);
```

### Checking Payment Status

```typescript
// Check payment status
router.push(`/orders/ORD-2025-001/payment-status`);
```

## Monitoring and Debugging

### Enable Logging

Add to `settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'payments': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Monitor Payments

```python
from payments.models import Payment

# View all payments
Payment.objects.all()

# View pending payments
Payment.objects.filter(status='pending')

# View successful payments
Payment.objects.filter(status='success')
```

## Future Enhancements

1. **Payment Retry Logic**: Automatic retry for failed transactions
2. **Multi-currency Support**: Support for other currencies
3. **Payment History**: User dashboard with payment history
4. **Webhook Security**: Add HMAC signature verification for callbacks
5. **Scheduled Reconciliation**: Daily reconciliation with Daraja API
6. **SMS Notifications**: Send SMS updates to user
7. **Email Receipts**: Send payment receipts via email

## Support

For issues or questions:
1. Check logs in `debug.log`
2. Review Daraja API documentation
3. Contact Safaricom support for M-Pesa issues

## References

- [Daraja API Documentation](https://daraja.safaricom.co.ke/docs)
- [M-Pesa STK Push Guide](https://daraja.safaricom.co.ke/docs#lipa-na-m-pesa-online)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
