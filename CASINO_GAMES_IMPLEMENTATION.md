# Casino Games Implementation - Complete Setup

## Overview
A casino-style online games section has been implemented with:
- **Spin the Wheel** game with M-Pesa wallet integration
- Games-specific navigation bar (casino-themed)
- Wallet management page with M-Pesa STK push integration
- Backend API for handling wallet transactions and payments

---

## Frontend Components

### 1. Games Layout (`/app/games/layout.tsx`)
**Location:** `wildwash/app/games/layout.tsx`

**Features:**
- Casino-themed sticky navigation bar
- Displays wallet balance prominently
- "Add Funds" button links to wallet page
- Decorative gradient borders (yellow/gold theme)
- Responsive design for mobile and desktop

**Navigation Bar Elements:**
- 🎰 Casino branding with glow effect
- Home & Games navigation links
- Real-time wallet balance display
- Add Funds CTA button

---

### 2. Wallet Page (`/app/games/wallet/page.tsx`)
**Location:** `wildwash/app/games/wallet/page.tsx`

**Features:**
- M-Pesa payment method selector
- Phone number input (auto-formatted to 254XXXXXXXXX)
- Amount input with validation (1 - 150,000 KES)
- Quick select buttons (100, 500, 1000, 5000 KES)
- Real-time status feedback (pending/success/error)
- Transaction info section
- Auto-reload wallet balance after successful payment

**Payment Flow:**
1. User enters phone number
2. User enters amount
3. User clicks "Send M-Pesa Prompt"
4. API calls `/api/mpesa/stk-push/` endpoint
5. M-Pesa prompt appears on user's phone
6. User enters M-Pesa PIN
7. Wallet is credited (via callback)

---

### 3. Games Hub Page (Enhanced)
**Location:** `wildwash/app/games/page.tsx`

**Current Games:**
- **Spin** - Spin the wheel of fortune (fully implemented)
- Pump & Crash (placeholders ready)

---

### 4. Spin Game Page (Styling Enhanced)
**Location:** `wildwash/app/games/spin/page.tsx`

**Enhancements Made:**
- Multi-layer glow effects on wheel during spin
- Animated wheel with smooth easing
- Enhanced pointer with glow animations
- Improved spin button with gradients and animations
- Better wallet display with status indicator
- Loyalty tier system with visual progress
- Game odds display with probability bars
- Game history with color-coded results
- Spending limits enforcement (Daily 5000 KES)
- Quick add funds buttons
- Custom styled scrollbar (yellow-red gradient)

---

## Backend API

### Games App Structure
**Location:** `wild-wash-api/games/`

#### Models

**GameWallet**
- Tracks user's game wallet balance
- Records: balance, total_topped_up, total_winnings, total_spent
- One-to-one relationship with User

**GameWalletTransaction**
- Records all wallet activities
- Types: topup, spin, winnings
- Stores: amount, description, payment_reference, balance_before/after
- Indexed by user and transaction_type for fast queries

#### Views

**GamesSTKPushView** (`/games/mpesa/stk-push/`)
- Extends existing MpesaSTKPushView for games-specific logic
- Validates phone number and amount
- Initiates M-Pesa STK push
- Creates Payment record in database
- Returns CheckoutRequestID for tracking

**GameWalletViewSet** (DRF ViewSet)
- `/games/wallet/balance/` - Get wallet balance
- `/games/wallet/add_balance/` - Add funds after payment
- `/games/wallet/transactions/` - Get transaction history

#### Serializers
- GameWalletSerializer - Wallet with recent transactions
- GameWalletTransactionSerializer - Transaction details

---

## API Endpoints

### Next.js API Route
**POST `/api/mpesa/stk-push`**
```json
{
  "phoneNumber": "254712345678",
  "amount": 1000
}
```

Response:
```json
{
  "success": true,
  "message": "STK push sent to your phone",
  "requestId": "ws1234567890"
}
```

### Django Backend Endpoints

**POST `/games/mpesa/stk-push/`**
- Requires: phone_number, amount
- Optional: reason
- Returns: success status, request_id

**GET `/games/wallet/balance/`**
- Returns: wallet balance, totals, recent transactions
- Requires: Authentication token

**POST `/games/wallet/add_balance/`**
- Adds funds to wallet (called after payment)
- Requires: amount, payment_reference

**GET `/games/wallet/transactions/`**
- Returns: last 100 transactions
- Requires: Authentication token

---

## Data Flow

### Top-up Flow
```
User → Wallet Page
       ↓
   [Enter Phone & Amount]
       ↓
   [Send STK Push Button]
       ↓
   Next.js API Route (/api/mpesa/stk-push)
       ↓
   Django Backend (/games/mpesa/stk-push/)
       ↓
   M-Pesa Daraja API (STK Push)
       ↓
   [User receives prompt on phone]
       ↓
   [User enters M-Pesa PIN]
       ↓
   M-Pesa Callback → Django
       ↓
   GameWallet.add_balance()
       ↓
   [Wallet Updated] ← LocalStorage synced
```

### Spin Flow
```
Games Spin Page (Client-side)
   ↓
[Click Spin Button]
   ↓
Deduct cost from wallet (localStorage)
   ↓
Animate wheel
   ↓
Calculate result
   ↓
Display winnings
   ↓
Add to wallet (localStorage + backend)
```

---

## Key Features

### 🎰 Casino Aesthetics
- Gradient backgrounds (purple/slate theme)
- Yellow/gold accents (M-Pesa brand)
- Smooth animations and transitions
- Glow effects and shadows
- Professional card-based layouts

### 💳 Wallet Management
- Real-time balance display
- Transaction history
- Spending limits enforcement
- Quick top-up buttons
- M-Pesa integration

### 🎮 Game Mechanics
- Wheel with 8 segments (multipliers 0.5x to 5x)
- Loyalty tiers (Bronze→Platinum)
- Game history tracking
- Probability display
- Daily/Weekly spending limits

### 🔐 Security
- Phone number validation
- Amount range validation
- M-Pesa credentials encrypted in .env
- Token authentication for wallet endpoints
- Payment tracking with references

---

## Environment Variables Required

In `.env` file add:
```
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/games/mpesa/callback/
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Installation & Migration

### Backend
```bash
cd wild-wash-api
python manage.py makemigrations games
python manage.py migrate games
python manage.py createsuperuser  # For admin
```

### Frontend
```bash
cd wildwash
npm install  # If needed
npm run dev  # Start dev server
```

---

## Testing

### Manual Testing Checklist
- [ ] Navigate to `/games` page
- [ ] See games hub with Spin game
- [ ] Click "Add Funds" in casino navbar
- [ ] Enter phone number and amount
- [ ] Click "Send M-Pesa Prompt"
- [ ] Verify STK push initiated successfully
- [ ] Check wallet balance updates
- [ ] Play Spin game with updated balance
- [ ] Verify spending limits work
- [ ] Check game history records transactions

---

## Next Steps

1. **Create Pump Game**
   - Pump-up mechanics (click to increase multiplier)
   - Crash point randomization
   - Similar M-Pesa integration

2. **Create Crash Game**
   - Real-time multiplier tracking
   - Automatic crash detection
   - Cashout before crash mechanic

3. **Add More Payment Methods**
   - Airtel Money integration
   - Direct bank transfer
   - Credit/Debit card

4. **Leaderboards & Tournaments**
   - Daily/Weekly leaderboards
   - Tournament mode
   - Prize pools

5. **Analytics Dashboard**
   - User spending patterns
   - Game popularity
   - Revenue tracking

---

## Files Created/Modified

### Frontend
- ✅ `/app/games/layout.tsx` - NEW
- ✅ `/app/games/wallet/page.tsx` - NEW
- ✅ `/app/games/page.tsx` - ENHANCED
- ✅ `/app/games/spin/page.tsx` - ENHANCED
- ✅ `/app/api/mpesa/stk-push/route.ts` - NEW

### Backend
- ✅ `/games/` - NEW APP
- ✅ `/games/models.py` - NEW
- ✅ `/games/views.py` - NEW
- ✅ `/games/serializers.py` - NEW
- ✅ `/games/urls.py` - NEW
- ✅ `/games/admin.py` - NEW
- ✅ `/api/settings.py` - MODIFIED (added 'games' to INSTALLED_APPS)
- ✅ `/api/urls.py` - MODIFIED (added games routes)

---

## Support & Troubleshooting

### Common Issues

**"M-Pesa credentials not configured"**
- Check `.env` file has MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
- Credentials should be from Safaricom Daraja sandbox/production

**"Invalid phone number format"**
- Use format: 254712345678 (12 digits)
- Or: 0712345678 (10 digits starting with 0)
- Remove any special characters or spaces

**STK Push not appearing**
- Check internet connectivity
- Ensure M-Pesa account is active
- Verify amount is between 1 - 150,000 KES

**Wallet not updating after payment**
- Verify callback URL is configured correctly
- Check Django logs for payment callbacks
- Ensure Payment model is updated with success status

---

## Contact & Support
For issues or features requests, contact the development team.
