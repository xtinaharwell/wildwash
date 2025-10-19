import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ✅ Existing config options */
  reactStrictMode: true,

  /* ✅ Future-proof for Next.js CORS policy (cross-origin dev environments) */
  experimental: {
    allowedDevOrigins: [
      "https://3000-firebase-wildwashgit-1760698481871.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev",
      "http://localhost:3000",
      "https://wildwosh.kibeezy.com",
    ],
  },

  /* ✅ Optional: helpful for static assets or API endpoints */
  images: {
    domains: ["wildwosh.kibeezy.com"],
  },
};

export default nextConfig;
