## 2025-02-18 - Vite Content Security Policy
**Vulnerability:** Lack of CSP in `apps/web/index.html` allows potential XSS and data exfiltration.
**Learning:** Vite development server requires `ws:` for HMR and `'unsafe-inline'` for scripts injected by plugins/client to function correctly during development.
**Prevention:** Implement a CSP that allows specific external resources (e.g., picsum.photos, fonts.googleapis.com) and necessary development protocols (`ws:`), acknowledging the trade-off of `'unsafe-inline'`.
