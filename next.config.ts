import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// @ts-check
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // output standalone: serve alla build dell'immagine Docker di produzione (13b),
  // produce in .next/standalone un server Node autosufficiente da copiare nel runner.
  output: "standalone",
  // next-pwa (@ducanh2912/next-pwa) inietta un plugin webpack: la build di produzione
  // usa --webpack (vedi package.json); questa chiave silenzia solo il warning di
  // next dev, che usa comunque Turbopack (PWA è disabilitato in dev).
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.mymovies.it' },
      { protocol: 'http', hostname: 'bol.gostec.it' },
    ],
  },
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
      /app-build-manifest\.json$/,
      /programmazione/,
    ]
  }
})(nextConfig);