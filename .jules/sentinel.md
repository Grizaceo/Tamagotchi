## 2025-05-27 - Insecure Deserialization in Local Storage
**Vulnerability:** Game state loaded from `localStorage` was deserialized using `JSON.parse` without structural validation, allowing injection of invalid types (e.g., negative counts, non-string form names) which could lead to application crashes or logic errors.
**Learning:** Even client-side storage should be treated as untrusted user input. Assumptions about data integrity in `localStorage` are dangerous as users can modify it or share malicious save strings.
**Prevention:** Implement strict schema validation and sanitization during deserialization. Use helper functions to clamp numbers and filter arrays to expected types before using the data.
