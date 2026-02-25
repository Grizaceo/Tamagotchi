# Sentinel's Journal

## 2026-02-25 - [Exposed Debug Feature in Production]
**Vulnerability:** The destructive `?reset` URL parameter was exposed in production builds, allowing any user (or attacker via a link) to wipe the game state instantly without confirmation.
**Learning:** Debug features often leak into production if not explicitly guarded. Relying on "obscurity" (e.g., specific URL params) is not security.
**Prevention:** Always wrap debug logic in `import.meta.env.DEV` (or equivalent build-time flags) to ensure it is tree-shaken out of production builds.
