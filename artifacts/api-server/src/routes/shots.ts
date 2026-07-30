import { Router, type IRouter } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, shotsTable, shotCharactersTable } from "@workspace/db";
import {
  ListProjectShotsParams,
  ListProjectShotsResponse,
  CreateShotParams,
  CreateShotBody,
  CreateShotResponse,
  ListShotsQueryParams,
  ListShotsResponse,
  GetShotParams,
  GetShotResponse,
  UpdateShotParams,
  UpdateShotBody,
  UpdateShotResponse,
  DeleteShotParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function attachCharacterIds(shot: typeof shotsTable.$inferSelect) {
  const links = await db
    .select({ characterId: shotCharactersTable.characterId })
    .from(shotCharactersTable)
    .where(eq(shotCharactersTable.shotId, shot.id));
  return { ...shot, characterIds: links.map((l) => l.characterId) };
}

router.get("/projects/:id/shots", async (req, res): Promise<void> => {
  const params = ListProjectShotsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(shotsTable)
    .where(eq(shotsTable.projectId, params.data.id))
    .orderBy(asc(shotsTable.position));
  const withChars = await Promise.all(rows.map(attachCharacterIds));
  res.json(ListProjectShotsResponse.parse(withChars));
});

router.post("/projects/:id/shots", async (req, res): Promise<void> => {
  const params = CreateShotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateShotBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Auto-assign position as next slot
  const existing = await db
    .select({ position: shotsTable.position })
    .from(shotsTable)
    .where(eq(shotsTable.projectId, params.data.id))
    .orderBy(asc(shotsTable.position));
  const nextPosition = body.data.position ?? (existing.length > 0 ? existing[existing.length - 1].position + 1 : 0);

  const [row] = await db
    .insert(shotsTable)
    .values({
      projectId: params.data.id,
      shotType: (body.data.shotType ?? "medium") as any,
      cameraAngle: body.data.cameraAngle ?? "eye-level",
      prompt: body.data.prompt ?? "",
      position: nextPosition,
    })
    .returning();

  if (body.data.characterIds && body.data.characterIds.length > 0) {
    await db.insert(shotCharactersTable).values(
      body.data.characterIds.map((cid) => ({ shotId: row.id, characterId: cid }))
    );
  }

  const withChars = await attachCharacterIds(row);
  res.status(201).json(CreateShotResponse.parse(withChars));
});

router.get("/shots", async (req, res): Promise<void> => {
  const queryParams = ListShotsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }
  const conditions = [];
  if (queryParams.data.projectId) conditions.push(eq(shotsTable.projectId, queryParams.data.projectId));
  if (queryParams.data.hasMedia === true) {
    // Filter shots that have an imageUrl or videoUrl
    const { sql: sqlExpr } = await import("drizzle-orm");
    conditions.push(sqlExpr`(${shotsTable.imageUrl} IS NOT NULL OR ${shotsTable.videoUrl} IS NOT NULL)`);
  }
  const rows = conditions.length > 0
    ? await db.select().from(shotsTable).where(and(...conditions)).orderBy(asc(shotsTable.position))
    : await db.select().from(shotsTable).orderBy(asc(shotsTable.position));

  let filtered = rows;
  if (queryParams.data.characterId) {
    const cid = queryParams.data.characterId;
    const links = await db
      .select({ shotId: shotCharactersTable.shotId })
      .from(shotCharactersTable)
      .where(eq(shotCharactersTable.characterId, cid));
    const shotIds = new Set(links.map((l) => l.shotId));
    filtered = rows.filter((r) => shotIds.has(r.id));
  }

  const withChars = await Promise.all(filtered.map(attachCharacterIds));
  res.json(ListShotsResponse.parse(withChars));
});

router.get("/shots/:id", async (req, res): Promise<void> => {
  const params = GetShotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(shotsTable).where(eq(shotsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const withChars = await attachCharacterIds(row);
  res.json(GetShotResponse.parse(withChars));
});

router.patch("/shots/:id", async (req, res): Promise<void> => {
  const params = UpdateShotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateShotBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.shotType !== undefined) updates.shotType = body.data.shotType;
  if (body.data.cameraAngle !== undefined) updates.cameraAngle = body.data.cameraAngle;
  if (body.data.prompt !== undefined) updates.prompt = body.data.prompt;
  if (body.data.colorGrade !== undefined) updates.colorGrade = body.data.colorGrade;
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.position !== undefined) updates.position = body.data.position;
  if ("imageUrl" in body.data) updates.imageUrl = body.data.imageUrl;
  if ("videoUrl" in body.data) updates.videoUrl = body.data.videoUrl;

  const [row] = await db
    .update(shotsTable)
    .set(updates)
    .where(eq(shotsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (body.data.characterIds !== undefined) {
    await db.delete(shotCharactersTable).where(eq(shotCharactersTable.shotId, row.id));
    if (body.data.characterIds.length > 0) {
      await db.insert(shotCharactersTable).values(
        body.data.characterIds.map((cid) => ({ shotId: row.id, characterId: cid }))
      );
    }
  }

  const withChars = await attachCharacterIds(row);
  res.json(UpdateShotResponse.parse(withChars));
});

router.delete("/shots/:id", async (req, res): Promise<void> => {
  const params = DeleteShotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await db
    .delete(shotsTable)
    .where(eq(shotsTable.id, params.data.id))
    .returning({ id: shotsTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
