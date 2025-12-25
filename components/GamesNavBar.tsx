'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, Plus, Crown } from 'lucide-react';

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
    <div className="fixed top-16 left-0 right-0 z-40 w-full bg-gradient-to-r from-black via-slate-900 to-black border-b-2 border-amber-400/40 shadow-2xl shadow-amber-600/20 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Casino Badge / Title - VIP */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-2 shadow-lg shadow-amber-500/40">
              <Crown className="w-6 h-6 text-black" />
              <span className="text-black font-bold text-sm uppercase tracking-wider hidden sm:inline">VIP Casino</span>
            </div>
            <div className="hidden md:block h-8 w-1 bg-gradient-to-b from-amber-400 to-transparent rounded-full"></div>
            <h2 className="text-amber-400 font-serif text-lg hidden md:block" style={{ fontFamily: 'Georgia, serif' }}>
              Luxury Games
            </h2>
          </div>

          {/* Balance & Top-up Button */}
          <div className="flex items-center gap-4">
            {/* Balance Display - Luxury Card */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-xl px-5 py-3 border border-amber-400/40 shadow-lg shadow-amber-500/10 hover:border-amber-400/60 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
                  <Wallet className="w-5 h-5 text-black" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-300/70 uppercase tracking-wider font-semibold">Balance</p>
                  <p className="text-xl font-bold text-amber-400">
                    KES {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Top-up Button - Premium */}
            <Link
              href="/casino/wallet"
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold px-5 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/40 hover:shadow-amber-500/60 active:scale-95 uppercase tracking-wider text-sm"
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
