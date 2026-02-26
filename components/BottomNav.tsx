'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalItems } from '@/redux/features/cartSlice';
import type { RootState } from '@/redux/store';

export default function BottomNav() {
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const totalCartItems = useSelector(selectCartTotalItems);
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="flex items-center justify-around h-16">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive('/') 
              ? 'text-red-600 dark:text-red-500' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Home">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isActive('/') ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Cart - Hidden for Admin/Staff */}
        {!isAdmin && !isStaff && (
          <Link
            href="/cart"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 relative transition-colors ${
              isActive('/cart') 
                ? 'text-red-600 dark:text-red-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Cart">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={isActive('/cart') ? 'currentColor' : 'none'}
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
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Cart</span>
          </Link>
        )}

        {/* Admin Dashboard - For Admin Users */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive('/admin') 
                ? 'text-amber-600 dark:text-amber-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Admin Dashboard">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isActive('/admin') ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m6.366.366l-.707.707M21 12h-1m.366 6.366l-.707-.707M12 21v-1m-6.366-.366l.707-.707M3 12h1m-.366-6.366l.707.707M7 11a4 4 0 118 0 4 4 0 01-8 0z"
              />
            </svg>
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}

        {/* Staff Panel - For Staff Users */}
        {isStaff && (
          <Link
            href="/staff"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive('/staff') 
                ? 'text-blue-600 dark:text-blue-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Staff Panel">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isActive('/staff') ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.148.408-.24.603a23.996 23.996 0 003.183.803a23.997 23.997 0 003.183-.803a23.997 23.997 0 00-.241-.603m-3.72 0a45.422 45.422 0 015.05.5c1.54.213 2.9 1.22 3.405 2.544m-4.604-6.817a23.987 23.987 0 00-5.05-.5c-1.54.213-2.9 1.22-3.405 2.544M6.75 7.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">Staff</span>
          </Link>
        )}

        {/* Orders - Hidden for Admin/Staff */}
        {isAuthenticated && !isAdmin && !isStaff && (
          <Link
            href="/orders"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive('/orders') 
                ? 'text-red-600 dark:text-red-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Orders">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isActive('/orders') ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.148.408-.24.603a23.996 23.996 0 003.183.803a23.997 23.997 0 003.183-.803a23.997 23.997 0 00-.241-.603m-3.72 0a45.422 45.422 0 015.05.5c1.54.213 2.9 1.22 3.405 2.544m-4.604-6.817a23.987 23.987 0 00-5.05-.5c-1.54.213-2.9 1.22-3.405 2.544M6.75 7.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">Orders</span>
          </Link>
        )}

        {/* Profile */}
        {isAuthenticated ? (
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive('/profile') 
                ? 'text-red-600 dark:text-red-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Profile">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isActive('/profile') ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive('/login') 
                ? 'text-red-600 dark:text-red-500' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Sign In">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isActive('/login') ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <span className="text-xs font-medium">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
