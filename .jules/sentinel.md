## 2025-02-18 - [Vite CSP Integration]
**Vulnerability:** Missing Content Security Policy (CSP) in `index.html`.
**Learning:** Vite requires `'unsafe-inline'` for scripts and `ws:` for connections in development mode to support HMR and client injection. A strict CSP (no unsafe-inline) requires build-time nonce generation or hash calculation, which is complex for a static site without backend integration.
**Prevention:** Always include `ws:` in `connect-src` and `'unsafe-inline'` in `script-src` for Vite apps unless a robust build process is in place to handle nonces.
