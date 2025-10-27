"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type RouteGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // For admin routes, redirect to admin login
      if (requireAdmin) {
        router.push(`/admin-login?redirect=${pathname}`);
      } else {
        router.push(`/login?redirect=${pathname}`);
      }
      return;
    }

    if (requireAdmin && userRole !== 'admin') {
      setShowError(true);
      // Auto-redirect after showing error message
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userRole, requireAdmin, router, pathname]);

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Access Denied</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Sorry, this page is only accessible to administrators.
              You will be redirected to the home page shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}