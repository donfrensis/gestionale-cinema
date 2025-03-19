import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// @ts-check
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // Opzioni per la cache
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  // Fallback per la pagina offline
  fallbacks: {
    document: '/offline.html'
  },
  // Opzioni di Workbox
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Escludi file problematici
    exclude: [
      /chunks\/app\/dashboard\/@modal/,
      /app-build-manifest\.json$/
    ]
  }
})(nextConfig);