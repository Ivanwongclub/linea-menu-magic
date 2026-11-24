// Development/static-hosting fallback. Docker replaces this file at startup.
// If loading this script fails, index.html's invalid sentinel prevents stale
// build-time configuration from being used silently.
if (
  window.__WINCYC_PUBLIC_CONFIG__ &&
  typeof window.__WINCYC_PUBLIC_CONFIG__ === "object" &&
  !Array.isArray(window.__WINCYC_PUBLIC_CONFIG__) &&
  Object.keys(window.__WINCYC_PUBLIC_CONFIG__).length === 0
) {
  window.__WINCYC_PUBLIC_CONFIG__ = undefined;
}
