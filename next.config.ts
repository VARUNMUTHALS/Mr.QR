import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "3000-" + (process.env.BASE44_PUBLIC_HOST_SUFFIX || "localhost"),
  ],
};

export default nextConfig;
