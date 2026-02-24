# Sentinel Journal

## 2025-02-18 - Unprotected Debug URL Parameters
**Vulnerability:** Found a `?reset` URL parameter in `GameLoop.ts` that allowed wiping local storage without authentication or confirmation, active in production.
**Learning:** Debug conveniences can become production backdoors if not properly gated.
**Prevention:** Wrap all debug-only logic (especially destructive ones) in `if (import.meta.env.DEV) { ... }` so it is stripped from production builds.
