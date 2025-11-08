import { Spinner } from "@/components";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/80 dark:bg-white/5 backdrop-blur rounded-2xl shadow-lg flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    </div>
  );
}