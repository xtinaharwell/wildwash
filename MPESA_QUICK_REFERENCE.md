# M-Pesa Checkout Quick Reference

## Quick Setup (5 minutes)

### 1. Environment Variables
Add to `.env`:
```bash
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/
NEXT_PUBLIC_API_URL=https://api.wildwash.co.ke
```

### 2. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Files Added
- ✅ `wild-wash-api/payments/views.py` - Backend logic
- ✅ `wild-wash-api/payments/urls.py` - API endpoints
- ✅ `wild-wash-api/api/settings.py` - Configuration
- ✅ `wildwash/app/checkout/page.tsx` - Checkout page
- ✅ `wildwash/app/orders/[id]/payment-status/page.tsx` - Status tracking

## API Usage

### Initiate Payment
```bash
curl -X POST http://localhost:8000/api/payments/mpesa/stk-push/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "500",
    "phone": "254712345678",
    "order_id": "ORD-2025-001"
  }'
```

### Response
```json
{
  "status": "success",
  "message": "STK push sent to your phone",
  "checkout_request_id": "ws_CO_123456789",
  "order_id": "ORD-2025-001",
  "amount": "500"
}
```

## Frontend URLs

| Page | URL | Purpose |
|------|-----|---------|
| Checkout | `/checkout` | Collect payment details |
| Status | `/orders/[id]/payment-status` | Track payment status |

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Backend endpoints accessible
- [ ] Frontend pages load
- [ ] Phone validation working
- [ ] API call successful
- [ ] Payment record created
- [ ] Callback handling works

## Phone Number Format

✅ Valid:
- `254712345678` (with country code)
- `0712345678` (with leading zero)

❌ Invalid:
- `712345678` (missing prefix)
- `+254712345678` (with plus sign)
- `0712 345 678` (with spaces)

## Status Codes

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending` | Waiting for user input | Wait for STK push response |
| `initiated` | STK push sent | User enters PIN |
| `success` | Payment complete | Show confirmation |
| `failed` | Payment failed | Offer retry |

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Invalid phone number" | Use format: 254712345678 or 0712345678 |
| "Failed to get access token" | Check MPESA_CONSUMER_KEY/SECRET |
| "STK push failed" | Network issue - retry after few seconds |
| "Payment not updating" | Check callback URL is publicly accessible |
| "Token not found" | User must be authenticated |

## Code Examples

### Get Payment Status
```python
from payments.models import Payment

payment = Payment.objects.get(order_id='ORD-2025-001')
print(f"Status: {payment.status}")
print(f"Amount: {payment.amount}")
```

### List Successful Payments
```python
payments = Payment.objects.filter(status='success').order_by('-created_at')
for payment in payments:
    print(f"{payment.order_id}: {payment.amount} KES")
```

### Check M-Pesa Configuration
```bash
python manage.py shell
from django.conf import settings
print(settings.MPESA_BUSINESS_SHORTCODE)
print(settings.MPESA_CALLBACK_URL)
```

## Performance Tips

1. **Cache Access Tokens**: Implement token caching to reduce API calls
2. **Async Processing**: Use Celery for background callback processing
3. **Database Indexing**: Add indexes on order_id and checkout_request_id
4. **Rate Limiting**: Implement rate limiting on STK push endpoint

## Monitoring

### Check All Payments
```bash
python manage.py dbshell
SELECT COUNT(*), status FROM payments_payment GROUP BY status;
```

### Recent Transactions
```bash
python manage.py shell
from payments.models import Payment
Payment.objects.all().order_by('-created_at')[:10]
```

## Troubleshooting

### Debug Mode
```python
# In settings.py
DEBUG = True
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'DEBUG'},
}
```

### Test STK Push Directly
```python
from payments.views import MpesaSTKPushView
view = MpesaSTKPushView()
token = view._get_access_token()
print(f"Token obtained: {token}")
```

## Next Steps

1. ✅ Implementation complete
2. → Test with sandbox credentials
3. → Deploy to staging
4. → Test with real M-Pesa account
5. → Deploy to production

## Support Resources

- 📚 [Daraja Documentation](https://daraja.safaricom.co.ke/docs)
- 📖 [Django REST Framework](https://www.django-rest-framework.org/)
- 🚀 [Next.js Guide](https://nextjs.org/docs)
- 💬 [Community Forum](https://community.safaricom.co.ke)

---

**Last Updated**: December 12, 2025
**Status**: ✅ Implementation Complete
