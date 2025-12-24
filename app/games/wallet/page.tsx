'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, Send, Loader, AlertCircle, CheckCircle } from 'lucide-react';
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
        `${apiBase}/games/wallet-balance/`,
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] pt-40 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Games
          </Link>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Game Wallet</h1>
              <p className="text-slate-600 dark:text-slate-400">Top up your balance to play casino games</p>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 mb-8 shadow-lg text-white">
          <p className="text-sm opacity-90 mb-1">Current Balance</p>
          <p className="text-4xl font-bold">
            KES {gameBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs opacity-75 mt-2">Play with real-time balance updates</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
          </div>
        )}

        {/* Top-up Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Select Amount to Top Up</h2>

          <form onSubmit={handleInitiateTopUp} className="space-y-6">
            {/* Quick Amount Options */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Quick Options
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    className={`relative p-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                      selectedAmount === option.amount && !customAmount
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                    {option.popular && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold text-yellow-900 px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {showCustomInput ? '× Hide Custom Amount' : '+ Enter Custom Amount'}
              </button>

              {showCustomInput && (
                <div className="mt-3">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(0);
                    }}
                    placeholder="Enter amount in KES (min 10, max 1,000,000)"
                    min="10"
                    max="1000000"
                    disabled={loading || checkoutRequestId !== ''}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone Number (M-Pesa)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254712345678"
                disabled={loading || checkoutRequestId !== ''}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Format: 254XXXXXXXXX or 07XXXXXXXX (auto-formatted)
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">You will top up:</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                KES {getTopUpAmount().toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This will be added to your game balance immediately after payment confirmation
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || checkoutRequestId !== ''}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : checkoutRequestId ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Waiting for payment confirmation...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Initiate M-Pesa Payment
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">How it works</h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300 list-decimal list-inside">
            <li>Select or enter the amount you want to top up</li>
            <li>Verify your M-Pesa phone number</li>
            <li>Click "Initiate M-Pesa Payment"</li>
            <li>You'll receive an STK prompt on your phone</li>
            <li>Enter your M-Pesa PIN to complete the payment</li>
            <li>Your balance will update automatically once confirmed</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
