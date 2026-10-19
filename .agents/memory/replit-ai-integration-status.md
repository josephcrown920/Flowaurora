---
name: Replit AI integration status
description: A reminder that runtime environment values do not guarantee the Replit AI Integrations proxy is enabled.
---

Treat the presence of `AI_INTEGRATIONS_OPENAI_*` values as configuration hints, not proof that OpenAI requests will work. A runtime request can still fail with a proxy response saying Replit AI Integrations is not configured.

**Why:** A model-status route reported the provider as available from environment-variable presence, but a real image request returned a 404 from the proxy.

**How to apply:** Distinguish configured variables from verified provider access in status and UI messaging. Confirm successful generation or chat before reporting the provider as working.
