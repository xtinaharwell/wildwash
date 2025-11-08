"use client"

import { CreditCard, Banknote, Calendar, ArrowRight, Gift, Recycle, Phone } from 'lucide-react';
import Link from 'next/link';
import { BNPLManager } from '@/components';

const paymentMethods = [
  {
    name: "Mobile Money (M-PESA)",
    description: "Quick and secure payments through M-PESA",
    icon: <Phone className="w-6 h-6" />,
    benefits: ["Instant transfers", "Wide accessibility", "No hidden fees"],
    primary: true
  }

];

export default function FinancingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-500">Payment Options</h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Choose your preferred payment method for a seamless laundry experience
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* M-PESA Payment Card */}
          <div className="rounded-2xl bg-gradient-to-b from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/30 ring-1 ring-red-500/20 p-4 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Mobile Money (M-PESA)</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Quick and secure payments through M-PESA for your laundry services.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                Instant transfers
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                No hidden fees
              </li>
            </ul>
            <button className="w-full bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors">
              Pay with M-PESA
            </button>
          </div>

          {/* BNPL Card */}
          <div className="rounded-2xl bg-white/90 dark:bg-white/5 p-4 shadow hover:shadow-md transition-shadow">
            <div className="mt-4">
              <BNPLManager />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Trade In Section */}
          <section className="rounded-2xl bg-white/90 dark:bg-white/5 p-4 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <Recycle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Trade In</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Trade in your old appliances or equipment for credit towards our services.
            </p>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                Get instant credit for trade-ins
              </li>
              <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                Eco-friendly disposal of items
              </li>
            </ul>
            <button className="w-full bg-red-600/10 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600/20 transition-colors">
              Learn More
            </button>
          </section>

          {/* Pay for a Friend Section */}
          <section className="rounded-2xl bg-white/90 dark:bg-white/5 p-4 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <Gift className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pay for a Friend</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Gift our services to friends and family. Perfect for special occasions.
            </p>
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                Send digital gift cards instantly
              </li>
              <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ArrowRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                Schedule future payments
              </li>
            </ul>
            <button className="w-full bg-red-600/10 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600/20 transition-colors">
              Send a Gift
            </button>
          </section>
        </div>



        <div className="text-center">
          <Link 
            href="/book" 
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow hover:bg-red-500 transition-colors"
          >
            Book Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
