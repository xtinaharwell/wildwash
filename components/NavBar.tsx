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
  const [appsOpen, setAppsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
        setAppsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Check if the click was not on the hamburger menu button
        const target = event.target as HTMLElement;
        if (!target.closest('button[aria-expanded]')) {
          setMobileOpen(false);
        }
      }
    }
    
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

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
              onClick={() => setAppsOpen((s) => !s)}
              aria-expanded={appsOpen}
              aria-label={appsOpen ? 'Close apps' : 'Open apps'}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              ref={appsRef}
              title="Apps">
              {/* Google-style app grid icon */}
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor">
                <rect x="2" y="2" width="4" height="4" rx="0.5" />
                <rect x="10" y="2" width="4" height="4" rx="0.5" />
                <rect x="18" y="2" width="4" height="4" rx="0.5" />
                <rect x="2" y="10" width="4" height="4" rx="0.5" />
                <rect x="10" y="10" width="4" height="4" rx="0.5" />
                <rect x="18" y="10" width="4" height="4" rx="0.5" />
                <rect x="2" y="18" width="4" height="4" rx="0.5" />
                <rect x="10" y="18" width="4" height="4" rx="0.5" />
                <rect x="18" y="18" width="4" height="4" rx="0.5" />
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

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/offers"
              className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
              Offers
            </Link>
            <Link
              href="/financing"
              className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
              Financing
            </Link>
            <Link
              href="/borrow"
              className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
              Borrow
            </Link>
            <Link
              href="/invest"
              className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
              Invest
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/bnpl"
                  className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
                  BNPL
                </Link>
                <Link
                  href="/tradein"
                  className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
                  Trade-In
                </Link>
              </>
            )}
            <Link
              href="/casino"
              className="text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 font-medium transition-colors">
              Casino
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

      {/* App Grid Dropdown */}
      {appsOpen && (
        <div className="fixed top-16 left-4 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 w-96 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-3">
            {/* Offers */}
            <Link
              href="/offers"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50 transition-colors group"
              onClick={() => {
                setAppsOpen(false);
              }}>
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
              <span className="text-xs font-medium text-center">Offers</span>
            </Link>

            {/* Financing */}
            <Link
              href="/financing"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/50 dark:hover:to-green-800/50 transition-colors group"
              onClick={() => {
                setAppsOpen(false);
              }}>
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
              </svg>
              <span className="text-xs font-medium text-center">Financing</span>
            </Link>

            {/* Borrow */}
            <Link
              href="/borrow"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/50 dark:hover:to-purple-800/50 transition-colors group"
              onClick={() => {
                setAppsOpen(false);
              }}>
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
              </svg>
              <span className="text-xs font-medium text-center">Borrow</span>
            </Link>

            {/* Invest */}
            <Link
              href="/invest"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/50 dark:hover:to-orange-800/50 transition-colors group"
              onClick={() => {
                setAppsOpen(false);
              }}>
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <span className="text-xs font-medium text-center">Invest</span>
            </Link>

            {/* BNPL - only for authenticated users */}
            {isAuthenticated && (
              <Link
                href="/bnpl"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-900/50 dark:hover:to-pink-800/50 transition-colors group"
                onClick={() => {
                  setAppsOpen(false);
                }}>
                <svg className="w-8 h-8 text-pink-600 dark:text-pink-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                </svg>
                <span className="text-xs font-medium text-center">BNPL</span>
              </Link>
            )}

            {/* Trade-In - only for authenticated users */}
            {isAuthenticated && (
              <Link
                href="/tradein"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 hover:from-cyan-100 hover:to-cyan-200 dark:hover:from-cyan-900/50 dark:hover:to-cyan-800/50 transition-colors group"
                onClick={() => {
                  setAppsOpen(false);
                }}>
                <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
                </svg>
                <span className="text-xs font-medium text-center">Trade-In</span>
              </Link>
            )}

            {/* Casino */}
            <Link
              href="/casino"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-900/50 dark:hover:to-amber-800/50 transition-colors group"
              onClick={() => {
                setAppsOpen(false);
              }}>
              <svg className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
              </svg>
              <span className="text-xs font-medium text-center">Casino</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
