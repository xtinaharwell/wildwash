import { Suspense } from 'react';
import type { ReactNode } from 'react';
import CheckoutForm from './checkout-form';

export const dynamic = 'force-dynamic';

function CheckoutLoading(): ReactNode {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4 mx-auto mb-8"></div>
          
          {/* Form skeleton */}
          <div className="space-y-5">
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutForm />
    </Suspense>
  );
}
