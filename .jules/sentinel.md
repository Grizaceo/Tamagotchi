## 2024-05-24 - [CSRF / Destructive Action via URL]
**Vulnerability:** A `?reset` URL parameter silently deleted localStorage saved data without any confirmation or authentication, effectively functioning as a CSRF-like destructive action that could be triggered by simply tricking a user into clicking a link.
**Learning:** Destructive actions (like clearing game save state) were implemented as debug conveniences but lacked environment checks (`import.meta.env.DEV`), exposing them to production environments.
**Prevention:** All debug features and state-reset mechanisms must be guarded by environment variables (`if (import.meta.env.DEV)`) or require explicit, authenticated user interaction rather than just parsing a URL search string.
