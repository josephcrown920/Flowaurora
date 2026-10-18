import { Router, type IRouter } from "express";
import { db, charactersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { ProposeShotsBody, ProposeShotsResponse } from "@workspace/api-zod";
import { formatAvailableNodeTypes } from "@workspace/flow-nodes";
import { assertModelArkModel, streamModelArkChat } from "../lib/modelark";

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

// ── Director Orchestrate ─────────────────────────────────────────────────────
// Takes a plain-English description and returns React Flow nodes + edges.

const ORCHESTRATE_SYSTEM = `You are a visual AI workflow architect for a video/image generation tool called Flows.
Users describe what they want to create and you design the optimal node-based workflow.

AVAILABLE NODE TYPES (use exact type name):
${formatAvailableNodeTypes()}

LAYOUT RULES:
- Arrange nodes left-to-right in flow order
- Horizontal spacing: ~360px between connected nodes
- Vertical spacing: ~220px between parallel branches
- Start first node at x:100, centre the group around y:300
- Use 3–7 nodes for most workflows; only go larger for explicit batch workflows

EXTENDING AN EXISTING WORKFLOW:
When the user provides a list of existing canvas nodes (id, type, position) under "Existing canvas nodes:",
you are designing ONLY the NEW nodes and edges to add to that canvas. Rules:
- Do NOT recreate nodes that already exist unless explicitly asked.
- To connect a new node to an existing one, use the existing node's actual "id" value as the edge source or target.
  Example: if the existing list contains {"id":"agent-1234-ltx-1","type":"LTXProNode","position":{"x":500,"y":300}},
  you can write {"source":"agent-1234-ltx-1","target":"n1"} to connect from it to your new node "n1".
- When multiple nodes of the same type exist, connect to the one with the highest x position (rightmost).
- Position your new nodes to the right of the rightmost existing node. Add at least 400px to its x value.
- Output ONLY the new nodes and edges. Do not output the existing nodes again.
- The explanation should describe what you are adding, not the entire workflow.

OUTPUT FORMAT (return ONLY valid JSON, no markdown fences):
{
  "explanation": "One sentence describing the workflow",
  "nodes": [
    { "id": "n1", "type": "NodeTypeName", "position": { "x": 100, "y": 300 }, "data": {} }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "animated": true }
  ]
}`;

router.post("/director/orchestrate", async (req, res): Promise<void> => {
  const description =
    typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const provider = req.body?.provider === "modelark" ? "modelark" : "claude";
  const model = typeof req.body?.model === "string" ? req.body.model : "";
  const rawNodes = req.body?.currentNodes;
  if (!description || description.length > 4_000) {
    res.status(400).json({ error: "Description must be between 1 and 4,000 characters." });
    return;
  }
  if (rawNodes !== undefined && !Array.isArray(rawNodes)) {
    res.status(400).json({ error: "currentNodes must be an array." });
    return;
  }
  if (Array.isArray(rawNodes) && rawNodes.length > 100) {
    res.status(400).json({ error: "A maximum of 100 existing nodes can be included." });
    return;
  }
  const currentNodes = (rawNodes ?? []).filter((node: any) =>
    node &&
    typeof node.id === "string" &&
    node.id.length <= 120 &&
    typeof node.type === "string" &&
    node.type.length <= 80 &&
    Number.isFinite(node.position?.x) &&
    Number.isFinite(node.position?.y),
  ) as Array<{ id: string; type: string; position: { x: number; y: number } }>;
  if (provider === "modelark") {
    if (!model || model.length > 160) {
      res.status(400).json({ error: "Select a ModelArk language model." });
      return;
    }
    try {
      await assertModelArkModel(model, ["language"]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "Invalid model id" || message === "Model is unavailable for this capability") {
        res.status(400).json({ error: message });
        return;
      }
      req.log.error({ err }, "ModelArk model validation failed");
      res.status(503).json({ error: "ModelArk model catalog is unavailable." });
      return;
    }
  }

  const hasExisting = currentNodes.length > 0;

  const userContent = hasExisting
    ? `Existing canvas nodes:\n${currentNodes
        .map((n) => `  {"id":"${n.id}","type":"${n.type}","position":{"x":${n.position.x},"y":${n.position.y}}}`)
        .join("\n")}\n\nExtend or modify the workflow for: ${description.trim()}`
    : `Design a workflow for: ${description.trim()}`;

  // Set up SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: unknown) => {
    if (res.destroyed || res.writableEnded) return;
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      req.log.warn({ err }, "director/orchestrate could not write an SSE event");
    }
  };

  try {
    let accumulated = "";
    if (provider === "modelark") {
      await streamModelArkChat(model, ORCHESTRATE_SYSTEM, userContent, (chunk) => {
        accumulated += chunk;
        sendEvent({ type: "chunk", text: chunk });
      });
    } else {
      const { anthropic } = await import("@workspace/integrations-anthropic-ai");
      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: ORCHESTRATE_SYSTEM,
        messages: [{ role: "user", content: userContent }],
      });
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const chunk = event.delta.text;
          accumulated += chunk;
          sendEvent({ type: "chunk", text: chunk });
        }
      }
    }

    // Parse and send the final structured result
    try {
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      const workflow = JSON.parse(jsonMatch?.[0] ?? accumulated);
      sendEvent({ type: "done", workflow });
    } catch {
      sendEvent({ type: "error", error: "AI returned invalid JSON" });
    }
  } catch (err: any) {
    req.log.error({ err }, "director/orchestrate failed");
    sendEvent({ type: "error", error: "AI provider unavailable" });
  } finally {
    res.end();
  }
});

export default router;
