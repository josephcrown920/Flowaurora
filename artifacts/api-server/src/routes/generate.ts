import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, charactersTable, shotsTable, shotCharactersTable } from "@workspace/db";
import {
  GenerateCharacterPortraitBody,
  GenerateCharacterPortraitResponse,
  GenerateShotImageBody,
  GenerateShotImageResponse,
  GenerateShotAngleBody,
  GenerateShotAngleResponse,
} from "@workspace/api-zod";
import { asc } from "drizzle-orm";
import { imageBufferSource, storeModelArkMedia } from "../lib/modelarkMedia";
import { generateOpenAIImageBuffer } from "../lib/openai";

const router: IRouter = Router();

const GEMINI_IMAGE_MODELS = new Set([
  "gemini-nano-banana-2.1",
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
]);

async function generateGeminiImage(model: string, prompt: string): Promise<{ buffer: Buffer; contentType: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!response.ok) {
    const error = new Error(`Gemini image generation request failed (${response.status}).`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const payload = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
        }>;
      };
    }>;
  };
  const imagePart = payload.candidates?.[0]?.content?.parts?.find(
    (part) => typeof part.inlineData?.data === "string",
  )?.inlineData;
  if (!imagePart?.data) throw new Error("Gemini returned no image data.");

  return {
    buffer: Buffer.from(imagePart.data, "base64"),
    contentType: imagePart.mimeType || "image/png",
  };
}

function bufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

router.post("/generate/canvas-image", async (req, res): Promise<void> => {
  const model = typeof req.body?.model === "string" ? req.body.model : "";
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt || prompt.length > 8_000 || (model !== "gpt-image-1" && !GEMINI_IMAGE_MODELS.has(model))) {
    res.status(400).json({ error: "Select a supported image model and provide a prompt up to 8,000 characters." });
    return;
  }

  if (!process.env.PRIVATE_OBJECT_DIR?.trim()) {
    res.status(503).json({ error: "Generated media storage is not available in this runtime." });
    return;
  }

  try {
    let buffer: Buffer;
    let contentType = "image/png";
    if (model === "gpt-image-1") {
      buffer = await generateOpenAIImageBuffer(prompt, "1024x1024");
    } else {
      const generated = await generateGeminiImage(model, prompt);
      buffer = generated.buffer;
      contentType = generated.contentType;
    }

    const imageUrl = await storeModelArkMedia(imageBufferSource(buffer), {
      kind: "image",
      contentType,
      maxBytes: 20 * 1024 * 1024,
    });
    res.json({ imageUrl, model });
  } catch (err) {
    const status = typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status?: unknown }).status)
      : undefined;
    req.log.error(
      { model, error: err instanceof Error ? err.message : "Unknown generation error" },
      "Canvas image generation failed",
    );
    res.status(503).json({
      error: model === "gpt-image-1"
        ? "OpenAI image generation or media storage is unavailable. Check the OpenAI key and account access."
        : status === 429
          ? "Google is temporarily rate-limiting this Gemini image model. Try a different Gemini model or retry later."
        : "Gemini image generation or media storage is unavailable.",
    });
  }
});

router.post("/generate/character-portrait", async (req, res): Promise<void> => {
  const parsed = GenerateCharacterPortraitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [character] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, parsed.data.characterId));
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const prompt = [
    `Professional character reference portrait of ${character.name}.`,
    character.description ? `Appearance: ${character.description}.` : null,
    character.wardrobe ? `Wearing: ${character.wardrobe}.` : null,
    "Clean studio background, full face visible, high quality, photorealistic.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const buffer = await generateOpenAIImageBuffer(prompt, "1024x1024");
    const dataUrl = bufferToDataUrl(buffer);
    const [updated] = await db
      .update(charactersTable)
      .set({ referenceImageUrl: dataUrl })
      .where(eq(charactersTable.id, character.id))
      .returning();
    res.json(GenerateCharacterPortraitResponse.parse(updated));
  } catch (err: any) {
    req.log.error({ err }, "Character portrait generation failed");
    res.status(503).json({ error: "AI provider unavailable" });
  }
});

router.post("/generate/shot-image", async (req, res): Promise<void> => {
  const parsed = GenerateShotImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [shot] = await db.select().from(shotsTable).where(eq(shotsTable.id, parsed.data.shotId));
  if (!shot) {
    res.status(404).json({ error: "Shot not found" });
    return;
  }

  // Get associated characters
  const charLinks = await db
    .select({ characterId: shotCharactersTable.characterId })
    .from(shotCharactersTable)
    .where(eq(shotCharactersTable.shotId, shot.id));
  const chars = charLinks.length > 0
    ? await db.select().from(charactersTable).where(
        eq(charactersTable.id, charLinks[0].characterId)
      )
    : [];

  const characterContext = chars.map((c) => `${c.name} (${c.description})`).join(", ");

  const prompt = [
    shot.prompt,
    shot.shotType ? `Shot type: ${shot.shotType}.` : null,
    shot.cameraAngle ? `Camera: ${shot.cameraAngle}.` : null,
    characterContext ? `Characters: ${characterContext}.` : null,
    shot.colorGrade && shot.colorGrade !== "none" ? `Color grade: ${shot.colorGrade}.` : null,
    "Cinematic storyboard frame, high quality.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    // Mark as generating
    await db.update(shotsTable).set({ status: "generating" }).where(eq(shotsTable.id, shot.id));
    const buffer = await generateOpenAIImageBuffer(prompt, "1536x1024");
    const dataUrl = bufferToDataUrl(buffer);
    const [updated] = await db
      .update(shotsTable)
      .set({ imageUrl: dataUrl, status: "ready" })
      .where(eq(shotsTable.id, shot.id))
      .returning();
    const links = await db
      .select({ characterId: shotCharactersTable.characterId })
      .from(shotCharactersTable)
      .where(eq(shotCharactersTable.shotId, updated.id));
    res.json(GenerateShotImageResponse.parse({ ...updated, characterIds: links.map((l) => l.characterId) }));
  } catch (err: any) {
    await db.update(shotsTable).set({ status: "draft" }).where(eq(shotsTable.id, shot.id));
    req.log.error({ err }, "Shot image generation failed");
    res.status(503).json({ error: "AI provider unavailable" });
  }
});

router.post("/generate/shot-angle", async (req, res): Promise<void> => {
  const parsed = GenerateShotAngleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [originalShot] = await db.select().from(shotsTable).where(eq(shotsTable.id, parsed.data.shotId));
  if (!originalShot) {
    res.status(404).json({ error: "Shot not found" });
    return;
  }

  // Get highest position in project
  const sibling = await db
    .select({ position: shotsTable.position })
    .from(shotsTable)
    .where(eq(shotsTable.projectId, originalShot.projectId))
    .orderBy(asc(shotsTable.position));
  const nextPosition = sibling.length > 0 ? sibling[sibling.length - 1].position + 1 : 0;

  const prompt = [
    originalShot.prompt,
    `Reframed as: ${parsed.data.angleLabel}.`,
    originalShot.colorGrade !== "none" ? `Color grade: ${originalShot.colorGrade}.` : null,
    "Cinematic storyboard frame.",
  ]
    .filter(Boolean)
    .join(" ");

  const [newShot] = await db
    .insert(shotsTable)
    .values({
      projectId: originalShot.projectId,
      shotType: originalShot.shotType as any,
      cameraAngle: parsed.data.angleLabel,
      prompt: originalShot.prompt,
      colorGrade: originalShot.colorGrade,
      position: nextPosition,
      parentShotId: originalShot.id,
      status: "generating",
    })
    .returning();

  // Copy character associations
  const charLinks = await db
    .select({ characterId: shotCharactersTable.characterId })
    .from(shotCharactersTable)
    .where(eq(shotCharactersTable.shotId, originalShot.id));
  if (charLinks.length > 0) {
    await db.insert(shotCharactersTable).values(
      charLinks.map((l) => ({ shotId: newShot.id, characterId: l.characterId }))
    );
  }

  try {
    const buffer = await generateOpenAIImageBuffer(prompt, "1536x1024");
    const dataUrl = bufferToDataUrl(buffer);
    const [updated] = await db
      .update(shotsTable)
      .set({ imageUrl: dataUrl, status: "ready" })
      .where(eq(shotsTable.id, newShot.id))
      .returning();
    const links = await db
      .select({ characterId: shotCharactersTable.characterId })
      .from(shotCharactersTable)
      .where(eq(shotCharactersTable.shotId, updated.id));
    res.status(201).json(GenerateShotAngleResponse.parse({ ...updated, characterIds: links.map((l) => l.characterId) }));
  } catch (err: any) {
    await db.update(shotsTable).set({ status: "draft" }).where(eq(shotsTable.id, newShot.id));
    req.log.error({ err }, "Shot angle generation failed");
    res.status(503).json({ error: "AI provider unavailable" });
  }
});

export default router;
