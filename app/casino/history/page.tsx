'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader, TrendingUp, Trophy, AlertCircle, Filter } from 'lucide-react';
import axios from 'axios';
import GamesNavBar from '@/components/GamesNavBar';

interface SpinResult {
  id: number;
  game_type: string;
  game_type_display: string;
  spin_cost: number;
  result_label: string;
  multiplier: number;
  winnings: number;
  net_profit: number;
  is_win: boolean;
  created_at: string;
}

interface SpinStats {
  total_spins: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  total_wagered: number;
  total_won: number;
  net_profit: number;
}

interface SpinHistoryResponse {
  count: number;
  results: SpinResult[];
  stats: SpinStats;
}

export default function HistoryPage() {
  const [spins, setSpins] = useState<SpinResult[]>([]);
  const [stats, setStats] = useState<SpinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [limit, setLimit] = useState(50);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.wildwash.app/api';

  const fetchSpinHistory = async () => {
    try {
      setLoading(true);
      const authState = localStorage.getItem('wildwash_auth_state');
      let token = null;
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          token = parsed.token;
        } catch (e) {
          // Token parsing failed
        }
      }

      const winsOnlyParam = filter === 'wins' ? '&wins_only=true' : '';
      const response = await axios.get<SpinHistoryResponse>(
        `${apiBase}/casino/wallet/spin_history/?limit=${limit}${winsOnlyParam}`,
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        }
      );

      if (response.data) {
        setSpins(response.data.results || []);
        setStats(response.data.stats || null);
      }
    } catch (err: any) {
      console.error('Error fetching spin history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const authState = localStorage.getItem('wildwash_auth_state');
      let token = null;
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          token = parsed.token;
        } catch (e) {
          // Token parsing failed
        }
      }

      const response = await axios.get(
        `${apiBase}/casino/wallet-balance/`,
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        }
      );

      if (response.data?.balance !== undefined) {
        setBalance(response.data.balance);
        localStorage.setItem('game_wallet', response.data.balance.toString());
      }
    } catch (err) {
      const savedBalance = localStorage.getItem('game_wallet');
      if (savedBalance) {
        setBalance(parseFloat(savedBalance));
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchBalance();
    fetchSpinHistory();
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSpinHistory();
    }
  }, [filter, limit]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black relative">
      {/* Luxury background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/2 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Games Navigation Bar */}
        <GamesNavBar balance={balance} />

        {/* Back Button */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <Link
            href="/casino"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Casino
          </Link>
        </div>

        {/* Main Content */}
        <div className="pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-amber-300 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Spin History
              </h1>
              <p className="text-amber-100/70">View your game history and detailed statistics</p>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Spins */}
                <div className="bg-gradient-to-br from-slate-900/60 via-amber-900/20 to-slate-950/60 border border-amber-400/30 rounded-xl p-6 backdrop-blur-md">
                  <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-2">Total Spins</p>
                  <p className="text-3xl font-bold text-amber-300">{stats.total_spins}</p>
                  <p className="text-amber-100/50 text-sm mt-2">All time</p>
                </div>

                {/* Win Rate */}
                <div className="bg-gradient-to-br from-slate-900/60 via-amber-900/20 to-slate-950/60 border border-amber-400/30 rounded-xl p-6 backdrop-blur-md">
                  <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-2">Win Rate</p>
                  <p className="text-3xl font-bold text-amber-300">{stats.win_rate.toFixed(1)}%</p>
                  <p className="text-amber-100/50 text-sm mt-2">{stats.total_wins} wins / {stats.total_losses} losses</p>
                </div>

                {/* Total Wagered */}
                <div className="bg-gradient-to-br from-slate-900/60 via-amber-900/20 to-slate-950/60 border border-amber-400/30 rounded-xl p-6 backdrop-blur-md">
                  <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-2">Total Wagered</p>
                  <p className="text-3xl font-bold text-amber-300">KES {stats.total_wagered.toLocaleString()}</p>
                  <p className="text-amber-100/50 text-sm mt-2">All spins combined</p>
                </div>

                {/* Net Profit */}
                <div className={`bg-gradient-to-br from-slate-900/60 via-amber-900/20 to-slate-950/60 border rounded-xl p-6 backdrop-blur-md ${
                  stats.net_profit >= 0 
                    ? 'border-green-400/30' 
                    : 'border-red-400/30'
                }`}>
                  <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-2">Net Profit</p>
                  <p className={`text-3xl font-bold ${stats.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.net_profit >= 0 ? '+' : ''} KES {stats.net_profit.toLocaleString()}
                  </p>
                  <p className="text-amber-100/50 text-sm mt-2">Your balance change</p>
                </div>
              </div>
            )}

            {/* Filter Controls */}
            <div className="bg-gradient-to-r from-slate-900/60 via-amber-900/20 to-slate-900/60 border border-amber-400/30 rounded-2xl p-6 backdrop-blur-md mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-semibold">Filter:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'wins', 'losses'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm uppercase tracking-wider ${
                        filter === f
                          ? 'bg-amber-500 text-black shadow-lg'
                          : 'bg-slate-700/50 text-amber-300 hover:bg-slate-600'
                      }`}
                    >
                      {f === 'all' ? 'All Spins' : f === 'wins' ? 'Wins Only' : 'Losses Only'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Spin History Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : spins.length === 0 ? (
              <div className="bg-gradient-to-r from-slate-900/60 via-amber-900/20 to-slate-900/60 border border-amber-400/30 rounded-2xl p-8 backdrop-blur-md text-center">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-50" />
                <p className="text-amber-100/70 text-lg">No spins yet. Start playing to build your history!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-400/20">
                      <th className="text-left py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Time</th>
                      <th className="text-left py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Result</th>
                      <th className="text-left py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Multiplier</th>
                      <th className="text-right py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Bet</th>
                      <th className="text-right py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Won</th>
                      <th className="text-right py-4 px-4 text-amber-400 font-semibold text-sm uppercase tracking-wider">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spins.map((spin, idx) => (
                      <tr
                        key={spin.id}
                        className={`border-b border-amber-400/10 hover:bg-amber-900/20 transition-colors ${
                          idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="text-amber-300 text-sm">
                            {new Date(spin.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-amber-100/50 text-xs">
                            {new Date(spin.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            spin.is_win ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {spin.is_win ? '✓' : '✗'} {spin.result_label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-amber-300 font-semibold">{spin.multiplier}x</td>
                        <td className="py-4 px-4 text-right text-amber-300">KES {spin.spin_cost.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right text-amber-300">KES {spin.winnings.toLocaleString()}</td>
                        <td className={`py-4 px-4 text-right font-semibold ${
                          spin.net_profit > 0 ? 'text-green-400' : spin.net_profit < 0 ? 'text-red-400' : 'text-amber-300'
                        }`}>
                          {spin.net_profit > 0 ? '+' : ''} KES {spin.net_profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More Button */}
            {spins.length > 0 && spins.length === limit && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setLimit(prev => prev + 50)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3 px-8 rounded-lg transition-all duration-200 uppercase tracking-wider shadow-lg hover:shadow-amber-500/50 active:scale-95"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
