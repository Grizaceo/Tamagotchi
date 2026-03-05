## 2024-05-30 - [URL Parameter State Deletion]
**Vulnerability:** The `loadState` function allowed unauthenticated GET requests (via `?reset` URL parameter) to wipe the user's `localStorage` data, creating a CSRF/DoS vulnerability for local state.
**Learning:** Development and debug features tied to URL parameters are often left in production builds, exposing administrative or destructive actions to end users.
**Prevention:** Always guard development-only features and URL parameter handlers with environment checks (e.g., `import.meta.env.DEV`) to ensure they are stripped during production builds.
