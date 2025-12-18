'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface PaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'initiated';
  message: string;
  checkout_request_id: string;
  order_id: string;
  amount: number;
}

export default function PaymentStatusPage() {
  const params = useParams();
  const orderId = params.code as string;
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/orders/${orderId}/payment-status/`,
          {
            headers: {
              'Authorization': `Token ${token}`,
            },
          }
        );

        const data = response.data as PaymentStatus;
        setPaymentStatus(data);

        // Stop polling if payment is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setLoading(false);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to fetch payment status';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchPaymentStatus();

    // Poll for updates every 5 seconds (max 12 times = 60 seconds)
    const interval = setInterval(() => {
      setPollingCount(prev => {
        if (prev >= 12) {
          clearInterval(interval);
          setLoading(false);
          return prev;
        }
        return prev + 1;
      });
      fetchPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !paymentStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-8">
        {paymentStatus?.status === 'completed' ? (
          <>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful</h2>
              <p className="mt-2 text-gray-600">Your payment has been processed successfully.</p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold text-gray-900">{paymentStatus.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">KES {paymentStatus.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference ID:</span>
                <span className="font-semibold text-gray-900 text-sm">{paymentStatus.checkout_request_id}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/orders/${orderId}`}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-center block"
              >
                View Order Details
              </Link>
              <Link
                href="/orders"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200 text-center block"
              >
                Back to Orders
              </Link>
            </div>
          </>
        ) : paymentStatus?.status === 'failed' ? (
          <>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Failed</h2>
              <p className="mt-2 text-gray-600">Your payment could not be processed.</p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold text-gray-900">{paymentStatus.order_id}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/checkout"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-center block"
              >
                Try Again
              </Link>
              <Link
                href="/orders"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200 text-center block"
              >
                Back to Orders
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Pending</h2>
              <p className="mt-2 text-gray-600">Waiting for your M-Pesa confirmation...</p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                <strong>Status:</strong> {paymentStatus?.status || 'initiated'}
              </p>
              <p className="text-blue-700 text-xs mt-2">
                Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
              </p>
            </div>

            {pollingCount >= 12 && (
              <div className="mt-6">
                <Link
                  href="/checkout"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-center block"
                >
                  Try Again
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
