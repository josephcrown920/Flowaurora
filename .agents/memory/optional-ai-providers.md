---
name: Optional AI providers
description: Keep missing AI provider configuration from taking down unrelated API routes.
---

Load AI provider clients only when a request selects that provider. A provider with missing runtime settings should fail only on its own request; health checks and unrelated API routes should remain available.

**Why:** The Anthropic client validates environment variables at module import time, which prevented the Flows API and preview from starting when those settings were unavailable to the service.

**How to apply:** Avoid top-level imports for optional provider clients that eagerly validate runtime configuration. Keep provider-specific errors inside the selected provider's request path.
