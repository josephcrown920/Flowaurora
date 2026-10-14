import { Router, type IRouter } from "express";
import {
  assertModelArkModel,
  listModelArkModels,
  modelArkCapability,
  modelArkRequest,
} from "../lib/modelark";
import { findModelArkMedia, imageBufferSource, storeModelArkMedia } from "../lib/modelarkMedia";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const router: IRouter = Router();

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const taskOwners = new Map<string, { ip: string; expiresAt: number; mediaUrl?: string }>();
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

async function storeProviderMedia(
  url: string,
  kind: "image" | "video",
  maxBytes: number,
): Promise<string> {
  const upstream = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(120_000),
  });
  if (!upstream.ok || !upstream.body) {
    throw new Error(`ModelArk media download failed (${upstream.status}).`);
  }
  const contentLength = Number(upstream.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await upstream.body.cancel();
    throw new Error(`ModelArk ${kind} exceeds the storage size limit.`);
  }
  return storeModelArkMedia(
    Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream),
    {
      kind,
      contentType: upstream.headers.get("content-type") ?? "",
      maxBytes,
    },
  );
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
    const providerImageUrl = safeHttpsUrl(first?.url);
    const base64Image =
      typeof first?.b64_json === "string" &&
      first.b64_json.length <= 8 * 1024 * 1024 &&
      /^[A-Za-z0-9+/]+=*$/.test(first.b64_json)
        ? Buffer.from(first.b64_json, "base64")
        : undefined;
    if (!providerImageUrl && !base64Image) {
      req.log.warn({ model }, "ModelArk image response did not contain an image");
      res.status(502).json({ error: "ModelArk returned no image. Try another model or prompt." });
      return;
    }
    const imageUrl = providerImageUrl
      ? await storeProviderMedia(providerImageUrl, "image", 20 * 1024 * 1024)
      : await storeModelArkMedia(imageBufferSource(base64Image!), {
          kind: "image",
          contentType: "image/png",
          maxBytes: 8 * 1024 * 1024,
        });
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
  if (taskOwner.mediaUrl) {
    res.json({ taskId, status: "completed", videoUrl: taskOwner.mediaUrl });
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
    const providerVideoUrl = safeHttpsUrl(rawVideoUrl);
    const videoUrl = providerVideoUrl
      ? await storeProviderMedia(providerVideoUrl, "video", 512 * 1024 * 1024)
      : undefined;
    if (videoUrl) taskOwner.mediaUrl = videoUrl;
    res.json({
      taskId,
      status: videoUrl ? "completed" : typeof task?.status === "string" ? task.status : "processing",
      videoUrl,
      error: typeof task?.error?.message === "string" ? task.error.message.slice(0, 500) : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "ModelArk video task lookup failed");
    res.status(503).json({ error: "Unable to check video generation status." });
  }
});

router.get("/modelark/media/:mediaId", async (req, res): Promise<void> => {
  try {
    const mediaId = Array.isArray(req.params.mediaId) ? req.params.mediaId[0] : req.params.mediaId;
    const file = await findModelArkMedia(mediaId);
    if (!file) {
      res.status(404).json({ error: "Generated media not found." });
      return;
    }
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", metadata.contentType ?? "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    await pipeline(file.createReadStream(), res);
  } catch (err) {
    req.log.error({ err }, "Stored ModelArk media could not be served");
    if (!res.headersSent) res.status(500).json({ error: "Generated media could not be loaded." });
    else res.destroy(err instanceof Error ? err : undefined);
  }
});

export default router;
