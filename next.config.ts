import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isDevelopment = process.env.NODE_ENV === "development";
const developmentEval = isDevelopment ? " 'unsafe-eval'" : "";
const httpsUpgrade = isDevelopment ? "" : "; upgrade-insecure-requests";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'${developmentEval} https://www.googletagmanager.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self' data:${httpsUpgrade}`,
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(isDevelopment
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/minpred",
  distDir: isDevelopment ? ".next-dev" : ".next",
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  serverExternalPackages: ["ssh2"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Root basePath landing page (/minpred) — prevent caching stale pre-rebuild HTML/RSC manifests
        source: "/",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      {
        // All sub-routes under basePath (/minpred/prediction, etc.) except immutable static assets
        source: "/((?!_next/static|_next/image|assets/|download/|favicon.ico).*)",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
