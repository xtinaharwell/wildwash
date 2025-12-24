# Games Casino - Architecture & Flow Diagram

## Page Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  MAIN NAVBAR (NavBar.tsx)                              │
│  - Wild Wash Logo, Links, Auth                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  GAMES NAVBAR (GamesNavBar.tsx) - Only on /games pages │
│  ┌──────────────────┐  [Balance: KES 1,000] [+ Top Up] │
│  │ 🎰 Casino Games  │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PAGE CONTENT                                           │
│  - Games Hub:  Game cards and Responsible Gaming Info  │
│  - Spin Page:  Wheel, betting, results                 │
│  - Wallet:     Top-up form and payment                 │
└─────────────────────────────────────────────────────────┘
```

## User Navigation Flow

```
HOME (/index)
    ↓
MAIN NAVBAR - "Games" link
    ↓
/games (Games Hub Page)
├─ Shows available games
├─ Spin the Wheel (ACTIVE) ──→ Click "Play Now"
│                                   ↓
│                            /games/spin (Spin Page)
│                            - GamesNavBar displayed
│                            - Balance shown
│                            - [+ Top Up] button
│                                   ↓
└─ Games (COMING SOON)
   ├─ Crash Game
   └─ Pump the Coin


Top-Up Flow:
─────────────────────────
User clicks [+ Top Up] in GamesNavBar
    ↓
/games/wallet (Wallet Page)
    ↓
Select Amount or Enter Custom
    ↓
Verify Phone Number
    ↓
Click "Initiate M-Pesa Payment"
    ↓
API: POST /api/payments/mpesa/stk-push/
    ↓
M-Pesa STK Prompt on Phone
    ↓
User Enters M-Pesa PIN
    ↓
Payment Confirmed
    ↓
Balance Updated in game_wallet
    ↓
Return to Game (Auto-refresh)
```

## Component Architecture

```
App Structure:
├── components/
│   ├── NavBar.tsx (Main navigation)
│   ├── GamesNavBar.tsx ⭐ (NEW - Games specific nav)
│   ├── Footer.tsx
│   ├── WhatsAppButton.tsx
│   └── index.ts (exports all)
│
├── app/
│   ├── layout.tsx (Root layout)
│   ├── page.tsx (Home)
│   ├── games/ ⭐ (NEW/UPDATED)
│   │   ├── page.tsx (Games Hub - UPDATED)
│   │   ├── wallet/
│   │   │   └── page.tsx ⭐ (NEW - Wallet top-up)
│   │   ├── spin/
│   │   │   └── page.tsx (Spin game - UPDATED)
│   │   ├── crash/
│   │   │   └── page.tsx (Coming soon)
│   │   └── pump/
│   │       └── page.tsx (Coming soon)
│   └── [other pages]
│
├── redux/
│   ├── features/
│   │   ├── authSlice.ts (Auth state)
│   │   └── [other slices]
│   └── store.ts
│
└── lib/
    ├── auth.ts (Token management)
    └── [other utilities]
```

## Data Flow

```
LocalStorage Architecture:
────────────────────────

┌─────────────────────────────────────────────┐
│        localStorage (Browser)                │
├─────────────────────────────────────────────┤
│ game_wallet: "5000"                        │ ← Balance
│ game_history: "[{...}, {...}]"             │ ← Spins history
│ game_winnings: "500"                       │ ← Total wins
│ game_totalSpins: "42"                      │ ← Total spins
│ game_dailySpend: "2000"                    │ ← Today's spend
│ game_weeklySpend: "8000"                   │ ← This week's spend
│ game_lastPlayDate: "2024-12-24"            │ ← Last play date
│ wildwash_auth_state: "{token, user}"       │ ← Auth data
└─────────────────────────────────────────────┘
         ↑              ↓
    Read/Write      Updates
         ↑              ↓
    ┌────────────────────────┐
    │  React Components      │
    │ (GamesNavBar, Spin)    │
    └────────────────────────┘
         ↑              ↓
    Listen to          Trigger
    Storage Events     Updates
         ↑              ↓
    ┌────────────────────────┐
    │  Backend API Calls     │
    │ (STK Push, Webhooks)   │
    └────────────────────────┘
```

## M-Pesa Payment Integration

```
Payment Flow Sequence:
─────────────────────────

1. User Opens Wallet Page
   ├─ /games/wallet
   └─ Auto-loads phone number from auth

2. User Selects/Enters Amount
   ├─ Validates: 10 ≤ amount ≤ 1,000,000
   └─ Shows amount to be topped up

3. User Initiates Payment
   ├─ Clicks "Initiate M-Pesa Payment"
   └─ Loading state enabled

4. Frontend → Backend
   ┌─────────────────────────────────────────┐
   │ POST /api/payments/mpesa/stk-push/      │
   │ {                                        │
   │   "amount": 1000,                       │
   │   "phone": "254712345678",              │
   │   "order_id": null                      │
   │ }                                        │
   │ Headers: Authorization: Token {token}   │
   └─────────────────────────────────────────┘

5. Backend Processing
   ├─ Validates request
   ├─ Calls M-Pesa API
   └─ Returns STK prompt request

6. M-Pesa STK Prompt
   ├─ Phone receives prompt
   ├─ User enters PIN
   └─ M-Pesa processes payment

7. Backend Webhook (Future)
   ├─ Receives payment confirmation
   ├─ Updates user balance in DB
   └─ Returns confirmation

8. Frontend Updates
   ├─ Checks payment status
   ├─ Updates game_wallet in localStorage
   ├─ Shows success message
   └─ Balance updates in real-time

9. GamesNavBar Reflects Update
   ├─ Listens to localStorage changes
   ├─ Updates balance display
   └─ User can immediately play
```

## Game State Management

```
Spin the Wheel State:
──────────────────────

wallet (state)
  ├─ Initial: 0 (from localStorage)
  ├─ Updated: Balance changes
  └─ Persisted: localStorage.setItem('game_wallet')

isSpinning (state)
  ├─ Tracks if wheel is currently spinning
  ├─ Prevents multiple spins
  └─ Enables/disables buttons

rotation (state)
  ├─ Current wheel angle
  ├─ Updated during spin animation
  └─ Determines final result position

lastResult (state)
  ├─ Recent spin outcome
  ├─ Shows multiplier to user
  └─ Used for history

gameHistory (state)
  ├─ Array of all past spins
  ├─ Stored in localStorage
  └─ Shows game history

totalWinnings (state)
  ├─ Net profit/loss
  ├─ Calculated: winnings - costs
  └─ Persisted in localStorage

totalSpins (state)
  ├─ Number of times spun
  ├─ Determines loyalty tier
  └─ Used for statistics

dailySpend (state)
  ├─ Amount spent today
  ├─ Enforces daily limit (KES 5,000)
  └─ Resets at midnight

weeklySpend (state)
  ├─ Amount spent this week
  ├─ Enforces weekly limit (KES 20,000)
  └─ Resets weekly
```

## Responsive Design

```
Mobile (< 640px):
┌─────────────────────┐
│ [WW] Wild Wash      │ (Main NavBar, hamburger menu)
├─────────────────────┤
│ 🎰 Casino... [+]    │ (GamesNavBar, compact)
├─────────────────────┤
│                     │
│  Games Content      │
│   (Single column)   │
│                     │
└─────────────────────┘


Tablet (640px - 1024px):
┌──────────────────────────────────────┐
│ [WW] Wild Wash      Links            │ (Main NavBar)
├──────────────────────────────────────┤
│ 🎰 Casino Games    [KES 1,000] [+]  │ (GamesNavBar, expanded)
├──────────────────────────────────────┤
│                                      │
│  Games Content (2 columns)           │
│                                      │
└──────────────────────────────────────┘


Desktop (> 1024px):
┌──────────────────────────────────────────────────────┐
│ [WW] Logo   Home  Links  Offers  Games  Financing   │ (Main NavBar)
├──────────────────────────────────────────────────────┤
│ 🎰 Casino Games    [KES 1,000] [Top Up]            │ (GamesNavBar, full)
├──────────────────────────────────────────────────────┤
│                                                      │
│  Games Content (3 columns, responsive grid)         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Dark Mode Support

```
Light Mode:
┌─────────────────────────┐
│ White background        │
│ Dark text               │
│ Light gray accents      │
└─────────────────────────┘

Dark Mode:
┌─────────────────────────┐
│ #071025 (dark blue)     │
│ #041022 (darker blue)   │
│ White text              │
│ Purple accents          │
└─────────────────────────┘

Tailwind Classes Used:
- dark:bg-slate-950
- dark:text-white
- dark:border-slate-800
- dark:from-purple-900
- etc.
```

## Performance Optimization

```
Load Time Optimization:
───────────────────────

1. Code Splitting
   ├─ GamesNavBar: Reusable component
   ├─ Wallet: Separate page
   └─ Spin: Lazy loaded

2. State Management
   ├─ LocalStorage for persistence
   ├─ Minimal Redux usage
   └─ Efficient re-renders

3. Image Optimization
   ├─ Emoji for game icons (no images)
   └─ Reduced bundle size

4. Event Handling
   ├─ Debounced balance updates
   ├─ Memoized components
   └─ Optimized re-renders

5. Storage Events
   ├─ Cross-tab sync
   ├─ Real-time updates
   └─ No polling needed
```

## Security Architecture

```
Auth Flow:
──────────

User Login → Token Generated
    ↓
Token Stored in localStorage
    ├─ Key: wildwash_auth_state
    └─ Format: {user, token}
    ↓
API Requests Include Token
    ├─ Header: Authorization: Token {token}
    └─ Backend validates
    ↓
Protected Routes Checked
    ├─ AuthInitializer checks token
    ├─ RouteGuard blocks unauthorized
    └─ Components check isAuthenticated


M-Pesa Payment Security:
────────────────────────

1. Token Validation
   ├─ Verified by backend
   └─ Expires with session

2. Amount Validation
   ├─ Checked client-side (UX)
   ├─ Verified server-side (security)
   └─ Limits enforced

3. Phone Verification
   ├─ Format validated
   ├─ Matches M-Pesa requirements
   └─ Linked to user account

4. Transaction Logging
   ├─ All payments logged
   ├─ Audit trail maintained
   └─ Fraud detection enabled
```
