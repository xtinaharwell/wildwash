# Games Casino - Quick Reference Guide

## URLs & Routes

```
/games                 → Games Hub (landing page)
/games/spin            → Spin the Wheel game
/games/crash           → Crash Game (coming soon)
/games/pump            → Pump the Coin (coming soon)
/games/wallet          → Wallet Top-Up Page
```

## Component Usage

### GamesNavBar
```tsx
import GamesNavBar from '@/components/GamesNavBar';

// In your game page
<GamesNavBar balance={currentBalance} />
```

**Props:**
- `balance: number` - Current game wallet balance

## LocalStorage Keys

```javascript
'game_wallet'        → Current game balance (number)
'game_history'       → Array of past spins (JSON)
'game_winnings'      → Total winnings (number)
'game_totalSpins'    → Total spin count (number)
'game_dailySpend'    → Daily spending amount (number)
'game_weeklySpend'   → Weekly spending amount (number)
'game_lastPlayDate'  → Last play date (ISO string)
'wildwash_auth_state' → Authentication data including token
```

## API Endpoints

### STK Push for M-Pesa
```
POST /api/payments/mpesa/stk-push/

Request:
{
  "amount": 1000,           // Amount in KES
  "phone": "254712345678",  // Phone number
  "order_id": null          // null for wallet top-up
}

Response:
{
  "status": "success",
  "message": "STK prompt sent"
}
```

## Game Rules

### Spin the Wheel
- **Cost:** KES 100 per spin
- **Multipliers:** 0.5x, 1x, 1.5x, 2x, 2.5x, 3x, 5x, LOSE
- **Daily Limit:** KES 5,000
- **Weekly Limit:** KES 20,000

**Probabilities:**
- 2x: 15%
- 0.5x: 25%
- 3x: 8%
- LOSE: 25%
- 1.5x: 17%
- 5x: 5%
- 1x: 3%
- 2.5x: 2%

**Loyalty Bonuses:**
- Bronze (0 spins): 0% bonus
- Silver (10+ spins): 2% bonus
- Gold (25+ spins): 5% bonus
- Platinum (50+ spins): 10% bonus

## Top-Up Quick Amounts

```
KES 500    → Basic option
KES 1,000  → Popular (default)
KES 2,000  → Mid-tier
KES 5,000  → Popular
KES 10,000 → High-roller
KES 20,000 → VIP option
Custom     → Any amount (min 10, max 1,000,000)
```

## Balance Management

### Check Current Balance
```javascript
const balance = localStorage.getItem('game_wallet');
const numBalance = balance ? parseFloat(balance) : 0;
```

### Update Balance
```javascript
const newBalance = currentBalance + amount;
localStorage.setItem('game_wallet', newBalance.toString());
```

### Listen for Balance Changes
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'game_wallet' && e.newValue) {
    setBalance(parseFloat(e.newValue));
  }
});
```

## Phone Number Formatting

The system auto-formats phone numbers to M-Pesa compatible format:

```
Input: 0712345678  → 254712345678
Input: +254712345678 → 254712345678
Input: 712345678 → 254712345678
Input: 254712345678 → 254712345678 (unchanged)
```

## Error Handling

### Common Errors & Solutions

```
"Insufficient funds"
→ User needs to top up balance
→ Redirect to /games/wallet

"Daily limit reached (KES 5,000)"
→ User has spent max daily amount
→ Come back tomorrow

"Weekly limit reached (KES 20,000)"
→ User has spent max weekly amount
→ Come back next week

"Invalid phone number"
→ Phone number format issue
→ Ensure format is 254XXXXXXXXX

"STK push failed"
→ Backend API issue
→ Check internet connection
→ Verify M-Pesa setup
```

## Development Tips

### Testing Balance Updates
```javascript
// Manually update balance
localStorage.setItem('game_wallet', '10000');

// Trigger storage event in other tabs
window.dispatchEvent(new StorageEvent('storage', {
  key: 'game_wallet',
  newValue: '10000'
}));
```

### Testing M-Pesa Integration
```javascript
// Mock successful response
const mockResponse = {
  status: 200,
  data: {
    message: "STK prompt sent successfully"
  }
};
```

### Debug Mode
```javascript
// Log all game actions
localStorage.setItem('debug_games', 'true');

// View game history
const history = JSON.parse(localStorage.getItem('game_history'));
console.log(history);

// View loyalty tier
const spins = localStorage.getItem('game_totalSpins');
console.log(`Total spins: ${spins}`);
```

## Performance Tips

1. **Balance Updates:**
   - Use localStorage for quick access
   - Sync with backend in background
   - Implement debouncing for frequent updates

2. **Game Rendering:**
   - Lazy load game components
   - Preload wheel images
   - Cache spin results

3. **Network Calls:**
   - Cache API responses
   - Use request deduplication
   - Implement retry logic for failed payments

## Security Notes

- Never expose token in client-side logs
- Always validate amounts on backend
- Verify phone numbers for M-Pesa compliance
- Implement rate limiting for API calls
- Use HTTPS for all transactions
- Hash sensitive data before storage

## Support & Troubleshooting

### GamesNavBar not appearing
- Check if component is imported
- Verify it's on a game page
- Check z-index conflicts with other elements

### Balance not updating
- Check localStorage key spelling
- Verify event listeners are attached
- Clear browser cache and reload

### M-Pesa not working
- Verify API endpoint is correct
- Check token format
- Confirm phone number format
- Check backend service status

### Games crashing
- Check console for errors
- Clear localStorage and reload
- Try incognito/private mode
- Update browser

## Code Examples

### Using GamesNavBar in a Game Component
```tsx
'use client';
import GamesNavBar from '@/components/GamesNavBar';
import { useState, useEffect } from 'react';

export default function MyGamePage() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('game_wallet');
    if (saved) setBalance(parseFloat(saved));
  }, []);

  return (
    <div className="pt-40"> {/* Account for NavBars */}
      <GamesNavBar balance={balance} />
      {/* Game content here */}
    </div>
  );
}
```

### Updating Balance After Win
```javascript
const winAmount = 500;
const newBalance = currentBalance + winAmount;
setBalance(newBalance);
localStorage.setItem('game_wallet', newBalance.toString());
```

### Triggering M-Pesa Payment
```javascript
async function initiateTopUp(amount, phone) {
  const response = await fetch('/api/payments/mpesa/stk-push/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify({
      amount,
      phone: phone.replace('+', ''),
      order_id: null
    })
  });
  return response.json();
}
```
