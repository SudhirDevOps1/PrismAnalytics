import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv } from "./env";
import { ensureD1Schema } from "./db/bootstrap";
import analytics from "./routes/analytics";
import auth from "./routes/auth";
import siteRoutes from "./routes/sites";
import track from "./routes/track";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  if (c.env.DB) {
    await ensureD1Schema(c.env.DB);
  }
  await next();
});
app.use("/api/track", cors({
  origin: "*",
  allowMethods: ["POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-Session-Id"],
  maxAge: 86400,
}));
app.use("/api/*", cors({
  origin: (origin, c) => ["/api/track", "/api/widget"].includes(c.req.path) ? "*" : (c.env.APP_URL || origin),
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

app.get("/api/widget", async (c) => {
  const siteId = c.req.query("siteId");
  if (!siteId) return c.json({ error: "siteId required" }, 400);

  const site = await c.env.DB.prepare(
    "SELECT id, name, domain FROM sites WHERE id = ? OR tracking_code = ? LIMIT 1"
  ).bind(siteId, siteId).first<{ id: string; name: string; domain: string }>();

  if (!site) return c.json({ error: "Site not found" }, 404);

  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const live = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_hash) AS count FROM pageviews WHERE site_id = ? AND timestamp >= ?"
  ).bind(site.id, fiveMinAgo).first<{ count: number }>();

  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM pageviews WHERE site_id = ?"
  ).bind(site.id).first<{ count: number }>();

  return c.json({
    siteName: site.name,
    domain: site.domain,
    liveCount: live?.count ?? 0,
    totalViews: total?.count ?? 0
  });
});

app.get("/api/health", (c) => {
  let storageStatus = "D1-only Database";
  if (c.env.FILES_BUCKET) {
    storageStatus = "Cloudflare R2 Bucket Connected";
  } else if (c.env.S3_ENDPOINT) {
    storageStatus = "Custom S3 Storage Connected";
  }

  return c.json({
    ok: true,
    service: "PrismAnalytics",
    database: "D1 ready",
    storage: storageStatus,
    privacy: "strict-hash-default",
  });
});
app.route("/api", auth);
app.route("/api", siteRoutes);
app.route("/api", track);
app.route("/api", analytics);

app.notFound(async (c) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.url);
  return c.json({ error: "Not found" }, 404);
});

app.onError((error, c) => {
  console.error("PrismAnalytics worker error", error.message);
  return c.json({ error: "Unexpected server error", message: error.message, stack: error.stack }, 500);
});

export default app;
