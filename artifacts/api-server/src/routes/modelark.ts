import { Router, type IRouter } from "express";
import {
  assertModelArkModel,
  listModelArkModels,
  modelArkCapability,
  modelArkRequest,
} from "../lib/modelark";

const router: IRouter = Router();

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const taskOwners = new Map<string, { ip: string; expiresAt: number }>();
const paidRouteLimit = (req: any, res: any, next: any): void => {
  const now = Date.now();
  if (requestCounts.size > 2_000) {
    for (const [ip, entry] of requestCounts) {
      if (entry.resetAt <= now) requestCounts.delete(ip);
    }
  }
  const key = req.ip ?? "unknown";
  const entry = requestCounts.get(key);
  if (!entry || entry.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }
  if (entry.count >= 8) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    res.status(429).json({ error: "Too many generation requests. Please wait a minute." });
    return;
  }
  entry.count += 1;
  next();
};

function readString(value: unknown, maxLength: number): string | undefined {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : undefined;
}

function modelarkErrorMessage(status: number): string {
  if (status === 401 || status === 403) return "ModelArk rejected the configured credentials.";
  if (status === 429) return "ModelArk is rate limiting requests. Try again shortly.";
  return `ModelArk request failed (${status}).`;
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 4_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

router.get("/modelark/models", async (req, res): Promise<void> => {
  try {
    const models = await listModelArkModels();
    res.json({
      models: models.map(({ id, object, owned_by }) => ({
        id,
        object,
        owned_by,
        capability: modelArkCapability(id),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "ModelArk model catalog request failed");
    res.status(503).json({ error: "ModelArk model catalog is unavailable." });
  }
});

router.post("/modelark/images/generations", paidRouteLimit, async (req, res): Promise<void> => {
  const model = readString(req.body?.model, 160);
  const prompt = readString(req.body?.prompt, 8_000);
  if (!model || !prompt) {
    res.status(400).json({ error: "A model and prompt (up to 8,000 characters) are required." });
    return;
  }

  try {
    await assertModelArkModel(model, ["image"]);
    const upstream = await modelArkRequest("/images/generations", {
      method: "POST",
      body: JSON.stringify({ model, prompt }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!upstream.ok) {
      req.log.warn({ status: upstream.status, model }, "ModelArk image generation rejected");
      res.status(upstream.status === 429 ? 429 : 502).json({ error: modelarkErrorMessage(upstream.status) });
      return;
    }
    const payload: any = await upstream.json();
    const first = Array.isArray(payload?.data) ? payload.data[0] : undefined;
    const imageUrl =
      safeHttpsUrl(first?.url) ??
      (typeof first?.b64_json === "string" &&
      first.b64_json.length <= 8 * 1024 * 1024 &&
      /^[A-Za-z0-9+/]+=*$/.test(first.b64_json)
        ? `data:image/png;base64,${first.b64_json}`
        : undefined);
    if (!imageUrl) {
      req.log.warn({ model }, "ModelArk image response did not contain an image");
      res.status(502).json({ error: "ModelArk returned no image. Try another model or prompt." });
      return;
    }
    res.json({ imageUrl, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Invalid model id" || message === "Model is unavailable for this capability") {
      res.status(400).json({ error: message });
      return;
    }
    req.log.error({ err, model }, "ModelArk image generation failed");
    res.status(503).json({ error: "Image generation is temporarily unavailable." });
  }
});

router.post("/modelark/videos/tasks", paidRouteLimit, async (req, res): Promise<void> => {
  const model = readString(req.body?.model, 160);
  const prompt = readString(req.body?.prompt, 8_000);
  if (!model || !prompt) {
    res.status(400).json({ error: "A model and prompt (up to 8,000 characters) are required." });
    return;
  }

  try {
    await assertModelArkModel(model, ["video"]);
    const upstream = await modelArkRequest("/contents/generations/tasks", {
      method: "POST",
      body: JSON.stringify({
        model,
        content: [{ type: "text", text: prompt }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok) {
      req.log.warn({ status: upstream.status, model }, "ModelArk video task rejected");
      res.status(upstream.status === 429 ? 429 : 502).json({ error: modelarkErrorMessage(upstream.status) });
      return;
    }
    const payload: any = await upstream.json();
    const taskId = payload?.id ?? payload?.task_id;
    if (typeof taskId !== "string" || taskId.length > 200) {
      req.log.warn({ model }, "ModelArk video response did not contain a task id");
      res.status(502).json({ error: "ModelArk did not return a video task id." });
      return;
    }
    taskOwners.set(taskId, { ip: req.ip ?? "unknown", expiresAt: Date.now() + 30 * 60_000 });
    res.status(202).json({ taskId, status: payload?.status ?? "queued" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Invalid model id" || message === "Model is unavailable for this capability") {
      res.status(400).json({ error: message });
      return;
    }
    req.log.error({ err, model }, "ModelArk video task creation failed");
    res.status(503).json({ error: "Video generation is temporarily unavailable." });
  }
});

router.get("/modelark/videos/tasks/:taskId", async (req, res): Promise<void> => {
  const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
  if (!/^[a-zA-Z0-9._:-]{1,200}$/.test(taskId)) {
    res.status(400).json({ error: "Invalid video task id." });
    return;
  }
  const taskOwner = taskOwners.get(taskId);
  if (!taskOwner || taskOwner.expiresAt <= Date.now()) {
    taskOwners.delete(taskId);
    res.status(404).json({ error: "Video task not found." });
    return;
  }
  if (taskOwner.ip !== (req.ip ?? "unknown")) {
    res.status(403).json({ error: "This video task belongs to another session." });
    return;
  }
  try {
    const upstream = await modelArkRequest(`/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) {
      req.log.warn({ status: upstream.status }, "ModelArk video task lookup failed");
      res.status(upstream.status === 404 ? 404 : 502).json({ error: modelarkErrorMessage(upstream.status) });
      return;
    }
    const task: any = await upstream.json();
    const rawVideoUrl =
      task?.content?.video_url ??
      task?.result?.video_url ??
      task?.output?.video_url ??
      task?.video_url ??
      task?.output?.[0]?.url;
    res.json({
      taskId,
      status: typeof task?.status === "string" ? task.status : "processing",
      videoUrl: safeHttpsUrl(rawVideoUrl),
      error: typeof task?.error?.message === "string" ? task.error.message.slice(0, 500) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "ModelArk video task lookup failed");
    res.status(503).json({ error: "Unable to check video generation status." });
  }
});

export default router;
