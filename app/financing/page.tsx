"use client"

import { CreditCard, Banknote, Calendar, ArrowRight, Gift, Recycle } from 'lucide-react';
import Link from 'next/link';
import { BNPLManager } from '@/components';

const paymentMethods = [
  {
    name: "Credit/Debit Card",
    description: "Pay securely with your credit or debit card. We accept Visa, Mastercard, and American Express.",
    icon: <CreditCard className="w-6 h-6" />,
    benefits: ["Instant processing", "Secure transactions", "Save card for future use"]
  },
  {
    name: "Mobile Money",
    description: "Pay using M-PESA, the most popular mobile money service in Kenya.",
    icon: <Banknote className="w-6 h-6" />,
    benefits: ["Quick transfers", "Widely accessible", "No additional fees"]
  }
];

export default function FinancingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold">Payment Options</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Choose from multiple payment methods to make your laundry experience convenient and hassle-free.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {paymentMethods.map((method) => (
            <div key={method.name} className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
              <div className="flex items-center gap-3 text-red-600">
                {method.icon}
                <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">{method.name}</h2>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{method.description}</p>
              <ul className="mt-4 space-y-2">
                {method.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <ArrowRight className="w-4 h-4 text-red-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow mb-8">
          <h2 className="text-2xl font-bold mb-4">Buy Now, Pay Later Details</h2>
          <BNPLManager />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Trade In Section */}
          <section className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Recycle className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trade In</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Trade in your old appliances or equipment for credit towards our services. We accept various items in good working condition.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Get instant credit for your trade-ins
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Eco-friendly disposal of old items
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Fair valuation of your items
              </li>
            </ul>
            <button className="w-full bg-red-600/10 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-600/20 transition-colors">
              Learn More About Trade-Ins
            </button>
          </section>

          {/* Pay for a Friend Section */}
          <section className="rounded-2xl bg-white/80 dark:bg-white/5 p-6 shadow">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Gift className="w-6 h-6" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pay for a Friend</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Gift our services to friends and family. Perfect for special occasions or helping out loved ones.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Send digital gift cards instantly
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Schedule future service payments
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600" />
                Track when your gift is used
              </li>
            </ul>
            <button className="w-full bg-red-600/10 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-600/20 transition-colors">
              Send a Gift Service
            </button>
          </section>
        </div>

        <div className="text-center">
          <Link 
            href="/book" 
            className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-full font-semibold shadow hover:scale-[1.01] transition-transform"
          >
            Book a service now
          </Link>
        </div>
      </div>
    </div>
  );
}
