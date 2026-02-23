'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectCartTotalItems } from '@/redux/features/cartSlice';
import type { RootState } from '@/redux/store';

export default function FloatingCart() {
  const totalCartItems = useSelector(selectCartTotalItems);

  return (
    <Link
      href="/cart"
      title="Shopping Cart"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 transition-all hover:scale-110 active:scale-95">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.888-6.832a1.875 1.875 0 00-1.642-2.56H6.168M9 21a3 3 0 01-3-3h3.75a3 3 0 013 3M21 21a3 3 0 00-3-3h-3.75a3 3 0 003 3z"
        />
      </svg>
      {totalCartItems > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-600 text-xs font-bold">
          {totalCartItems}
        </span>
      )}
    </Link>
  );
}
