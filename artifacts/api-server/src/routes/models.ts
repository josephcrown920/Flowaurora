import { Router, type IRouter } from "express";
import { listOpenRouterFreeModels } from "../lib/openrouter";

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

router.get("/ai/models", (_req, res): void => {
  res.json({ models: OPENAI_CHAT_MODELS });
});

router.get("/openrouter/models", async (req, res): Promise<void> => {
  try {
    res.json({ models: await listOpenRouterFreeModels() });
  } catch (err) {
    req.log.error({ err }, "OpenRouter model catalog request failed");
    res.status(503).json({ error: "OpenRouter's free text model catalog is unavailable." });
  }
});

export default router;
