"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type RouteGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRider?: boolean;
};

export default function RouteGuard({ children, requireAdmin = false, requireRider = false }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Debug log
    console.log('RouteGuard State:', {
      isAuthenticated,
      userRole,
      requireAdmin,
      requireRider,
      pathname
    });

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting...');
      // For admin routes, redirect to admin login
      if (requireAdmin) {
        router.push(`/admin-login?redirect=${pathname}`);
      } else if (requireRider) {
        router.push(`/rider-login?redirect=${pathname}`);
      } else {
        router.push(`/login?redirect=${pathname}`);
      }
      return;
    }

    // Check if user has the required role
    const hasRequiredRole = (requireAdmin && userRole === 'admin') || (requireRider && userRole === 'rider');
    console.log('Role check:', { requireAdmin, requireRider, userRole, hasRequiredRole });

    if (requireAdmin || requireRider) {
      if (!hasRequiredRole) {
        console.log('Insufficient permissions, showing error...');
        setShowError(true);
        // Auto-redirect after showing error message
        const timer = setTimeout(() => {
          if (requireRider) {
            router.push('/rider-login');
          } else if (requireAdmin) {
            router.push('/admin-login');
          } else {
            router.push('/login');
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, userRole, requireAdmin, requireRider, router, pathname]);

  if (!isAuthenticated) {
    return null;
  }

  if ((requireAdmin && userRole !== 'admin') || (requireRider && userRole !== 'rider')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Access Denied</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {requireAdmin 
                ? "Sorry, this page is only accessible to administrators."
                : "Sorry, this page is only accessible to riders."}
              You will be redirected to the home page shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}