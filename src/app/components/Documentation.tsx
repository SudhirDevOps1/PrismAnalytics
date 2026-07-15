"use client";

import { useState } from "react";
import { 
  BookOpen, Code2, ShieldCheck, Database, HelpCircle, 
  ChevronRight, Terminal, Eye, FileCode2, Link2, Key
} from "lucide-react";
import { Button } from "./ui/button";

export function Documentation() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "widgets" | "storage" | "privacy" | "faq">("quickstart");

  const sections = [
    { id: "quickstart", label: "Quickstart", icon: Code2 },
    { id: "widgets", label: "Embed Widgets", icon: Eye },
    { id: "storage", label: "Storage & R2/S3", icon: Database },
    { id: "privacy", label: "Privacy & GDPR", icon: ShieldCheck },
    { id: "faq", label: "FAQ & Troubleshoot", icon: HelpCircle },
  ] as const;

  return (
    <div className="mx-auto max-w-[1160px] space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 text-[color:var(--color-text)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[color:var(--color-text-dim)]">Knowledge Base</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-.03em]">Documentation</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">Everything you need to integrate, host, and customize PrismAnalytics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === s.id
                    ? "bg-[color:var(--color-brand-glow)] text-[color:var(--color-brand)]"
                    : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text)]"
                }`}
              >
                <Icon size={16} />
                <span>{s.label}</span>
                <ChevronRight size={14} className="ml-auto opacity-50" />
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-6 sm:p-8 space-y-6">
          {activeTab === "quickstart" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Code2 className="text-[color:var(--color-brand)]" size={20} />
                Quickstart Integration Guide
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed">
                PrismAnalytics is designed to be lightweight, cookie-free, and privacy-compliant. Setting it up takes less than 2 minutes.
              </p>

              <div className="my-6 h-px bg-[color:var(--color-border)]" />

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)]">1. Insert Snippet</h3>
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                Go to the <strong>Sites</strong> tab, create a new site domain, copy the tracking snippet, and paste it into your site's <code>&lt;head&gt;</code>.
              </p>

              <div className="rounded-xl bg-[color:var(--color-bg-elevated)] p-4 font-mono text-xs text-[color:var(--color-text-muted)] overflow-x-auto">
                {`<!-- Plain HTML Setup example -->\n<script>\n  (function(){\n    var id='pa_your_site_id', url='https://prismanalytics.yourdomain.workers.dev/api/track';\n    // ...\n  })();\n</script>`}
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)] mt-6">2. Track Custom Events</h3>
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                You can trigger custom events anywhere on your website (e.g. form submissions, button clicks, signup completions):
              </p>

              <div className="rounded-xl bg-[color:var(--color-bg-elevated)] p-4 font-mono text-xs text-[color:var(--color-text-muted)] overflow-x-auto">
                {`// Track user signup\nwindow.prism('user_signup', {\n  plan: 'Pro Plan',\n  marketingSource: 'Newsletter'\n});`}
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)] mt-6">3. Verify Your Integration</h3>
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                You can easily verify if your tracking scripts are communicating with your deployed Worker. Open the built-in <strong><a href="/playground/" target="_blank" className="text-[color:var(--color-brand)] hover:underline">Integration Playground</a></strong>, enter your Worker URL + Site ID, and click to trigger live pageviews. You will see requests record immediately!
              </p>
              
              <div className="rounded-xl border border-[color:var(--color-border)] p-4 bg-[color:var(--color-bg-elevated)] text-xs text-[color:var(--color-text-muted)]">
                📖 Source Code: <a href="https://github.com/SudhirDevOps1/PrismAnalytics.git" target="_blank" rel="noopener noreferrer" className="text-[color:var(--color-brand)] hover:underline">https://github.com/SudhirDevOps1/PrismAnalytics.git</a>
              </div>
            </div>
          )}

          {activeTab === "widgets" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye className="text-[color:var(--color-brand)]" size={20} />
                Embeddable Live Widgets
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed">
                You can display a gorgeous, pulsating live active visitors widget directly on your public website or dashboard. 
              </p>

              <div className="my-6 h-px bg-[color:var(--color-border)]" />

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)]">Setup Steps</h3>
              <ul className="list-disc pl-5 text-xs text-[color:var(--color-text-muted)] space-y-2 leading-relaxed">
                <li>Go to the <strong>Sites</strong> tab and click on the site you wish to display public stats for.</li>
                <li>Navigate to the <strong>Embed Live Widget</strong> framework tab.</li>
                <li>Copy the provided code preset and paste it into your website body where you want it to render.</li>
                <li>The widget communicates with your public worker endpoint to display real-time live visitors and total pageviews with interactive animations!</li>
              </ul>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="text-[color:var(--color-brand)]" size={20} />
                Storage & Data Archival
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed">
                PrismAnalytics is fully optimized to run 100% on Cloudflare D1 SQL. Storage configurations are entirely optional, letting you host on the free tier.
              </p>

              <div className="my-6 h-px bg-[color:var(--color-border)]" />

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)]">Option A: Native R2 Bucket</h3>
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                To archive exported files in a native Cloudflare R2 bucket, add the binding to your <code>wrangler.toml</code>:
              </p>
              <div className="rounded-xl bg-[color:var(--color-bg-elevated)] p-4 font-mono text-xs text-[color:var(--color-text-muted)]">
                {`[[r2_buckets]]\nbinding = "FILES_BUCKET"\nbucket_name = "your-bucket-name"`}
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)] mt-6">Option B: External S3-Compatible Storage</h3>
              <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                Alternatively, bind any S3-compatible service (Backblaze B2, Wasabi, Storj, AWS S3) by adding the endpoints to your Environment Variables on Cloudflare:
              </p>
              <ul className="list-disc pl-5 text-xs text-[color:var(--color-text-muted)] space-y-1">
                <li><code>S3_ENDPOINT</code>: e.g. https://s3.us-west-002.backblazeb2.com</li>
                <li><code>S3_ACCESS_KEY_ID</code>: API access identifier</li>
                <li><code>S3_SECRET_ACCESS_KEY</code>: Secret access token</li>
                <li><code>S3_BUCKET_NAME</code>: Target bucket</li>
              </ul>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="text-[color:var(--color-brand)]" size={20} />
                Privacy Model & GDPR Compliance
              </h2>
              <p className="text-sm text-[color:var(--color-text-muted)] leading-relaxed">
                PrismAnalytics is engineered from the ground up to respect user privacy and adhere strictly to GDPR, CCPA, and PECR guidelines.
              </p>

              <div className="my-6 h-px bg-[color:var(--color-border)]" />

              <h3 className="text-sm font-bold uppercase tracking-wider text-[color:var(--color-brand)]">How it Works</h3>
              <ul className="list-disc pl-5 text-xs text-[color:var(--color-text-muted)] space-y-2 leading-relaxed">
                <li><strong>No Cookies:</strong> The tracking script stores zero cookies or persistent local state on the visitor's device.</li>
                <li><strong>Hashed Identity:</strong> Raw IP Addresses and User Agents are processed in transient memory only, hashed using a daily rotating salt, and discarded instantly.</li>
                <li><strong>No Cross-Site Tracking:</strong> Because salts rotate daily, a visitor's hashed identity cannot be linked or correlated across multiple days or multiple websites.</li>
                <li><strong>DNT Respect:</strong> Respects the "Do Not Track" browser preference automatically if configured.</li>
              </ul>
            </div>
          )}

          {activeTab === "faq" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="text-[color:var(--color-brand)]" size={20} />
                FAQ & Troubleshooting
              </h2>

              <div className="my-6 h-px bg-[color:var(--color-border)]" />

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[color:var(--color-brand)]">Q: Why do I get SSL Bad Record MAC errors during Git Push?</h4>
                  <p className="mt-1 text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                    This is an OpenSSL network compatibility bug in native Windows clients. Solve it globally in your terminal using:
                    <code className="block mt-2 rounded bg-[color:var(--color-bg-elevated)] p-2 font-mono text-[10px]">git config --global http.sslBackend schannel</code>
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[color:var(--color-brand)]">Q: How do I resolve CPU Limit worker deployment failures?</h4>
                  <p className="mt-1 text-xs text-[color:var(--color-text-muted)] leading-relaxed">
                    Setting custom CPU limits requires a paid Cloudflare plan. We have removed the <code>[limits]</code> block from <code>wrangler.toml</code> to allow direct deployment on the Free tier.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
