'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/features/authSlice';
import type { RootState } from '@/redux/store';
import { selectCartTotalItems } from '@/redux/features/cartSlice';
import { useRiderOrderNotifications } from '@/lib/hooks/useRiderOrderNotifications';

export default function NavBar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const userName = useSelector((state: RootState) => state.auth.user?.username);
  const totalCartItems = useSelector(selectCartTotalItems);
  const { availableOrdersCount } = useRiderOrderNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isRider = userRole === 'rider';

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    dispatch(logout());
    setProfileOpen(false);
    router.push('/');
  };

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'backdrop-blur-md bg-white/80 dark:bg-[#071025]/90 shadow-sm border-b border-white/10'
          : 'bg-white/60 dark:bg-[#071025]/60 backdrop-blur-sm border-b border-white/5'
      }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
              <svg
                className={`w-6 h-6 transition-transform ${mobileOpen ? 'rotate-90' : 'rotate-0'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-500/95 flex items-center justify-center shadow-md shrink-0">
              <Link
                href="/"
                aria-label="Go to Wild Wash home"
                title="Wild Wash — Home"
                className="w-12 h-12 rounded-2xl bg-red-500/95 flex items-center justify-center shadow-md shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                <span className="font-bold text-white select-none">WW</span>
              </Link>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold leading-none">Wild Wash</h1>
              <p className="text-xs opacity-85 text-slate-700 dark:text-slate-300">
                Smart laundry, cleaning & fumigation
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/invest"
              className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
              Invest
            </Link>
            <Link
              href="/borrow"
              className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
              Borrow
            </Link>
            <Link
              href="/financing"
              className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
              Financing / Pay
            </Link>
            <Link
              href="/offers"
              className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
              Offers
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
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
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {/* Orders Icon - for all authenticated users */}
            {isAuthenticated && (
              <Link
                href="/orders"
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                title="Your orders">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.148.408-.24.603a23.996 23.996 0 003.183.803a23.997 23.997 0 003.183-.803 23.997 23.997 0 00-.241-.603m-3.72 0a45.422 45.422 0 015.05.5c1.54.213 2.9 1.22 3.405 2.544m-4.604-6.817a23.987 23.987 0 00-5.05-.5c-1.54.213-2.9 1.22-3.405 2.544M6.75 7.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            )}

            {/* Rider Orders Notification Dot */}
            {isRider && isAuthenticated && (
              <Link
                href="/rider"
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                title="Available orders">
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
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.148.408-.24.603a23.996 23.996 0 003.183.803a23.997 23.997 0 003.183-.803 23.997 23.997 0 00-.241-.603m-3.72 0a45.422 45.422 0 015.05.5c1.54.213 2.9 1.22 3.405 2.544m-4.604-6.817a23.987 23.987 0 00-5.050-.5c-1.54.213-2.9 1.22-3.405 2.544M6.75 7.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {availableOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white animate-pulse">
                    {availableOrdersCount > 99 ? '99+' : availableOrdersCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
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
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName || 'User'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">{userRole || 'customer'}</div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={() => setProfileOpen(false)}>
                        Your Profile
                      </Link>
                      {!isAuthenticated && (
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          onClick={() => setProfileOpen(false)}>
                          Your Orders
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <div
        className={`md:hidden transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${
          mobileOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="mt-2 rounded-xl bg-white/95 dark:bg-black/60 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <Link
                href="/borrow"
                onClick={() => setMobileOpen(false)}
                className="block text-lg px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
                Borrow
              </Link>
              <Link
                href="/financing"
                onClick={() => setMobileOpen(false)}
                className="block text-lg px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
                Financing / Pay
              </Link>
              <Link
                href="/offers"
                onClick={() => setMobileOpen(false)}
                  className="block text-lg px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium">
                Offers
              </Link>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800" />

              <div className="flex gap-3 mt-2 justify-center">
                <Link
                  href="/rider"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                  Rider
                </Link>
                <Link
                  href="/staff"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                  Staff
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm px-3 py-2 rounded-md hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
