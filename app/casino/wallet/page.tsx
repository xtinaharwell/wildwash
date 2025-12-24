'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Send, Loader, AlertCircle, CheckCircle, Crown } from 'lucide-react';
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

      if (response.status === 200 && response.data?.balance) {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-950 pb-12 relative overflow-hidden">

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Compact Header */}
        <div className="pt-6 mb-4">
          <Link
            href="/casino"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-2xl font-bold text-amber-300 mt-2" style={{ fontFamily: 'Georgia, serif' }}>Add Funds</h1>
        </div>

        {/* Current Balance - Compact Card */}
        <div className="bg-gradient-to-br from-slate-900/60 via-amber-950/20 to-slate-950/60 rounded-xl p-4 mb-4 shadow-lg border border-amber-400/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none rounded-xl"></div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-amber-200/70 text-xs mb-1">Balance</p>
              <p className="text-3xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                KES {gameBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 flex-shrink-0">
              <Wallet className="w-6 h-6 text-slate-950" />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-500/50 rounded-lg p-3 flex gap-2 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-950/40 border border-green-500/50 rounded-lg p-3 flex gap-2 backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-200 text-xs">{success}</p>
          </div>
        )}

        {/* Top-up Form */}
        <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 rounded-xl shadow-lg p-5 mb-4 border border-amber-400/30 backdrop-blur-sm">
          <form onSubmit={handleInitiateTopUp} className="space-y-4">
            {/* Quick Amount Options */}
            <div>
              <label className="block text-xs font-medium text-amber-300/90 mb-2">
                Amount
              </label>
              <div className="grid grid-cols-3 gap-2">
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
                    className={`relative p-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 text-xs ${
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
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {showCustomInput ? '× Custom' : '+ Custom'}
              </button>

              {showCustomInput && (
                <div className="mt-2">
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
                    className="w-full px-3 py-2 border border-amber-400/30 rounded-lg bg-slate-800/50 text-amber-300 placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/60 disabled:opacity-50 transition-all text-xs"
                  />
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-amber-300/90 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254712345678"
                disabled={loading || checkoutRequestId !== ''}
                className="w-full px-3 py-2 border border-amber-400/30 rounded-lg bg-slate-800/50 text-amber-300 placeholder-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/60 disabled:opacity-50 transition-all text-xs"
              />
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-950/40 rounded-lg p-3 border border-amber-400/40 backdrop-blur-sm">
              <p className="text-xs text-amber-200/60 mb-1">Amount</p>
              <p className="text-2xl font-bold text-amber-300" style={{ fontFamily: 'Georgia, serif' }}>
                KES {getTopUpAmount().toLocaleString()}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || checkoutRequestId !== ''}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-95 text-sm"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : checkoutRequestId ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 rounded-xl shadow-lg p-5 mb-4 border border-amber-400/30 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-amber-300 mb-3" style={{ fontFamily: 'Georgia, serif' }}>Withdraw</h2>
          
          {gameBalance < WITHDRAWAL_MINIMUM ? (
            <div className="bg-amber-950/50 border border-amber-500/50 rounded-lg p-3 backdrop-blur-sm text-xs">
              <p className="text-amber-200/80">
                Min KES {WITHDRAWAL_MINIMUM.toLocaleString()} to withdraw. Current: KES {gameBalance.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-green-950/40 to-slate-950/40 rounded-lg p-3 border border-green-500/40 backdrop-blur-sm">
                <p className="text-xs text-green-300/70 mb-1">Available</p>
                <p className="text-xl font-bold text-green-400" style={{ fontFamily: 'Georgia, serif' }}>
                  KES {gameBalance.toLocaleString()}
                </p>
              </div>
              <button
                disabled
                className="w-full bg-slate-700/50 text-amber-200/50 font-bold py-2 px-4 rounded-lg cursor-not-allowed opacity-60 text-xs border border-slate-600/50"
                title="Coming soon"
              >
                Withdraw (Coming Soon)
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-amber-400/30 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="font-semibold text-amber-300 mb-2 text-xs" style={{ fontFamily: 'Georgia, serif' }}>
            How It Works
          </h3>
          <ol className="space-y-1 text-xs text-amber-200/80 list-decimal list-inside">
            <li>Pick amount or enter custom</li>
            <li>Enter M-Pesa phone number</li>
            <li>Click "Send Payment"</li>
            <li>Confirm STK prompt on phone</li>
            <li>Balance updates automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
