"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

interface InvestmentConfirmation {
  amount: number;
  plan: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  expectedReturn: number;
  expectedMonthlyReturn: number;
  lockupPeriod: string;
  maturityDate: string;
}

export default function InvestPage(): React.ReactElement {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentConfirmation, setInvestmentConfirmation] = useState<InvestmentConfirmation | null>(null);
  
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userPhone = useSelector((state: RootState) => state.auth.user?.phone);

  const investmentPlans = [
    {
      id: 'starter',
      name: 'Starter',
      minInvestment: 5000,
      expectedReturn: '15%',
      term: '12 months',
      description: 'Perfect for new investors starting their investment journey',
      features: [
        'Minimum investment of KSh 50,000',
        'Expected annual return of 15%',
        '12-month investment term',
        'Monthly interest payouts',
        'Flexible withdrawal options',
        'Dedicated investor support'
      ],
      color: 'blue'
    },
    {
      id: 'professional',
      name: 'Professional',
      minInvestment: 25000,
      expectedReturn: '18%',
      term: '12-24 months',
      description: 'For serious investors looking for higher returns',
      features: [
        'Minimum investment of KSh 250,000',
        'Expected annual return of 18%',
        '12-24 month flexible terms',
        'Bi-weekly interest payouts',
        'Priority withdrawal processing',
        'Personal account manager'
      ],
      color: 'purple'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      minInvestment: 100000,
      expectedReturn: '22%',
      term: '12-36 months',
      description: 'Premium investment package for institutional investors',
      features: [
        'Minimum investment of KSh 1,000,000',
        'Expected annual return of 22%',
        '12-36 month customizable terms',
        'Weekly interest payouts',
        'Immediate withdrawal access',
        'Executive advisor & tax planning'
      ],
      color: 'amber'
    }
  ];


  const calculateExpectedReturns = (amount: number, returnPercentage: string, months: number) => {
    const percentage = parseFloat(returnPercentage);
    const totalReturn = (amount * percentage) / 100;
    const monthlyReturn = totalReturn / 12;
    return { totalReturn, monthlyReturn };
  };

  const calculateMaturityDate = (plan: any) => {
    const now = new Date();
    const months = plan.id === 'starter' ? 12 : plan.id === 'professional' ? 18 : 24;
    now.setMonth(now.getMonth() + months);
    return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleInvest = async (plan: any) => {
    if (!isAuthenticated) {
      setError('Please login to invest');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (!amount || amount < plan.minInvestment) {
      setError(`Minimum investment is KSh ${plan.minInvestment.toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initiate STK push
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          amount: amount,
          accountReference: `INVEST-${plan.id.toUpperCase()}`,
          transactionDesc: `Wild Wash Investment - ${plan.name} Plan`,
          investmentPlan: plan.id,
          investmentAmount: amount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const data = await response.json();

      // Calculate returns
      const months = plan.id === 'starter' ? 12 : plan.id === 'professional' ? 18 : 24;
      const { totalReturn, monthlyReturn } = calculateExpectedReturns(amount, plan.expectedReturn, months);
      const maturityDate = calculateMaturityDate(plan);

      // Show confirmation
      setInvestmentConfirmation({
        amount,
        plan: plan.name,
        paymentStatus: 'pending',
        expectedReturn: totalReturn,
        expectedMonthlyReturn: monthlyReturn,
        lockupPeriod: plan.term,
        maturityDate
      });

      setSelectedPlan(null);
      setInvestmentAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      number: '1',
      title: 'Register',
      description: 'Create your investor account on our platform'
    },
    {
      number: '2',
      title: 'Verify',
      description: 'Complete KYC verification process'
    },
    {
      number: '3',
      title: 'Invest',
      description: 'Choose your plan and make your first investment'
    },
    {
      number: '4',
      title: 'Earn',
      description: 'Start earning returns on your investment'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Investment Confirmation Modal */}
      {investmentConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Investment Confirmed!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">STK push sent to your phone</p>
            </div>

            <div className="space-y-4 mb-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">Plan:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{investmentConfirmation.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">Investment Amount:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">KSh {investmentConfirmation.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">Lockup Period:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{investmentConfirmation.lockupPeriod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">Maturity Date:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{investmentConfirmation.maturityDate}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 dark:text-slate-300">Expected Annual Return:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">+KSh {investmentConfirmation.expectedReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 dark:text-slate-300">Expected Monthly Return:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">+KSh {investmentConfirmation.expectedMonthlyReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setInvestmentConfirmation(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                View Investment Dashboard
              </button>
              <button
                onClick={() => setInvestmentConfirmation(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors">
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Amount Modal */}
      {selectedPlan && !investmentConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Enter Investment Amount</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount (KSh)</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => {
                  setInvestmentAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Minimum: KSh {investmentPlans.find(p => p.id === selectedPlan)?.minInvestment.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const plan = investmentPlans.find(p => p.id === selectedPlan);
                  if (plan) handleInvest(plan);
                }}
                disabled={isLoading || !investmentAmount}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                {isLoading && <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                {isLoading ? 'Processing...' : 'Continue'}
              </button>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setInvestmentAmount('');
                  setError(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!investmentConfirmation && (
        <>


      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <section className="py-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12 text-center">Investment Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {investmentPlans.map((plan) => {
              const colorClasses = {
                blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              };
              const buttonClasses = {
                blue: 'bg-blue-600 hover:bg-blue-700',
                purple: 'bg-purple-600 hover:bg-purple-700',
                amber: 'bg-amber-600 hover:bg-amber-700'
              };

              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 p-8 shadow-lg transition-all hover:shadow-xl ${
                    colorClasses[plan.color as keyof typeof colorClasses]
                  } bg-white dark:bg-slate-800 dark:border-opacity-30`}
                >
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{plan.description}</p>

                  <div className="space-y-2 mb-6 py-4 border-y border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Min Investment:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">KSh {plan.minInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Expected Return:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{plan.expectedReturn} p.a.</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300">Investment Term:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{plan.term}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-400">
                          <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        setError('Please login to invest');
                        return;
                      }
                      setSelectedPlan(plan.id);
                    }}
                    className={`w-full py-2 rounded-lg text-white font-medium transition-colors ${
                      buttonClasses[plan.color as keyof typeof buttonClasses]
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Choose Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700 text-center">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-red-600 transform -translate-y-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: 'What is the minimum investment amount?',
                answer: 'The minimum investment varies by plan. Our Starter plan requires KSh 50,000, Professional plan requires KSh 250,000, and Enterprise plan requires KSh 1,000,000.'
              },
              {
                question: 'How often will I receive returns?',
                answer: 'Returns are paid out monthly for Starter plans, bi-weekly for Professional plans, and weekly for Enterprise plans.'
              },
              {
                question: 'Is my investment guaranteed?',
                answer: 'While we cannot guarantee returns, our investments are secured by our growing business operations and robust financial safeguards.'
              },
              {
                question: 'Can I withdraw my investment early?',
                answer: 'Yes, all plans offer flexible withdrawal options. Withdrawal processing times vary by plan tier, from immediate for Enterprise to standard for Starter plans.'
              },
              {
                question: 'What is the investment term?',
                answer: 'Terms range from 12 to 36 months depending on your chosen plan. You can select what works best for your financial goals.'
              },
              {
                question: 'How do I get started?',
                answer: 'Simply register on our platform, complete KYC verification, choose your investment plan, and make your first investment. Our team will guide you through every step.'
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                  {faq.question}
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 rounded-lg p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Investing?</h2>
            <p className="text-lg text-red-50 mb-8 max-w-2xl mx-auto">
              Join hundreds of investors who are already growing their wealth with Wild Wash
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Get Started Now
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </section>

        {/* Risk Disclaimer */}
        <section className="py-16">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Important Disclaimer</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Investments in Wild Wash carry risk. Past performance is not indicative of future results. Returns are not guaranteed. Please review all terms and conditions carefully before investing. Consult with a financial advisor if needed.
            </p>
          </div>
        </section>
      </div>
        </>
      )}
    </div>
  );
}
