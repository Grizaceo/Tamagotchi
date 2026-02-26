# Sentinel's Security Journal

This file contains critical security learnings and patterns for the Pompom Tama project.

## 2025-05-27 - Protective Guard on Destructive Actions
**Vulnerability:** The application allowed a full state reset via a simple URL parameter (`?reset`) in production. This could lead to accidental data loss if a user clicked a malicious or shared link.
**Learning:** URL parameters for destructive actions are convenient for development but dangerous in production if not guarded.
**Prevention:** Always wrap debug/development-only features (especially those that modify state) with environment checks like `import.meta.env.DEV`.
