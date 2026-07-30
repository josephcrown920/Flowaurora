import { Router, type IRouter } from "express";
import { db, charactersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { ProposeShotsBody, ProposeShotsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/director/propose-shots", async (req, res): Promise<void> => {
  const parsed = ProposeShotsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let openai: any;
  try {
    const mod = await import("@workspace/integrations-openai-ai-server");
    openai = mod.openai;
  } catch {
    res.status(503).json({ error: "AI provider unavailable" });
    return;
  }

  const { logline, stylePreset, sceneCount = 5, characterIds } = parsed.data;

  let characterContext = "";
  if (characterIds && characterIds.length > 0) {
    const chars = await db
      .select()
      .from(charactersTable)
      .where(inArray(charactersTable.id, characterIds));
    characterContext = chars
      .map((c) => `- ${c.name}: ${c.description}`)
      .join("\n");
  }

  const systemPrompt = `You are a professional film director and storyboard artist. 
Given a logline and optional style direction, propose a sequence of ${sceneCount} shots 
that would make a compelling visual story. Each shot should have:
- A shot type (wide, medium, close-up, extreme-close-up, over-the-shoulder, aerial)
- A camera angle description
- A detailed image generation prompt for that shot
- A brief human-readable description of what's happening in the shot

Respond ONLY with a valid JSON object: { "shots": [ { "shotType": "...", "cameraAngle": "...", "prompt": "...", "description": "..." } ] }`;

  const userMessage = [
    `Logline: ${logline}`,
    stylePreset ? `Style: ${stylePreset}` : null,
    characterContext ? `Characters:\n${characterContext}` : null,
    `Generate exactly ${sceneCount} shots.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let parsed_shots: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed_shots = JSON.parse(jsonMatch?.[0] ?? content);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    res.json(ProposeShotsResponse.parse(parsed_shots));
  } catch (err: any) {
    req.log.error({ err }, "AI propose-shots failed");
    res.status(503).json({ error: "AI provider unavailable" });
  }
});

export default router;
