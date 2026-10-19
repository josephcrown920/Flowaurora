import { Router, type IRouter } from "express";
import { getOpenRouterAccessMode, listOpenRouterFreeModels } from "../lib/openrouter";
import { getOpenAIClient, getOpenAIAccessMode, type OpenAIAccessMode } from "../lib/openai";

const router: IRouter = Router();

export const OPENAI_CHAT_MODELS = [
  { id: "gpt-6-astra", name: "GPT-6 Astra" },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol" },
  { id: "gpt-6-sol", name: "GPT-6 Sol" },
  { id: "gpt-6-luna", name: "GPT-6 Luna" },
  { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
  { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
  { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
  { id: "gpt-5.4", name: "GPT-5.4" },
  { id: "gpt-5.2", name: "GPT-5.2" },
  { id: "gpt-5.1", name: "GPT-5.1" },
  { id: "gpt-5", name: "GPT-5" },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
  { id: "gpt-5-mini", name: "GPT-5 Mini" },
  { id: "gpt-5-nano", name: "GPT-5 Nano" },
  { id: "o4-mini", name: "o4 Mini" },
  { id: "o3", name: "o3" },
] as const;

let directModelCache: { expiresAt: number; models: Array<{ id: string; name: string }> } | undefined;

export async function listOpenAIChatModels(): Promise<Array<{ id: string; name: string }>> {
  const accessMode = getOpenAIAccessMode();
  if (accessMode === "unavailable") return [];
  if (accessMode === "replit") return [...OPENAI_CHAT_MODELS];
  if (directModelCache && directModelCache.expiresAt > Date.now()) return directModelCache.models;

  const { client } = await getOpenAIClient();
  const response = await client.models.list();
  const knownNames = new Map<string, string>(
    OPENAI_CHAT_MODELS.map((model): [string, string] => [model.id, model.name]),
  );
  const chatModelPattern = /^(?:gpt-[56](?:\.\d+)?(?:-[a-z0-9]+)*|o[34](?:-mini)?)$/i;
  const nonChatModelPattern = /(instruct|search|pro|codex|audio|transcrib|tts|realtime|image|embedding|moderation|whisper|speech|sora|-\d{4}-\d{2}-\d{2}$)/i;
  const models = (response.data as Array<{ id?: unknown }>)
    .map((entry) => typeof entry.id === "string" ? entry.id : "")
    .filter((id) => chatModelPattern.test(id) && !nonChatModelPattern.test(id))
    .map((id) => ({ id, name: knownNames.get(id) ?? id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  directModelCache = { models, expiresAt: Date.now() + 5 * 60_000 };
  return models;
}

router.get("/ai/models", async (req, res): Promise<void> => {
  const configuredMode: OpenAIAccessMode = getOpenAIAccessMode();
  if (configuredMode === "unavailable") {
    res.json({
      models: [],
      available: false,
      accessMode: "unavailable",
      geminiImageAvailable: Boolean(process.env.GEMINI_API_KEY?.trim()),
      mediaStorageAvailable: Boolean(process.env.PRIVATE_OBJECT_DIR?.trim()),
    });
    return;
  }

  try {
    const models = await listOpenAIChatModels();
    res.json({
      models,
      available: models.length > 0,
      accessMode: configuredMode,
      geminiImageAvailable: Boolean(process.env.GEMINI_API_KEY?.trim()),
      mediaStorageAvailable: Boolean(process.env.PRIVATE_OBJECT_DIR?.trim()),
    });
  } catch (err) {
    req.log.warn({ err }, "OpenAI model access check failed");
    res.json({
      models: [],
      available: false,
      accessMode: "unavailable",
      geminiImageAvailable: Boolean(process.env.GEMINI_API_KEY?.trim()),
      mediaStorageAvailable: Boolean(process.env.PRIVATE_OBJECT_DIR?.trim()),
    });
  }
});

router.get("/openrouter/models", async (req, res): Promise<void> => {
  try {
    res.json({
      models: await listOpenRouterFreeModels(),
      accessMode: getOpenRouterAccessMode(),
    });
  } catch (err) {
    req.log.error({ err }, "OpenRouter model catalog request failed");
    res.status(503).json({ error: "OpenRouter's free text model catalog is unavailable." });
  }
});

export default router;
