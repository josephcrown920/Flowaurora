const MODELARK_API_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

export interface ModelArkModel {
  id: string;
  object?: string;
  owned_by?: string;
  [key: string]: unknown;
}

export type ModelArkCapability = "language" | "image" | "video" | "embedding" | "other";

export function modelArkCapability(modelId: string): ModelArkCapability {
  const id = modelId.toLowerCase();
  if (/seedream|seededit/.test(id)) return "image";
  if (/seedance|dreamina.*video/.test(id)) return "video";
  if (/embedding/.test(id)) return "embedding";
  if (/deepseek|skylark|kimi|seed-|glm|gpt-oss/.test(id)) return "language";
  return "other";
}

function getApiKey(): string {
  const key = process.env.ARK_API_KEY;
  if (!key) throw new Error("ModelArk is not configured");
  return key;
}

export async function modelArkRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${MODELARK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(90_000),
  });
  return response;
}

let modelCache: { expiresAt: number; models: ModelArkModel[] } | undefined;

export async function listModelArkModels(forceRefresh = false): Promise<ModelArkModel[]> {
  if (!forceRefresh && modelCache && modelCache.expiresAt > Date.now()) {
    return modelCache.models;
  }

  const response = await modelArkRequest("/models", {
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`ModelArk model list failed (${response.status})`);
  }
  const payload: unknown = await response.json();
  const models =
    payload && typeof payload === "object" && "data" in payload && Array.isArray(payload.data)
      ? (payload.data as ModelArkModel[]).filter(
          (model) => model && typeof model.id === "string" && model.id.length <= 160,
        )
      : [];
  modelCache = { models, expiresAt: Date.now() + 5 * 60_000 };
  return models;
}

export async function assertModelArkModel(
  modelId: string,
  allowedCapabilities: ModelArkCapability[],
): Promise<void> {
  if (!/^[a-zA-Z0-9._-]{1,160}$/.test(modelId)) {
    throw new Error("Invalid model id");
  }
  const models = await listModelArkModels();
  const model = models.find((candidate) => candidate.id === modelId);
  if (!model || !allowedCapabilities.includes(modelArkCapability(model.id))) {
    throw new Error("Model is unavailable for this capability");
  }
}

export async function streamModelArkChat(
  model: string,
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const response = await modelArkRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok || !response.body) {
    throw new Error(`ModelArk chat request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const consumeLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const event = JSON.parse(data);
      const content = event?.choices?.[0]?.delta?.content;
      if (typeof content === "string") onChunk(content);
      else if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part?.text === "string") onChunk(part.text);
        }
      }
    } catch {
      // Ignore malformed or non-content SSE frames.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
  }
  if (buffer.trim()) consumeLine(buffer);
}
