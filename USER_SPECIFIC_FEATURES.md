# User-Specific Casino Features - Implementation Guide

## Overview
Each user now has their own personal game history, statistics, and profile. This ensures that every user sees only their own data and maintains complete privacy.

## What's New

### 1. **Backend Changes (Django)**

#### New Model: `GameSpinResult`
Located in `wild-wash-api/casino/models.py`

Stores individual spin results for each user:
- `wallet` (ForeignKey): Links to user's GameWallet
- `game_type`: Type of game (Spin the Wheel, Crash Game, Pump)
- `spin_cost`: Amount wagered
- `result_label`: Result (e.g., "2x", "0.5x", "LOSE")
- `multiplier`: Multiplier value
- `winnings`: Total winnings for this spin
- `net_profit`: Winnings minus cost
- `is_win`: Boolean flag for win/loss
- `created_at`: Timestamp of the spin

**Indexes:**
- `(wallet, created_at)` - Fast user history queries
- `(wallet, game_type, created_at)` - Filter by game type
- `(is_win)` - Quick win/loss filtering

#### New Serializer: `GameSpinResultSerializer`
Located in `wild-wash-api/casino/serializers.py`

Exposes spin history data to the API with:
- User-friendly display values
- Read-only fields (auto-calculated)
- Clean API responses

#### Updated `GameWalletViewSet`

**New Endpoint: `/casino/wallet/spin_history/`** (GET)
- Returns user's spin history with statistics
- Query parameters:
  - `limit`: Number of results (default: 100)
  - `game_type`: Filter by game (optional)
  - `wins_only`: Show only wins (true/false)
- Response includes stats:
  - Total spins, wins, losses
  - Win rate percentage
  - Total wagered & won
  - Net profit/loss

**Updated Endpoint: `/casino/wallet/record_spin/`** (POST)
- Now creates GameSpinResult records
- Tracks every spin automatically
- No additional setup required

### 2. **Frontend Changes (React/Next.js)**

#### New Page: `/casino/history`
Located in `wildwash/app/casino/history/page.tsx`

Features:
- **User Authentication**: Only shows logged-in user's data
- **Comprehensive Statistics**:
  - Total spins
  - Win/loss ratio
  - Win rate percentage
  - Total wagered
  - Total won
  - Net profit/loss
- **History Table**:
  - Timestamp
  - Result
  - Multiplier
  - Bet amount
  - Winnings
  - Profit/loss
- **Filtering**:
  - All spins
  - Wins only
  - Losses only (for analysis)
- **Pagination**: Load more results dynamically

#### Updated Main Casino Page
Located in `wildwash/app/casino/page.tsx`

New sections added:
- **User Profile Card**:
  - Displays current user's balance
  - Account status
  - Responsible gaming status
- **Quick Link to History**:
  - One-click access to full spin history
  - Prominent placement on dashboard

#### Enhanced Navigation Bar
Located in `wildwash/components/GamesNavBar.tsx`

Improvements:
- **User Greeting**: Shows logged-in user's name
- **Balance Display**: Real-time game wallet balance
- **History Button**: Quick access to spin history
- **Responsive Design**: Optimized for all screen sizes

### 3. **Data Flow**

```
User Spins
    ↓
Frontend records spin locally
    ↓
sends to /casino/wallet/record_spin/
    ↓
Backend creates GameSpinResult record
    ↓
Updates GameWallet balance
    ↓
Creates GameTransaction record
    ↓
Frontend updates UI
    ↓
User views history at /casino/history
    ↓
API returns only THIS USER'S data
```

## Security & Privacy

### User Isolation
- All API endpoints require authentication (`TokenAuthentication`)
- Django's permission system ensures users see only their own data
- `GameSpinResult` queries are filtered by `wallet.user`
- No cross-user data leakage

### Data Protection
- Sensitive data (tokens, user IDs) never exposed in responses
- Historical data persists in database
- Only aggregated stats shown in UI
- Individual transaction logs for audit

## API Endpoints Reference

### Get User's Spin History
```
GET /api/casino/wallet/spin_history/
Authorization: Token <user_token>

Query Parameters:
- limit=100 (default)
- game_type=spin_the_wheel (optional)
- wins_only=true/false (optional)

Response:
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "game_type": "spin_the_wheel",
      "result_label": "2x",
      "multiplier": 2.0,
      "spin_cost": 20.0,
      "winnings": 40.0,
      "net_profit": 20.0,
      "is_win": true,
      "created_at": "2025-12-25T10:30:00Z"
    },
    ...
  ],
  "stats": {
    "total_spins": 100,
    "total_wins": 35,
    "total_losses": 65,
    "win_rate": 35.0,
    "total_wagered": 2000.0,
    "total_won": 3500.0,
    "net_profit": 1500.0
  }
}
```

### Record a Spin
```
POST /api/casino/wallet/record_spin/
Authorization: Token <user_token>
Content-Type: application/json

Request:
{
  "spin_cost": 20,
  "winnings": 40,
  "multiplier": 2,
  "result_label": "2x",
  "game_type": "spin_the_wheel"
}

Response:
{
  "balance": 1520.0,
  "spin_cost": 20.0,
  "winnings": 40.0,
  "net_result": 20.0,
  "message": "Spin recorded successfully. Net result: +20"
}
```

## Usage Examples

### View Personal History
1. User clicks "View History" button on casino page
2. Frontend loads `/casino/history`
3. Component calls `GET /api/casino/wallet/spin_history/`
4. Backend returns only this user's spins
5. Display with statistics and filters

### Filter Results
- Click "Wins Only" to see profitable spins
- Click "Losses Only" for analysis
- Click "All Spins" to see everything

### Check Statistics
- See overall win rate
- Calculate average bet
- Track net profit/loss over time
- Identify patterns in gameplay

## Database Schema

```sql
-- Game Wallet (existing)
CREATE TABLE casino_gamewallet (
    id BIGINT PRIMARY KEY,
    user_id INT UNIQUE,
    balance DECIMAL(12, 2),
    total_deposits DECIMAL(12, 2),
    total_winnings DECIMAL(12, 2),
    total_losses DECIMAL(12, 2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Game Spin Result (new)
CREATE TABLE casino_gamespinresult (
    id BIGINT PRIMARY KEY,
    wallet_id BIGINT,  -- FK to gamewallet
    game_type VARCHAR(20),
    spin_cost DECIMAL(10, 2),
    result_label VARCHAR(50),
    multiplier DECIMAL(5, 2),
    winnings DECIMAL(12, 2),
    net_profit DECIMAL(12, 2),
    is_win BOOLEAN,
    created_at TIMESTAMP,
    
    FOREIGN KEY (wallet_id) REFERENCES casino_gamewallet(id),
    INDEX (wallet_id, created_at),
    INDEX (wallet_id, game_type, created_at),
    INDEX (is_win)
);
```

## Running Migrations

```bash
cd wild-wash-api
python manage.py migrate
```

This will:
1. Create `casino_gamespinresult` table
2. Add indexes for performance
3. Update database schema

## Testing the Feature

### 1. Create a test user and token
```bash
python manage.py shell
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

user = User.objects.create_user(username='testuser', password='test123')
token = Token.objects.create(user=user)
print(token.key)
```

### 2. Test recording a spin
```bash
curl -X POST http://localhost:8000/api/casino/wallet/record_spin/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spin_cost": 20,
    "winnings": 100,
    "multiplier": 5,
    "result_label": "5x",
    "game_type": "spin_the_wheel"
  }'
```

### 3. Test retrieving history
```bash
curl -X GET 'http://localhost:8000/api/casino/wallet/spin_history/?limit=10' \
  -H "Authorization: Token YOUR_TOKEN"
```

## Performance Considerations

### Indexes
- `(wallet, created_at)`: Fast user history queries
- `(wallet, game_type, created_at)`: Game type filtering
- `(is_win)`: Win/loss analysis queries

### Pagination
- Default limit: 100 results
- Frontend loads more on demand
- Prevents large data transfers

### Caching (Optional Enhancement)
Consider adding Redis caching for:
- User statistics (invalidate on new spin)
- Recent spin history (TTL: 5-10 minutes)
- Win rate calculations

## Future Enhancements

1. **Leaderboards**: Compare win rates with other players (anonymized)
2. **Achievements**: Badge system for milestones
3. **Export History**: Download CSV/PDF of spin history
4. **Charts**: Visual trends of wins/losses
5. **Goal Setting**: Daily/weekly profit targets
6. **Notifications**: Alerts for big wins
7. **Referral Tracking**: Personal referral statistics

## Troubleshooting

### No history showing
- Ensure user is authenticated (check token)
- Verify spins were recorded via POST to record_spin
- Check database has spins for this user

### Stats incorrect
- Stats recalculate on each request
- May take a moment after spin is recorded
- Refresh page to see latest

### Permissions denied
- Verify user token is valid
- Check token is in Authorization header
- User must have active account

## Support & Questions

For issues with the personal history feature:
1. Check backend logs: `python manage.py logs`
2. Verify API endpoint is accessible
3. Test with curl/Postman first
4. Check browser console for frontend errors
5. Review migration status: `python manage.py showmigrations casino`
