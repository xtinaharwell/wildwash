'use client';

import { BNPLManager } from '@/components';

export default function BNPLHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buy Now, Pay Later (BNPL)</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Split your car wash payments into manageable installments with zero interest.
            </p>
          </div>

          {/* BNPL Manager Component */}
          <div className="mb-8">
            <BNPLManager />
          </div>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">1. Enroll</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Sign up with your phone number for instant approval. No credit checks or lengthy applications needed.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">2. Split Payment</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Pay 50% upfront at checkout, and the remaining 50% in your next payment. No hidden fees or interest charges.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">3. Flexible Schedule</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Choose your preferred payment date within 14 days. Get reminders before payments are due.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">What happens if I miss a payment?</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  If you miss a payment, your BNPL service will be temporarily suspended until the payment is cleared. We'll send you reminders before and after the due date. No late fees are charged, but continued missed payments may affect your future eligibility.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Can I pay early?</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Yes! You can pay your remaining balance at any time with no penalties or extra fees. Early payments help maintain a good payment history and may increase your credit limit over time.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">What's the maximum credit limit?</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Initial credit limits start at KES 2,000 and can increase up to KES 10,000 based on your payment history and usage patterns. Regular on-time payments help build your credit limit over time.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">How do I opt out of BNPL?</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  You can opt out of BNPL at any time through your account settings, provided you have no outstanding balance. Once opted out, you can always re-enroll later if needed.
                </p>
              </div>
            </div>
          </section>

          {/* Terms and Conditions Summary */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Terms & Conditions</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Must be 18 years or older with a valid phone number to enroll
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  50% of the total amount is due at the time of service
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Remaining balance must be paid within 14 days
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Service may be suspended for missed payments
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}