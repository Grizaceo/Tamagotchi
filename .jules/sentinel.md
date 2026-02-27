## 2024-05-24 - [Destructive State Reset via URL Parameter]
**Vulnerability:** The ?reset URL parameter bypassed authentication and environment checks, allowing any user (or malicious link) to wipe the victim's local storage save data in production.
**Learning:** Destructive actions and debug features must explicitly check for the development environment (`import.meta.env.DEV`) to ensure they are excluded or disabled in production builds.
**Prevention:** Audit all URL parameter reading and global state resetting mechanisms to guarantee they include an environment guard or explicit user intent validation.
