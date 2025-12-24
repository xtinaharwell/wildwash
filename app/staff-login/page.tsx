"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to regular login page
    router.replace("/login?role=staff");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">Redirecting to login...</p>
      </div>
    </div>
  );
}