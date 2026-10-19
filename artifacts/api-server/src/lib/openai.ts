import { Buffer } from "node:buffer";

export type OpenAIAccessMode = "replit" | "direct" | "unavailable";

export function getOpenAIAccessMode(): OpenAIAccessMode {
  if (process.env.OPENAI_API_KEY?.trim()) return "direct";

  if (
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim() &&
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim()
  ) {
    return "replit";
  }

  return "unavailable";
}

export async function getOpenAIClient(): Promise<{ client: any; accessMode: Exclude<OpenAIAccessMode, "unavailable"> }> {
  const accessMode = getOpenAIAccessMode();

  if (accessMode === "direct") {
    const direct = await import("@workspace/integrations-openai-ai-server/direct");
    return { client: direct.createDirectOpenAIClient(), accessMode };
  }

  if (accessMode === "replit") {
    const integration = await import("@workspace/integrations-openai-ai-server");
    return { client: integration.openai, accessMode };
  }

  throw new Error("Configure OPENAI_API_KEY or enable Replit AI Integrations for OpenAI.");
}

export async function generateOpenAIImageBuffer(
  prompt: string,
  size: "1024x1024" | "1536x1024" | "1024x1536" | "auto" | "512x512" | "256x256" = "1024x1024",
): Promise<Buffer> {
  const { client } = await getOpenAIClient();
  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error("OpenAI returned no image data.");
  return Buffer.from(base64, "base64");
}
