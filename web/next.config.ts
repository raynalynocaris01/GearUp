import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gearup/shared"],
  // Allow cross-origin HMR / dev resources when the phone hits the LAN IP.
  // Without this, the page loads but React hydration can fail on mobile.
  allowedDevOrigins: [
    "172.25.131.49",
    "172.25.131.49:3000",
    "10.23.136.49",
    "10.23.136.49:3000",
    "localhost",
    "localhost:3000",
    "10.137.45.49",
    "10.137.45.49:3000",
    "10.0.18.161",
    "10.0.18.161:3000",
    "192.168.0.102",
    "192.168.0.102:3000",
    "192.168.0.103",
    "192.168.0.103:3000"
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.102',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.103',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;