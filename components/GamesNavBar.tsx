'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Plus } from 'lucide-react';

interface GamesNavBarProps {
  balance: number;
}

export default function GamesNavBar({ balance }: GamesNavBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-900 dark:to-indigo-900 border-b border-purple-400/30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Casino Badge / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-purple-900">🎰</span>
            </div>
            <h2 className="text-white font-semibold hidden sm:block">Casino Games</h2>
          </div>

          {/* Balance & Top-up Button */}
          <div className="flex items-center gap-4">
            {/* Balance Display */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-yellow-300" />
                <div className="text-right">
                  <p className="text-xs text-white/70">Game Balance</p>
                  <p className="text-lg font-bold text-white">
                    KES {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Top-up Button */}
            <Link
              href="/games/wallet"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Top Up</span>
              <span className="sm:hidden">+</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
