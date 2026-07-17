# 06 — Tracking Script Deep Dive

> The tracking script is **<1 kB gzipped**, no dependencies, no cookies, no fingerprinting.

## How It Works (Visual)

```
[Page Load]
   │
   ├─► sessionStorage.getItem('pa_sid') || crypto.randomUUID()
   │   └─► tab-scoped, not persistent
   │
   ├─► function track(event='pageview', data)
   │     ├─► new URLSearchParams(location.search) → UTM
   │     ├─► { site_id, pathname, referrer, screen_size,
   │     │     session_id, event_name, event_data, UTMs }
   │     └─► navigator.sendBeacon(url, JSON.stringify(body))
   │         └─► survives tab close, no CORS preflight if simple
   │
   ├─► window.prism = track  (exposed for custom events)
   │
   └─► SPA support: setInterval 500ms checks pathname change
```

## Minimal HTML Version

```html
<!-- Add once in <head> -->
<script>
(function(){
  var id='pa_xxx', url='https://your-worker.workers.dev/api/track';
  var sid=sessionStorage.getItem('pa_sid')||crypto.randomUUID();
  sessionStorage.setItem('pa_sid',sid);
  function t(e,d){
    var q=new URLSearchParams(location.search);
    navigator.sendBeacon(url,JSON.stringify({
      site_id:id,pathname:location.pathname,referrer:document.referrer,
      screen_size:screen.width+'x'+screen.height,session_id:sid,
      event_name:e||'pageview',event_data:d,
      utm_source:q.get('utm_source'),utm_medium:q.get('utm_medium'),utm_campaign:q.get('utm_campaign')
    }));
  }
  window.prism=t; t();
  var p=location.pathname;
  setInterval(function(){if(p!=location.pathname){p=location.pathname;t();}},500);
})();
</script>
```

## Custom Events

After the snippet loads, anywhere:

```js
// Button click
document.getElementById('cta').addEventListener('click', () => {
  window.prism('cta_clicked', { id: 'hero' });
});

// Purchase
window.prism('purchase_completed', { value: 99, currency: 'USD', product: 'Pro' });

// Signup
window.prism('signup_completed', { plan: 'starter' });
```

**Rules for custom data:**
- Keys: `a-zA-Z0-9_.-`, max 64 chars for event name
- Values: `string | number | boolean` only
- No PII (no emails, names) — enforced by docs + review
- JSON stringified, sliced to 4096 chars server-side

## Privacy Guarantees in Script

| Collected | How | Stored? |
|-----------|-----|---------|
| pathname | `location.pathname` | Yes |
| referrer | `document.referrer` | Yes |
| screen_size | `screen.width x height` | No (currently sent but not stored — future device stats) |
| session_id | `crypto.randomUUID()` in sessionStorage | Yes (random, not cookie) |
| UTM params | `URLSearchParams` | Yes |
| IP | `CF-Connecting-IP` header server-side | No — only SHA256(IP|UA|daily_salt) |
| User-Agent | header server-side | No — only parsed to device/browser/OS labels |

## Beacon vs Fetch & CORS Handling

### How CORS Works in PrismAnalytics

Cross-Origin Resource Sharing (CORS) is a security mechanism enforced by browsers to prevent scripts on one website from accessing data on another origin unless permitted. Since PrismAnalytics worker hosts the tracking API on your domain (e.g., `https://prismanalytics.yourdomain.workers.dev`), and receives logs from other domains (e.g., `https://my-blog.com`), CORS must be carefully configured:

1. **Simple Requests (Preflight Bypass)**:
   - The tracking snippet uses `navigator.sendBeacon` with `text/plain` headers. Browsers classify this as a "simple request", which completely **bypasses CORS OPTIONS preflight checks**. This allows instant tracking requests without waiting for preflight network round-trips.
2. **Dynamic CORS Middleware**:
   - For `/api/track` and public `/api/widget` endpoints, the Hono worker sets wildcard headers:
     ```http
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: POST, GET, OPTIONS
     ```
   - This allows any external dashboard or widget to retrieve the live visitor metrics dynamically.

---

## Web App Integration Reference

### 1. Plain HTML / Multi-Page App (MPA)
Paste the script tag directly inside your `<head>` on your layout pages:
```html
<script>
  (function(){
    var id='pa_YOUR_SITE_ID', url='https://your-worker-domain.workers.dev/api/track';
    var sid=sessionStorage.getItem('pa_sid')||crypto.randomUUID();
    sessionStorage.setItem('pa_sid',sid);
    function t(e,d){
      navigator.sendBeacon(url,JSON.stringify({
        site_id:id,pathname:location.pathname,referrer:document.referrer,
        screen_size:screen.width+'x'+screen.height,session_id:sid,
        event_name:e||'pageview',event_data:d
      }));
    }
    window.prism=t; t();
  })();
</script>
```

### 2. Single Page Apps (React / Next.js Client Side)
Wrap the tracker in a route-change observer. In React/Next.js:
```typescript
import { useEffect } from 'react';

export function usePrismAnalytics(siteId: string, workerUrl: string) {
  useEffect(() => {
    const sid = sessionStorage.getItem('pa_sid') ?? crypto.randomUUID();
    sessionStorage.setItem('pa_sid', sid);

    const track = (event = 'pageview', data?: Record<string, any>) => {
      const endpoint = `${workerUrl}/api/track`;
      navigator.sendBeacon(endpoint, JSON.stringify({
        site_id: siteId,
        pathname: window.location.pathname,
        referrer: document.referrer,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        session_id: sid,
        event_name: event,
        event_data: data
      }));
    };

    window.prism = track;
    track(); // Initial Pageview

    // Listen to route changes
    let previousPath = window.location.pathname;
    const observer = setInterval(() => {
      if (previousPath !== window.location.pathname) {
        previousPath = window.location.pathname;
        track('pageview');
      }
    }, 500);

    return () => clearInterval(observer);
  }, [siteId, workerUrl]);
}
```

---

## Verification & Debugging

1. Open **Chrome DevTools** (F12) -> Go to **Network** -> Filter by `track`.
2. Trigger a page load. You should see a `POST` request to `/api/track` with status code `200 OK`.
3. If you see a `404 Not Found` or `invalid_site` error, check if the site ID matches the tracking code listed on your PrismAnalytics admin dashboard.
