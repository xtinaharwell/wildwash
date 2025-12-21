"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function InvestPage(): React.ReactElement {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const investmentPlans = [
    {
      id: 'starter',
      name: 'Starter',
      minInvestment: 50000,
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
      minInvestment: 250000,
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
      minInvestment: 1000000,
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

  const benefits = [
    {
      icon: '📈',
      title: 'Competitive Returns',
      description: 'Earn attractive returns on your investment with transparent and predictable payouts'
    },
    {
      icon: '🔒',
      title: 'Secure Investment',
      description: 'Your capital is protected by our robust business model and financial safeguards'
    },
    {
      icon: '💳',
      title: 'Easy Withdrawals',
      description: 'Flexible withdrawal options with quick processing times'
    },
    {
      icon: '📊',
      title: 'Real-time Dashboard',
      description: 'Track your investments and returns in real-time through our investor portal'
    },
    {
      icon: '🤝',
      title: 'Dedicated Support',
      description: 'Get personalized support from our investor relations team'
    },
    {
      icon: '🌍',
      title: 'Growing Business',
      description: 'Invest in a rapidly expanding laundry, cleaning & fumigation service platform'
    }
  ];

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
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 text-white pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Invest in Wild Wash</h1>
          <p className="text-lg md:text-xl text-red-50 max-w-2xl">
            Grow your wealth by investing in Kenya's fastest-growing laundry, cleaning & fumigation service platform
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Why Invest Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12 text-center">Why Invest in Wild Wash?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Investment Plans */}
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
                    onClick={() => setSelectedPlan(plan.id)}
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
    </div>
  );
}
