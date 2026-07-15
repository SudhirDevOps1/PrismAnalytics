/**
 * PrismAnalytics - Version & Build Info
 * Single source of truth for app version.
 */

export const VERSION = "1.1.0";
export const VERSION_NAME = "Prism — Prism Refraction";
export const BUILD_DATE = "2026-07-15";
export const BUILD_CHANNEL = "stable"; // stable | beta | canary

export const CHANGELOG = [
  {
    version: "1.1.0",
    name: "Prism Refraction",
    date: "2026-07-15",
    highlights: [
      "Custom 3D SVG PrismLogo component & PNG brand assets",
      "Interactive local Quickstart and integrations Documentation dashboard view",
      "Interactive Integration Testing Playground served under /playground/",
      "S3/R2 Cloud Storage connection indicator status in settings",
      "Responsive sidebar with vertical scroll support to prevent clipping on short/zoomed screens",
      "Responsive site settings action buttons wrapping and grids to fix horizontal desktop/mobile overflow",
      "Embeddable live stats animated count widget with custom client-side pulse script",
      "Fixed Next.js compile-time lazy connection and Hono response immutable headers bug",
    ],
  },
  {
    version: "1.0.0",
    name: "First Light",
    date: "2026-07-10",
    highlights: [
      "Privacy-first analytics with no cookies, no IP storage",
      "Multi-tenant with strict isolation",
      "12 framework tracking snippets (HTML, React, Next.js, Vue, Nuxt, Angular, Svelte, GTM, WordPress, Shopify, Webflow, Wix)",
      "Real-time live visitors (10s polling)",
      "World map visualization with 60+ countries",
      "MX/DNS email verification & disposable blocking",
      "Database-backed rate limiting & account lockout",
      "PBKDF2-SHA256 password hashing with timing-safe compare",
      "JWT + session revocation + audit logging",
      "CSV/JSON export + cascade deletion",
      "Dark theme (default), fully responsive",
    ],
  },
];

export function getVersionInfo() {
  return {
    version: VERSION,
    name: VERSION_NAME,
    buildDate: BUILD_DATE,
    channel: BUILD_CHANNEL,
    apiVersion: "v1",
    compatibility: {
      node: ">=18.0.0",
      cloudflare: "workers",
    },
  };
}
