'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Loader } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
      {/* Games Navigation Bar */}
      <GamesNavBar balance={balance} />

      {/* Main Content */}
      <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gamepad2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Casino Games
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Play exciting casino games, win big, and test your luck with real multipliers and payouts
            </p>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {GAMES.map((game) => (
              <div
                key={game.id}
                className={`relative group rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                  game.status === 'active'
                    ? 'bg-white dark:bg-slate-900 hover:shadow-2xl hover:-translate-y-2 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-900/50 opacity-75'
                }`}
              >
                {/* Status Badge */}
                {game.status === 'coming-soon' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">Coming Soon</p>
                      <p className="text-white/80 text-sm">Available soon</p>
                    </div>
                  </div>
                )}

                {game.status === 'active' && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    LIVE
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Icon */}
                  <div className="text-5xl mb-4">{game.icon}</div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{game.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3">
                    {game.description}
                  </p>

                  {/* Game Stats */}
                  {game.minBet && game.maxWin && (
                    <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Min Bet</p>
                        <p className="font-semibold text-slate-900 dark:text-white">KES {game.minBet}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Max Win</p>
                        <p className="font-semibold text-slate-900 dark:text-white">KES {game.maxWin?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Play Button */}
                  {game.status === 'active' ? (
                    <Link
                      href={game.href}
                      className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 text-center active:scale-95"
                    >
                      Play Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold py-3 px-4 rounded-lg cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Responsible Gaming Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-4">Play Responsibly</h2>
            <ul className="space-y-3 text-blue-800 dark:text-blue-300">
              <li className="flex gap-3">
                <span className="font-bold">•</span>
                <span>Set a budget before you play and stick to it</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">•</span>
                <span>Never chase losses - take breaks when needed</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">•</span>
                <span>Games of chance carry no guarantees of winning</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">•</span>
                <span>The house always has an edge - play for entertainment</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
