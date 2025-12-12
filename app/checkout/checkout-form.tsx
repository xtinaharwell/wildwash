'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

interface CheckoutForm {
  amount: string;
  phone: string;
  order_id: string;
  firstName: string;
  lastName: string;
}

export default function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<CheckoutForm>({
    amount: '',
    phone: '',
    order_id: '',
    firstName: '',
    lastName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-fill form from query params and user data on mount
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const amount = searchParams.get('amount');
    
    let userPhone = '';
    let userFirstName = '';
    let userLastName = '';

    // Try to get user data from localStorage
    if (typeof window !== 'undefined') {
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          userPhone = user.phone || '';
          userFirstName = user.first_name || user.firstName || '';
          userLastName = user.last_name || user.lastName || '';
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    setFormData(prev => ({
      ...prev,
      order_id: orderId || prev.order_id,
      amount: amount || prev.amount,
      phone: userPhone || prev.phone,
      firstName: userFirstName || prev.firstName,
      lastName: userLastName || prev.lastName,
    }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.amount || !formData.phone || !formData.order_id) {
      setError('Amount, phone number, and order ID are required');
      return false;
    }

    // Validate phone number
    if (!isValidPhoneNumber(formData.phone)) {
      setError('Invalid phone number. Use format: 254712345678 or 0712345678');
      return false;
    }

    // Validate amount
    if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Amount must be a valid positive number');
      return false;
    }

    return true;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    // Accept formats: 254712345678 or 0712345678 or +254712345678
    const cleanPhone = phone.replace('+', '');
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return /^0[0-9]{9}$/.test(cleanPhone);
    }
    if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      return /^254[0-9]{9}$/.test(cleanPhone);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Get auth token from wildwash_auth_state
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
      
      // Clean phone number (remove + if present)
      let cleanPhone = formData.phone.replace('+', '');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/payments/mpesa/stk-push/`,
        {
          amount: formData.amount,
          phone: cleanPhone,
          order_id: formData.order_id,
        },
        {
          headers: {
            ...(token && { 'Authorization': `Token ${token}` }),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setSuccess(`STK push sent to ${formData.phone}. Please check your phone to complete the payment.`);
        
        // Optionally redirect after successful STK push
        setTimeout(() => {
          router.push(`/orders/${formData.order_id}/payment-status`);
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to process payment. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Checkout</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Complete your payment with M-Pesa</p>
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
            <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order ID */}
          <div>
            <label htmlFor="order_id" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Order ID
            </label>
            <input
              type="text"
              id="order_id"
              name="order_id"
              value={formData.order_id}
              onChange={handleChange}
              placeholder="e.g., ORD-2025-001"
              className="mt-2 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Amount (KES)
            </label>
            <div className="mt-2 relative">
              <span className="absolute left-4 top-3 text-slate-500 dark:text-slate-400 font-medium">KES</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="1"
                className="block w-full pl-14 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 254712345678 or 0712345678"
              className="mt-2 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Format: 254712345678 or 0712345678</p>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className="mt-2 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              disabled={loading}
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className="mt-2 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Pay with M-Pesa'
            )}
          </button>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              <strong>How it works:</strong> You will receive an M-Pesa prompt on your phone. Enter your M-Pesa PIN to complete the payment.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
