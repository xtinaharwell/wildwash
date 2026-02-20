'use client';

import React from 'react';
import BNPLManager from '@/components/BNPLManager';
import RouteGuard from '@/components/RouteGuard';

export default function BNPLPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018] text-slate-900 dark:text-slate-100 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold mb-2">Buy Now, Pay Later</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Manage your BNPL account, enroll for flexible payment options, and track your credit usage
            </p>
          </header>
          
          <BNPLManager />
        </div>
      </div>
    </RouteGuard>
  );
}
