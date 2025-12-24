'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Zap, RotateCw, Plus, Minus, Trophy, TrendingUp, Heart, AlertCircle, Clock } from 'lucide-react';

interface WheelSegment {
  id: number;
  label: string;
  multiplier: number;
  color: string;
  probability: number;
}

interface LoyaltyTier {
  name: string;
  minSpins: number;
  bonus: number; // percentage bonus to winnings
  color: string;
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 1, label: '2x', multiplier: 2, color: '#FF6B6B', probability: 0.15 },
  { id: 2, label: '0.5x', multiplier: 0.5, color: '#4ECDC4', probability: 0.25 },
  { id: 3, label: '3x', multiplier: 3, color: '#45B7D1', probability: 0.08 },
  { id: 4, label: 'LOSE', multiplier: 0, color: '#95A5A6', probability: 0.25 },
  { id: 5, label: '1.5x', multiplier: 1.5, color: '#F7DC6F', probability: 0.17 },
  { id: 6, label: '5x', multiplier: 5, color: '#BB8FCE', probability: 0.05 },
  { id: 7, label: '1x', multiplier: 1, color: '#85C1E2', probability: 0.03 },
  { id: 8, label: '2.5x', multiplier: 2.5, color: '#F8B88B', probability: 0.02 },
];

const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze', minSpins: 0, bonus: 0, color: '#CD7F32' },
  { name: 'Silver', minSpins: 10, bonus: 2, color: '#C0C0C0' },
  { name: 'Gold', minSpins: 25, bonus: 5, color: '#FFD700' },
  { name: 'Platinum', minSpins: 50, bonus: 10, color: '#E5E4E2' },
];

const SPIN_COST = 100; // KES
const DAILY_LIMIT = 5000; // KES max spend per day
const WEEKLY_LIMIT = 20000; // KES max spend per week

export default function GamesPage() {
  const [wallet, setWallet] = useState<number>(0);
  const [addFundsAmount, setAddFundsAmount] = useState<string>('');
  const [spinCost, setSpinCost] = useState<number>(SPIN_COST);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [lastResult, setLastResult] = useState<WheelSegment | null>(null);
  const [gameHistory, setGameHistory] = useState<Array<{
    spin: number;
    result: WheelSegment;
    winnings: number;
    timestamp: Date;
  }>>([]);
  const [totalWinnings, setTotalWinnings] = useState<number>(0);
  const [showAddFunds, setShowAddFunds] = useState<boolean>(false);
  // Refs for wheel scroll/flick handling
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const scrollAccumRef = useRef<number>(0);
  const wheelTimeoutRef = useRef<number | null>(null);
  
  // New ethical features
  const [totalSpins, setTotalSpins] = useState<number>(0);
  const [dailySpend, setDailySpend] = useState<number>(0);
  const [weeklySpend, setWeeklySpend] = useState<number>(0);
  const [lastPlayDate, setLastPlayDate] = useState<Date | null>(null);
  const [userSatisfaction, setUserSatisfaction] = useState<number>(100); // 0-100 score
  const [showResponsibleGaming, setShowResponsibleGaming] = useState<boolean>(false);

  // Load wallet from localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem('game_wallet');
    const savedHistory = localStorage.getItem('game_history');
    const savedWinnings = localStorage.getItem('game_winnings');
    const savedTotalSpins = localStorage.getItem('game_totalSpins');
    const savedDailySpend = localStorage.getItem('game_dailySpend');
    const savedWeeklySpend = localStorage.getItem('game_weeklySpend');
    const savedLastPlayDate = localStorage.getItem('game_lastPlayDate');

    if (savedWallet) setWallet(parseFloat(savedWallet));
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setGameHistory(history);
      setTotalSpins(history.length);
    }
    if (savedWinnings) setTotalWinnings(parseFloat(savedWinnings));
    if (savedTotalSpins) setTotalSpins(parseInt(savedTotalSpins));
    if (savedDailySpend) setDailySpend(parseFloat(savedDailySpend));
    if (savedWeeklySpend) setWeeklySpend(parseFloat(savedWeeklySpend));
    if (savedLastPlayDate) setLastPlayDate(new Date(savedLastPlayDate));
  }, []);

  // Save wallet to localStorage
  useEffect(() => {
    localStorage.setItem('game_wallet', wallet.toString());
  }, [wallet]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('game_history', JSON.stringify(gameHistory));
  }, [gameHistory]);

  // Save winnings to localStorage
  useEffect(() => {
    localStorage.setItem('game_winnings', totalWinnings.toString());
  }, [totalWinnings]);

  // Calculate loyalty tier
  const getLoyaltyTier = () => {
    let tier = LOYALTY_TIERS[0];
    for (const t of LOYALTY_TIERS) {
      if (totalSpins >= t.minSpins) {
        tier = t;
      }
    }
    return tier;
  };

  // Check responsible gaming limits
  const checkSpendingLimits = (): { canPlay: boolean; reason?: string } => {
    const today = new Date();
    const isNewDay = !lastPlayDate || lastPlayDate.toDateString() !== today.toDateString();
    
    // Reset daily limit if new day
    if (isNewDay && lastPlayDate) {
      setDailySpend(0);
    }

    if (dailySpend + spinCost > DAILY_LIMIT) {
      return {
        canPlay: false,
        reason: `Daily limit reached (KES ${DAILY_LIMIT}). Come back tomorrow!`
      };
    }

    if (weeklySpend + spinCost > WEEKLY_LIMIT) {
      return {
        canPlay: false,
        reason: `Weekly limit reached (KES ${WEEKLY_LIMIT}). Enjoy a break and come back next week!`
      };
    }

    return { canPlay: true };
  };

  const handleAddFunds = () => {
    const amount = parseFloat(addFundsAmount);
    if (amount > 0) {
      setWallet(prev => prev + amount);
      setAddFundsAmount('');
      setShowAddFunds(false);
    }
  };

  const getRandomSegment = (): WheelSegment => {
    const random = Math.random();
    let probability = 0;

    for (const segment of WHEEL_SEGMENTS) {
      probability += segment.probability;
      if (random <= probability) {
        return segment;
      }
    }

    return WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1];
  };

  const handleSpin = () => {
    // Check spending limits first
    const limitCheck = checkSpendingLimits();
    if (!limitCheck.canPlay) {
      alert(limitCheck.reason);
      return;
    }

    if (wallet < spinCost) {
      alert(`Insufficient funds. You need KES ${spinCost} to spin.`);
      return;
    }

    setIsSpinning(true);
    setWallet(prev => prev - spinCost);
    setDailySpend(prev => prev + spinCost);
    setWeeklySpend(prev => prev + spinCost);
    setLastPlayDate(new Date());

    // Get result immediately and calculate final rotation
    const result = getRandomSegment();
    const segmentIndex = WHEEL_SEGMENTS.indexOf(result);
    const segmentDegrees = (segmentIndex / WHEEL_SEGMENTS.length) * 360;
    
    // Calculate how much to spin to land on this segment (multiple full rotations + final position)
    const randomSpins = Math.random() * 3 + 5; // 5-8 full rotations
    const finalRotation = rotation + randomSpins * 360 + (360 - segmentDegrees);
    
    // Animate wheel with smooth easing
    let currentRotation = rotation;
    const startTime = Date.now();
    const duration = 3000; // 3 second spin
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function - start fast, end slow
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const newRotation = rotation + (finalRotation - rotation) * easeOut;
      setRotation(newRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin complete - apply loyalty bonus
        const tier = getLoyaltyTier();
        const loyaltyMultiplier = 1 + (tier.bonus / 100);
        
        let winnings = spinCost * result.multiplier;
        if (result.multiplier > 0) {
          winnings = winnings * loyaltyMultiplier; // Apply bonus only on wins
        }
        
        const netWinnings = winnings - spinCost;

        setLastResult(result);
        setWallet(prev => prev + winnings);
        setTotalWinnings(prev => prev + netWinnings);
        setTotalSpins(prev => prev + 1);
        
        // Update user satisfaction based on performance
        const winRate = Math.random() < (1 - 0.25 - 0.25) ? 1 : 0; // Approximate win rate
        setUserSatisfaction(prev => Math.max(0, prev + (result.multiplier > 1 ? 5 : -3)));
        
        setGameHistory(prev => [
          {
            spin: prev.length + 1,
            result,
            winnings,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setIsSpinning(false);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const canSpin = wallet >= spinCost && !isSpinning;

  // Cleanup any pending wheel timeout on unmount
  useEffect(() => {
    return () => {
      if (wheelTimeoutRef.current) {
        window.clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle mouse wheel interactions on the wheel: small scrolls rotate visually,
  // a quick flick (large accumulated delta) triggers a real spin (consumes spin cost)
  const handleWheel = (e: React.WheelEvent) => {
    if (isSpinning) return;
    // prevent page scroll while interacting directly with the wheel
    e.preventDefault();

    const delta = e.deltaY;
    // Immediate visual rotation for feedback
    setRotation(prev => prev + delta * 0.7);

    // Accumulate deltas to detect flicks
    scrollAccumRef.current += delta;

    if (wheelTimeoutRef.current) {
      window.clearTimeout(wheelTimeoutRef.current);
    }

    // If user stops scrolling for 120ms, evaluate accumulated delta
    wheelTimeoutRef.current = window.setTimeout(() => {
      const acc = scrollAccumRef.current;
      scrollAccumRef.current = 0;
      wheelTimeoutRef.current = null;

      const FLICK_THRESHOLD = 150; // adjust sensitivity
      if (Math.abs(acc) > FLICK_THRESHOLD) {
        // Try to trigger an actual spin (same checks as clicking the button)
        const limitCheck = checkSpendingLimits();
        if (!limitCheck.canPlay) {
          alert(limitCheck.reason);
          return;
        }

        if (wallet < spinCost) {
          alert(`Insufficient funds. You need KES ${spinCost} to spin.`);
          return;
        }

        handleSpin();
      }
    }, 120);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-slate-950 to-black text-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Wallet Navigation Bar */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 to-slate-950/95 backdrop-blur-md border-b border-slate-700 rounded-b-2xl py-4 px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-semibold text-slate-300">Wallet Balance</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">
            KES {wallet.toLocaleString('en-KE', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddFunds(!showAddFunds)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Funds
            </button>
          </div>
        </div>

        {/* Add Funds Form - Below Wallet Nav */}
        {showAddFunds && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">Add Funds to Wallet</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Amount (KES)</label>
                <input
                  type="number"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddFunds}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowAddFunds(false)}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header - Removed text for cleaner look */}
        <div className="text-center mb-12 py-8">
          {/* Just spacer, no text */}
        </div>

        {/* Main Spin Section */}
        <div className="flex flex-col items-center justify-center mb-16">
          <style>{`
            @keyframes wheelSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes glow {
              0%, 100% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.5), 0 0 40px rgba(239, 68, 68, 0.3); }
              50% { box-shadow: 0 0 40px rgba(250, 204, 21, 0.8), 0 0 60px rgba(239, 68, 68, 0.5); }
            }
            @keyframes pulse-scale {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            .wheel-spinning {
              animation: wheelSpin 0.1s linear infinite !important;
            }
            .wheel-glow {
              animation: glow 0.6s ease-in-out infinite;
            }
            .pulse-button {
              animation: pulse-scale 0.6s ease-in-out infinite;
            }
          `}</style>
          <div className={`relative w-96 h-96 mb-8 ${isSpinning ? 'wheel-glow' : ''}`}>
            {/* Outer ring glow effect */}
            {isSpinning && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 opacity-20 blur-xl animate-pulse"></div>
            )}
            
            {/* Wheel */}
            <div
              ref={wheelRef}
              onWheel={handleWheel}
              className={`w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl flex items-center justify-center transition-transform ${
                isSpinning ? 'wheel-spinning' : ''
              }`}
              style={{
                cursor: 'grab',
                transform: !isSpinning ? `rotate(${rotation}deg)` : undefined,
                transitionDuration: isSpinning ? '0s' : '0s',
                background: `conic-gradient(from 0deg, ${WHEEL_SEGMENTS.map((seg, i) => {
                  const start = (i / WHEEL_SEGMENTS.length) * 360;
                  const end = ((i + 1) / WHEEL_SEGMENTS.length) * 360;
                  return seg.color + ' ' + start + 'deg ' + end + 'deg';
                }).join(', ')})`,
              }}
            >
              {/* Center hub - enhanced */}
              <div className="w-20 h-20 bg-gradient-to-br from-black via-slate-900 to-black rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                  <Zap className="w-8 h-8 text-black animate-pulse" />
                </div>
              </div>
            </div>

            {/* Enhanced Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 z-10">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg filter" style={{
                filter: isSpinning ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))' : 'none'
              }}></div>
            </div>

            {/* Wheel Labels */}
            <div className="absolute inset-0 flex items-center justify-center">
              {WHEEL_SEGMENTS.map((segment, index) => {
                const angle = (index / WHEEL_SEGMENTS.length) * 360 + 360 / (WHEEL_SEGMENTS.length * 2);
                const radian = (angle * Math.PI) / 180;
                const radius = 140;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;

                return (
                  <div
                    key={segment.id}
                    className="absolute font-bold text-sm text-white drop-shadow-lg"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    {segment.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spin Button - Enhanced */}
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className={`px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 transition-all transform active:scale-95 ${
              canSpin
                ? `bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 text-black hover:shadow-2xl ${
                    isSpinning ? 'pulse-button' : 'hover:scale-110'
                  }`
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCw className={`w-7 h-7 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </button>
        </div>

        {/* Bottom Section - Stats and History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
          {/* Left Panel - Stats & Loyalty */}
          <div className="lg:col-span-1 space-y-6">
            {/* Loyalty Tier */}
            {(() => {
              const tier = getLoyaltyTier();
              return (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5" style={{ color: tier.color }} />
                    <h3 className="text-lg font-bold">Loyalty Program</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold mb-2" style={{ color: tier.color }}>
                      {tier.name}
                    </p>
                    <p className="text-slate-400 text-sm mb-3">
                      {totalSpins} spins • {tier.bonus}% bonus on wins
                    </p>
                    <div className="w-full bg-slate-700/30 rounded-full h-2 mb-3">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((totalSpins / LOYALTY_TIERS[LOYALTY_TIERS.length - 1].minSpins) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {totalSpins < LOYALTY_TIERS[LOYALTY_TIERS.length - 1].minSpins
                        ? `${LOYALTY_TIERS[LOYALTY_TIERS.length - 1].minSpins - totalSpins} spins to Platinum`
                        : 'Max tier reached!'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Quick Add Buttons */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-sm font-medium text-slate-300 mb-3">Quick Add</p>
              <div className="grid grid-cols-2 gap-2">
                {[500, 1000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setWallet(prev => prev + amount)}
                    className="bg-slate-700/50 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Spending Limits Info */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <h4 className="font-semibold text-blue-300">Daily Limit</h4>
              </div>
              <div className="space-y-2 text-sm text-blue-200">
                <p>Today: KES {dailySpend.toLocaleString()} / {DAILY_LIMIT.toLocaleString()}</p>
                <div className="w-full bg-blue-900/50 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(dailySpend / DAILY_LIMIT) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-lg font-bold">Statistics</h3>
              <div>
                <p className="text-slate-400 text-sm">Total Spins</p>
                <p className="text-3xl font-bold text-yellow-400">{totalSpins}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Net Winnings</p>
                <p className={`text-3xl font-bold ${totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  KES {totalWinnings.toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">ROI</p>
                <p className="text-2xl font-bold text-slate-300">
                  {((totalWinnings / (totalSpins * spinCost)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Results & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Last Result */}
            {lastResult && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/50 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold mb-4">Last Result</h3>
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-2xl text-white border-4"
                  style={{ backgroundColor: lastResult.color, borderColor: lastResult.color }}
                >
                  {lastResult.label}
                </div>
                <div className="text-center">
                  <p className="text-slate-300 text-sm mb-1">You won</p>
                  <p className="text-3xl font-bold text-green-400">
                    KES {(spinCost * lastResult.multiplier).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Net: {lastResult.multiplier > 1 ? '+' : ''} KES {((spinCost * lastResult.multiplier) - spinCost).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}

            {/* Game Odds - Transparent Probabilities */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Game Odds
              </h3>
              <div className="space-y-3 text-sm">
                {WHEEL_SEGMENTS.sort((a, b) => b.probability - a.probability).map(segment => (
                  <div key={segment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      ></div>
                      <span>{segment.label}</span>
                    </div>
                    <span className="font-semibold text-slate-300">
                      {(segment.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                ℹ️ Odds are transparent and fair. Each spin is independent.
              </p>
            </div>

            {/* Game History */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold mb-4">Recent Spins</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameHistory.slice(0, 10).map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: entry.result.color }}
                      >
                        {entry.result.label}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Spin #{entry.spin}</p>
                        <p className="text-xs text-slate-400">
                          {entry.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${entry.winnings - spinCost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.winnings - spinCost >= 0 ? '+' : ''} KES {(entry.winnings - spinCost).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ))}
                {gameHistory.length === 0 && (
                  <p className="text-center text-slate-400 py-4">No spins yet. Start spinning!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center text-slate-400 text-sm py-8">
          <p>⚠️ Remember: This is for entertainment only. Gamble responsibly.</p>
        </div>
      </div>
    </div>
  );
}
