'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Loader, Lock, Eye, EyeOff } from 'lucide-react';
import GamesNavBar from '@/components/GamesNavBar';

interface GameCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  status: 'active' | 'coming-soon';
  minBet?: number;
  maxWin?: number;
}

const CASINO_PASSWORD = 'WildWash2024'; // Change this to your desired password

const GAMES: GameCard[] = [
  {
    id: 'spin-the-wheel',
    name: 'Spin the Wheel',
    description: 'Spin to win! Multipliers range from 0.5x to 5x. Test your luck with daily limits and loyalty bonuses.',
    icon: '🎡',
    href: '/casino/spin',
    status: 'active',
    minBet: 20,
    maxWin: 50000,
  },
  {
    id: 'crash-game',
    name: 'Crash Game',
    description: 'Watch the multiplier climb! Cash out before it crashes to multiply your bet.',
    icon: '📈',
    href: '/casino/crash',
    status: 'coming-soon',
  },
  {
    id: 'pump-game',
    name: 'Pump the Coin',
    description: 'Keep pumping to increase your multiplier, but too many pumps might deflate your winnings.',
    icon: '💨',
    href: '/casino/pump',
    status: 'coming-soon',
  },
];

export default function GamesPage() {
  const [balance, setBalance] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setMounted(true);
    // Check if already unlocked
    const unlocked = localStorage.getItem('casino_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }

    // Load balance from localStorage
    const savedBalance = localStorage.getItem('game_wallet');
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }

    // Listen for storage changes (when other tabs/windows update the balance)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'game_wallet' && e.newValue) {
        setBalance(parseFloat(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password === CASINO_PASSWORD) {
      setIsUnlocked(true);
      localStorage.setItem('casino_unlocked', 'true');
      setPassword('');
    } else {
      setPasswordError('Invalid password. Access denied.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    localStorage.removeItem('casino_unlocked');
    setPassword('');
    setPasswordError('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Password gate UI
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-amber-950 to-black flex items-center justify-center px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-md w-full">
          {/* Luxury Card */}
          <div className="bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-950 border-2 border-amber-400/50 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-amber-400" />
                <h1 className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
                  EXCLUSIVE
                </h1>
              </div>
              <p className="text-amber-200/80 text-sm tracking-widest">VIP CASINO ACCESS</p>
              <div className="mt-4 h-1 w-12 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full"></div>
            </div>

            {/* Description */}
            <p className="text-center text-amber-100/70 text-sm mb-8 leading-relaxed">
              Welcome to an exclusive gaming experience reserved for VIP members only. Enter your access code to continue.
            </p>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs text-amber-300 uppercase tracking-widest mb-2 font-semibold">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your VIP access code"
                    className="w-full bg-slate-900/50 border border-amber-400/30 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-700/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 text-red-300 text-sm text-center">
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 px-4 rounded-lg transition-all duration-200 uppercase tracking-wider text-sm shadow-lg hover:shadow-amber-500/50 active:scale-95"
              >
                Unlock Access
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-amber-400/20">
              <p className="text-center text-amber-200/50 text-xs">
                Reserved for VIP Members
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main casino UI (after password unlock)
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Luxury background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/2 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Unlock button in top right */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm shadow-lg"
          >
            Exit VIP
          </button>
        </div>

        {/* Games Navigation Bar */}
        <GamesNavBar balance={balance} />

        {/* Main Content */}
        <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl w-full mx-auto">

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {GAMES.map((game) => (
                <div
                  key={game.id}
                  className={`relative group rounded-xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
                    game.status === 'active'
                      ? 'bg-gradient-to-br from-slate-900/60 via-amber-900/20 to-slate-950/60 border border-amber-400/30 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 cursor-pointer'
                      : 'bg-slate-900/30 border border-slate-700/30 opacity-60'
                  }`}
                >
                  {/* Luxury Border Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Status Badge */}
                  {game.status === 'coming-soon' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="text-center">
                        <p className="text-amber-200 font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>Coming Soon</p>
                        <p className="text-amber-300/60 text-sm">VIP Access</p>
                      </div>
                    </div>
                  )}

                  {game.status === 'active' && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide shadow-lg">
                      ★ LIVE
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-8">
                    {/* Icon */}
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">{game.icon}</div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-amber-300 mb-3" style={{ fontFamily: 'Georgia, serif' }}>{game.name}</h3>
                    <p className="text-amber-100/70 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {game.description}
                    </p>

                    {/* Game Stats */}
                    {game.minBet && game.maxWin && (
                      <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-amber-400/20">
                        <div>
                          <p className="text-xs text-amber-400/60 uppercase tracking-wider">Min Bet</p>
                          <p className="font-semibold text-amber-300 text-lg">KES {game.minBet}</p>
                        </div>
                        <div>
                          <p className="text-xs text-amber-400/60 uppercase tracking-wider">Max Win</p>
                          <p className="font-semibold text-amber-300 text-lg">KES {game.maxWin?.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    {/* Play Button */}
                    {game.status === 'active' ? (
                      <Link
                        href={game.href}
                        className="block w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:via-amber-500 hover:to-amber-400 text-black font-bold py-4 px-4 rounded-lg transition-all duration-200 text-center uppercase tracking-wider text-sm shadow-lg hover:shadow-amber-500/50 active:scale-95"
                      >
                        Play Now
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-700/50 text-slate-400 font-bold py-4 px-4 rounded-lg cursor-not-allowed uppercase tracking-wider text-sm"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Responsible Gaming Section - Luxury Theme */}
            <div className="bg-gradient-to-r from-slate-900/60 via-amber-900/20 to-slate-900/60 border border-amber-400/30 rounded-2xl p-8 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-amber-300 mb-6" style={{ fontFamily: 'Georgia, serif' }}>Play Responsibly</h2>
              <ul className="space-y-3 text-amber-100/80">
                <li className="flex gap-3">
                  <span className="text-amber-400 font-bold">★</span>
                  <span>Set a budget before you play and stick to it</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-400 font-bold">★</span>
                  <span>Never chase losses - take breaks when needed</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-400 font-bold">★</span>
                  <span>Games of chance carry no guarantees of winning</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-amber-400 font-bold">★</span>
                  <span>The house always has an edge - play for entertainment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
