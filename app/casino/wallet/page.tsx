'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Send, Loader, AlertCircle, CheckCircle, Crown, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import axios from 'axios';

interface TopUpOption {
  amount: number;
  label: string;
  popular?: boolean;
}

interface WalletBalance {
  balance: number;
  total_deposits?: number;
  total_winnings?: number;
  total_losses?: number;
}

interface PaymentStatusResponse {
  status: string;
  amount?: number;
  phone?: string;
  initiated_at?: string;
  completed_at?: string | null;
  error_message?: string | null;
}

const TOP_UP_OPTIONS: TopUpOption[] = [
  { amount: 500, label: '500' },
  { amount: 1000, label: '1,000', popular: true },
  { amount: 2000, label: '2,000' },
  { amount: 5000, label: '5,000', popular: true },
  { amount: 10000, label: '10,000' },
  { amount: 20000, label: '20,000' },
];

const WITHDRAWAL_MINIMUM = 500; // KES minimum to withdraw

export default function WalletPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [gameBalance, setGameBalance] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    setMounted(true);
    fetchGameBalance();
    
    // Set user phone if authenticated
    if (isAuthenticated && user?.phone) {
      // Format phone number (remove +254, add 254 if needed)
      let formattedPhone = user.phone.toString();
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + (formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone);
      }
      setPhone(formattedPhone);
    }
  }, [isAuthenticated, user]);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.wildwash.app/api';

  // Fetch game wallet balance from backend
  const fetchGameBalance = async () => {
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

      const response = await axios.get<WalletBalance>(
        `${apiBase}/casino/wallet-balance/`,
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        }
      );

      if (response.status === 200 && response.data?.balance !== undefined) {
        setGameBalance(response.data.balance);
        // Also update localStorage for fallback
        localStorage.setItem('game_wallet', response.data.balance.toString());
      }
    } catch (err) {
      // If API fails, try to get from localStorage
      const savedBalance = localStorage.getItem('game_wallet');
      if (savedBalance) {
        setGameBalance(parseFloat(savedBalance));
      }
    }
  };

  // Manual refresh function
  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await fetchGameBalance();
    setRefreshing(false);
  };

  // Poll for payment status
  const pollPaymentStatus = async (requestId: string, maxAttempts: number = 30) => {
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

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

        // Check payment status
        const response = await axios.get<PaymentStatusResponse>(
          `${apiBase}/payments/payment-status/?checkout_request_id=${requestId}`,
          {
            headers: {
              ...(token && { 'Authorization': `Token ${token}` }),
            },
          }
        );

        if (response.data?.status === 'success') {
          clearInterval(interval);
          
          // Refresh game balance
          await fetchGameBalance();
          
          setSuccess(
            `Payment successful! Your balance has been updated.`
          );
          setCheckoutRequestId('');
          
          // Reset form
          setCustomAmount('');
          setSelectedAmount(1000);
        } else if (response.data?.status === 'failed') {
          clearInterval(interval);
          setError(`Payment failed: ${response.data?.error_message || 'Unknown error'}`);
          setCheckoutRequestId('');
        }
      } catch (err) {
        // Continue polling on error
      }

      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError('Payment verification timeout. Please check your M-Pesa statement.');
        setCheckoutRequestId('');
      }
    }, 2000); // Poll every 2 seconds

    setPollingInterval(interval);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const getTopUpAmount = () => {
    return customAmount ? parseInt(customAmount) : selectedAmount;
  };

  const handleInitiateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!phone || phone.trim() === '') {
      setError('Please enter your phone number');
      return;
    }

    const amount = getTopUpAmount();
    if (!amount || amount < 10) {
      setError('Minimum top-up amount is KES 10');
      return;
    }

    if (amount > 1000000) {
      setError('Maximum top-up amount is KES 1,000,000');
      return;
    }

    setLoading(true);

    try {
      // Get auth token from localStorage
      let token = null;
      const authState = localStorage.getItem('wildwash_auth_state');
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          token = parsed.token;
        } catch (e) {
          // Token parsing failed
        }
      }

      // Clean phone number (remove + if present)
      let cleanPhone = phone.replace('+', '');

      const response = await axios.post(
        `${apiBase}/payments/mpesa/stk-push/`,
        {
          amount: amount,
          phone: cleanPhone,
          order_id: null, // Game wallet top-up, not for order
        },
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        const requestId = (response.data as { checkout_request_id?: string })?.checkout_request_id;
        setCheckoutRequestId(requestId || '');
        
        setSuccess(
          `STK push sent to ${phone}. Please check your phone to complete the payment of KES ${amount.toLocaleString()}. Your game balance will be updated automatically.`
        );
        
        // Start polling for payment status
        if (requestId) {
          pollPaymentStatus(requestId);
        }
      }
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.detail || 
        err.response?.data?.error ||
        'Failed to initiate STK push. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950 pb-8 sm:pb-12 relative overflow-hidden">

      <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Compact Header */}
        <div className="pt-6 sm:pt-10 mb-6 sm:mb-8">
          <Link
            href="/casino"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-amber-300 mt-3 sm:mt-4" style={{ fontFamily: 'Georgia, serif' }}>Add Funds</h1>
        </div>

        {/* Current Balance - Compact Card */}
        <div className="bg-gradient-to-br from-slate-900/60 via-amber-950/20 to-slate-950/60 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border border-amber-400/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none rounded-xl"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <p className="text-amber-200/70 text-xs sm:text-sm mb-1 sm:mb-2">Current Balance</p>
              <p className="text-3xl sm:text-4xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                KES {gameBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleRefreshBalance}
                disabled={refreshing}
                className="p-2 sm:p-3 rounded-full bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 transition-all flex-shrink-0"
                title="Refresh balance"
              >
                <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 flex-shrink-0">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-slate-950" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-950/40 border border-red-500/50 rounded-lg p-3 sm:p-4 flex gap-3 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 bg-green-950/40 border border-green-500/50 rounded-lg p-3 sm:p-4 flex gap-3 backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-200 text-xs sm:text-sm">{success}</p>
          </div>
        )}

        {/* Top-up Form */}
        <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-amber-400/30 backdrop-blur-sm">
          <form onSubmit={handleInitiateTopUp} className="space-y-4 sm:space-y-6">
            {/* Quick Amount Options */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-amber-300 mb-3 sm:mb-4">
                Select Amount
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {TOP_UP_OPTIONS.map((option) => (
                  <button
                    key={option.amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(option.amount);
                      setCustomAmount('');
                      setShowCustomInput(false);
                    }}
                    disabled={loading || checkoutRequestId !== ''}
                    className={`relative p-2 sm:p-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm ${
                      selectedAmount === option.amount && !customAmount
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/40 scale-105 font-bold'
                        : 'bg-slate-800/50 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 hover:bg-slate-800/70'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs sm:text-sm text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                {showCustomInput ? '× Custom' : '+ Custom'}
              </button>

              {showCustomInput && (
                <div className="mt-2 sm:mt-3">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(0);
                    }}
                    placeholder="Min 10, max 1M"
                    min="10"
                    max="1000000"
                    disabled={loading || checkoutRequestId !== ''}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-400/30 rounded-lg bg-slate-800/50 text-amber-300 placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/60 disabled:opacity-50 transition-all text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-amber-300 mb-1 sm:mb-2">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254712345678"
                disabled={loading || checkoutRequestId !== ''}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-amber-400/30 rounded-lg bg-slate-800/50 text-amber-300 placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/60 disabled:opacity-50 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-950/40 rounded-lg p-3 sm:p-5 border border-amber-400/40 backdrop-blur-sm">
              <p className="text-xs sm:text-sm text-amber-200/60 mb-1 sm:mb-2">Total Amount</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                KES {getTopUpAmount().toLocaleString()}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || checkoutRequestId !== ''}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 text-xs sm:text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Processing...
                </>
              ) : checkoutRequestId ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  Send Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 rounded-xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-amber-400/30 backdrop-blur-sm">
          <h2 className="text-base sm:text-lg font-bold text-amber-300 mb-3 sm:mb-5" style={{ fontFamily: 'Georgia, serif' }}>Withdraw Winnings</h2>
          
          {gameBalance < WITHDRAWAL_MINIMUM ? (
            <div className="bg-amber-950/50 border border-amber-500/50 rounded-lg p-3 sm:p-5 backdrop-blur-sm text-xs sm:text-sm">
              <p className="text-amber-200/80">
                Minimum KES {WITHDRAWAL_MINIMUM.toLocaleString()} required to withdraw. Current balance: KES {gameBalance.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-br from-green-950/40 to-slate-950/40 rounded-lg p-3 sm:p-5 border border-green-500/40 backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-green-300/70 mb-1 sm:mb-2">Available to Withdraw</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400" style={{ fontFamily: 'Georgia, serif' }}>
                  KES {gameBalance.toLocaleString()}
                </p>
              </div>
              <button
                disabled
                className="w-full bg-slate-700/50 text-amber-200/50 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg cursor-not-allowed opacity-60 text-xs sm:text-sm border border-slate-600/50"
                title="Coming soon"
              >
                Withdraw (Coming Soon)
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-amber-400/30 rounded-lg p-4 sm:p-8 backdrop-blur-sm">
          <h3 className="font-semibold text-amber-300 mb-3 sm:mb-4 text-base sm:text-lg" style={{ fontFamily: 'Georgia, serif' }}>
            How It Works
          </h3>
          <ol className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-amber-200/80 list-decimal list-inside">
            <li>Pick an amount or enter a custom amount</li>
            <li>Enter your M-Pesa phone number</li>
            <li>Click "Send Payment"</li>
            <li>Confirm the STK prompt on your phone</li>
            <li>Your balance updates automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
