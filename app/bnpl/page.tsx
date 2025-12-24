'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface BNPLStatus {
  is_enrolled: boolean;
  is_active: boolean;
  credit_limit: number;
  current_balance: number;
  phone_number?: string;
}

interface UserData {
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export default function BNPLPage() {
  const router = useRouter();
  const [bnplStatus, setBnplStatus] = useState<BNPLStatus | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        const authState = localStorage.getItem('wildwash_auth_state');
        if (authState) {
          try {
            const parsed = JSON.parse(authState);
            token = parsed.token;
          } catch (e) {
            console.error('Error parsing auth state:', e);
          }
        }
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiBase) {
        setError('API endpoint not configured');
        setLoading(false);
        return;
      }

      // Fetch BNPL status
      const statusResponse = await axios.get<BNPLStatus>(
        `${apiBase}/payments/bnpl/status/`,
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        }
      );

      setBnplStatus(statusResponse.data);

      // Fetch user data
      const userResponse = await axios.get<UserData>(
        `${apiBase}/users/me/`,
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
          },
        }
      );

      setUserData(userResponse.data);
      setPhone(userResponse.data?.phone || '');
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load BNPL information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amount || !phone) {
      setError('Please enter an amount and ensure phone number is available');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (parseFloat(amount) > bnplStatus!.current_balance) {
      setError(`Payment amount cannot exceed your balance of KES ${bnplStatus!.current_balance.toLocaleString()}`);
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      setError('Invalid phone number. Use format: 254712345678 or 0712345678');
      return;
    }

    setProcessing(true);

    try {
      let token = null;
      if (typeof window !== 'undefined') {
        const authState = localStorage.getItem('wildwash_auth_state');
        if (authState) {
          try {
            const parsed = JSON.parse(authState);
            token = parsed.token;
          } catch (e) {
            console.error('Error parsing auth state:', e);
          }
        }
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiBase) {
        throw new Error('API endpoint not configured');
      }

      let cleanPhone = phone.replace('+', '');

      // Generate a unique BNPL payment reference (shorter)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const bnplOrderId = `BNPL-${timestamp}-${randomNum}`;

      const response = await axios.post(
        `${apiBase}/payments/mpesa/stk-push/`,
        {
          amount: amount,
          phone: cleanPhone,
          order_id: bnplOrderId,
        },
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setSuccess(
          `✓ STK push sent to ${phone}. Enter your M-Pesa PIN to complete the payment of KES ${parseFloat(amount).toLocaleString()}. Your balance will update automatically once payment is confirmed.`
        );
        setAmount('');

        // Poll for updated BNPL status every 5 seconds for 60 seconds
        let pollCount = 0;
        const pollInterval = setInterval(() => {
          pollCount++;
          if (pollCount >= 12) {
            clearInterval(pollInterval);
          } else {
            fetchData();
          }
        }, 5000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to initiate payment. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const isValidPhoneNumber = (phoneNum: string): boolean => {
    const cleanPhone = phoneNum.replace('+', '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return /^0[0-9]{9}$/.test(cleanPhone);
    }
    if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      return /^254[0-9]{9}$/.test(cleanPhone);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p>Loading BNPL information...</p>
        </div>
      </div>
    );
  }

  if (!bnplStatus?.is_enrolled) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-4">Not Enrolled in BNPL</h1>
            <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
              You need to enroll in our Buy Now, Pay Later service first to manage your debts.
            </p>
            <a
              href="/financing"
              className="block w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-full text-center transition-colors hover:bg-red-700"
            >
              View Payment Options
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CreditCard className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold">BNPL Management</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your Buy Now, Pay Later account and clear your balance
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* BNPL Status Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Status</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Credit Limit */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Credit Limit</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                KES {bnplStatus.credit_limit.toLocaleString()}
              </p>
            </div>

            {/* Current Balance */}
            <div className={`p-4 rounded-lg ${
              bnplStatus.current_balance > 0
                ? 'bg-red-50 dark:bg-red-900/20'
                : 'bg-green-50 dark:bg-green-900/20'
            }`}>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${
                bnplStatus.current_balance > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                KES {bnplStatus.current_balance.toLocaleString()}
              </p>
            </div>

            {/* Available Credit */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available Credit</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                KES {(bnplStatus.credit_limit - bnplStatus.current_balance).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
              bnplStatus.is_active
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}>
              <span className={`w-2 h-2 mr-2 rounded-full ${
                bnplStatus.is_active ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              {bnplStatus.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        {bnplStatus.current_balance > 0 && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Clear Your Balance</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Pay towards your BNPL balance using M-Pesa. You owe KES {bnplStatus.current_balance.toLocaleString()}.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 254712345678 or 0712345678"
                  className="mt-2 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                  disabled={processing}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Format: 254712345678 or 0712345678</p>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                  Payment Amount (KES)
                </label>
                <div className="mt-2 relative">
                  <span className="absolute left-4 top-3 text-slate-500 dark:text-slate-400 font-medium">KES</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max={bnplStatus.current_balance}
                    className="block w-full pl-14 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                    disabled={processing}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Maximum: KES {bnplStatus.current_balance.toLocaleString()}
                </p>
              </div>

              {/* Quick Payment Buttons */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Quick Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount((bnplStatus.current_balance / 2).toFixed(2))}
                    disabled={processing}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Half ({(bnplStatus.current_balance / 2).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(bnplStatus.current_balance.toFixed(2))}
                    disabled={processing}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Full ({bnplStatus.current_balance.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.min(5000, bnplStatus.current_balance).toFixed(2))}
                    disabled={processing}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Max 5K
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing || !amount || !phone}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center mt-6"
              >
                {processing ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Processing...
                  </>
                ) : (
                  'Pay with M-Pesa'
                )}
              </button>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  <strong>How it works:</strong> You will receive an M-Pesa prompt on your phone. Enter your M-Pesa PIN to complete the payment. Your BNPL balance will be updated immediately.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* No Balance Message */}
        {bnplStatus.current_balance === 0 && (
          <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-green-900 dark:text-green-100">All Clear!</h2>
            </div>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Congratulations! You have no outstanding balance on your BNPL account. You can now use your full credit limit for new purchases.
            </p>
            <a
              href="/book"
              className="inline-block bg-green-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-green-700 transition-colors"
            >
              Book a Service
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
