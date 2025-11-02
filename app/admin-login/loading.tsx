import { Spinner } from "@/components";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#f8fafc] to-[#eef2ff] dark:from-[#071025] dark:via-[#041022] dark:to-[#011018]">
      <Spinner className="w-12 h-12" />
    </div>
  );
}