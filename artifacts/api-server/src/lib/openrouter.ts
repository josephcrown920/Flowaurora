type OpenRouterModel = {
  id: string;
  name: string;
  context_length?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
};

export type OpenRouterModelChoice = {
  id: string;
  name: string;
  contextLength?: number;
};

let modelCache: { expiresAt: number; models: OpenRouterModelChoice[] } | undefined;

export async function listOpenRouterFreeModels(forceRefresh = false): Promise<OpenRouterModelChoice[]> {
  if (!forceRefresh && modelCache && modelCache.expiresAt > Date.now()) {
    return modelCache.models;
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter model catalog request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  const entries =
    payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)
      ? (payload.data as OpenRouterModel[])
      : [];

  const models = entries
    .filter((entry) => {
      const inputs = entry.architecture?.input_modalities;
      const outputs = entry.architecture?.output_modalities;
      return (
        typeof entry.id === "string" &&
        entry.id.endsWith(":free") &&
        (!inputs || inputs.includes("text")) &&
        (!outputs || outputs.includes("text"))
      );
    })
    .map((entry) => ({
      id: entry.id,
      name: typeof entry.name === "string" && entry.name.trim() ? entry.name : entry.id,
      contextLength: Number.isFinite(entry.context_length) ? entry.context_length : undefined,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  modelCache = { models, expiresAt: Date.now() + 10 * 60_000 };
  return models;
}

export async function getOpenRouterClient(): Promise<any> {
  const replitProxyReady =
    Boolean(process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) &&
    Boolean(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY);

  // Prefer Replit-managed access while running on Replit so requests use
  // Replit billing. The direct key is the self-hosted fallback.
  if (process.env.REPL_ID && replitProxyReady) {
    const integration = await import("@workspace/integrations-openrouter-ai");
    return integration.openrouter;
  }

  if (process.env.OPENROUTER_API_KEY?.trim()) {
    const direct = await import("@workspace/integrations-openrouter-ai/direct");
    return direct.createDirectOpenRouterClient();
  }

  if (replitProxyReady) {
    const integration = await import("@workspace/integrations-openrouter-ai");
    return integration.openrouter;
  }

  throw new Error(
    process.env.REPL_ID
      ? "OpenRouter through Replit AI Integrations is not configured."
      : "OPENROUTER_API_KEY is required outside Replit.",
  );
}

export async function streamOpenRouterChat(
  client: any,
  model: string,
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = await client.chat.completions.create({
    model,
    max_tokens: 8192,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (typeof content === "string") {
      onChunk(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (typeof part?.text === "string") onChunk(part.text);
      }
    }
  }
}
