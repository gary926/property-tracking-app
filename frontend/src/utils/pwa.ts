// Web-only PWA setup: injects manifest + Apple meta tags and registers the
// service worker at runtime. With Expo Router `web.output: "single"` the
// static +html.tsx document is not used, so we set up installability here.
// iOS Safari reads the live DOM when "Add to Home Screen" is tapped, so
// runtime-injected tags make the app fully installable on iPhone.

export function setupPWA() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const head = document.head;
  if (!head) return;

  const addMeta = (name: string, content: string) => {
    if (document.querySelector(`meta[name="${name}"]`)) return;
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    m.setAttribute("content", content);
    head.appendChild(m);
  };

  const addLink = (rel: string, href: string, extra?: Record<string, string>) => {
    if (document.querySelector(`link[rel="${rel}"]`)) return;
    const l = document.createElement("link");
    l.setAttribute("rel", rel);
    l.setAttribute("href", href);
    if (extra) Object.entries(extra).forEach(([k, v]) => l.setAttribute(k, v));
    head.appendChild(l);
  };

  // Web app manifest (Android/Chrome + iOS 16.4+)
  addLink("manifest", "/manifest.json");

  // Theme + standalone behaviour
  addMeta("theme-color", "#000000");
  addMeta("mobile-web-app-capable", "yes");
  addMeta("application-name", "HouseHunt");

  // iOS add-to-home-screen
  addMeta("apple-mobile-web-app-capable", "yes");
  addMeta("apple-mobile-web-app-status-bar-style", "default");
  addMeta("apple-mobile-web-app-title", "HouseHunt");
  addLink("apple-touch-icon", "/apple-touch-icon.png");

  // Notch-safe viewport for standalone mode
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    vp.setAttribute(
      "content",
      "width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover",
    );
  }

  document.title = "HouseHunt — Property Tracker";

  // Register the service worker for installability + offline shell
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
