import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, charactersTable } from "@workspace/db";
import {
  ListCharactersResponse,
  CreateCharacterBody,
  CreateCharacterResponse,
  GetCharacterParams,
  GetCharacterResponse,
  UpdateCharacterParams,
  UpdateCharacterBody,
  UpdateCharacterResponse,
  DeleteCharacterParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/characters", async (req, res): Promise<void> => {
  const rows = await db.select().from(charactersTable).orderBy(charactersTable.createdAt);
  res.json(ListCharactersResponse.parse(rows));
});

router.post("/characters", async (req, res): Promise<void> => {
  const parsed = CreateCharacterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(charactersTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      wardrobe: parsed.data.wardrobe ?? "",
      referenceImageUrl: parsed.data.referenceImageUrl ?? null,
    })
    .returning();
  res.status(201).json(CreateCharacterResponse.parse(row));
});

router.get("/characters/:id", async (req, res): Promise<void> => {
  const params = GetCharacterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(GetCharacterResponse.parse(row));
});

router.patch("/characters/:id", async (req, res): Promise<void> => {
  const params = UpdateCharacterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateCharacterBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.description !== undefined) updates.description = body.data.description;
  if (body.data.wardrobe !== undefined) updates.wardrobe = body.data.wardrobe;
  if ("referenceImageUrl" in body.data) updates.referenceImageUrl = body.data.referenceImageUrl;
  const [row] = await db
    .update(charactersTable)
    .set(updates)
    .where(eq(charactersTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(UpdateCharacterResponse.parse(row));
});

router.delete("/characters/:id", async (req, res): Promise<void> => {
  const params = DeleteCharacterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await db
    .delete(charactersTable)
    .where(eq(charactersTable.id, params.data.id))
    .returning({ id: charactersTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
