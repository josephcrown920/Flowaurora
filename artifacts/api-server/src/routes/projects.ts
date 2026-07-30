import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, projectsTable, shotsTable } from "@workspace/db";
import {
  ListProjectsResponse,
  CreateProjectBody,
  CreateProjectResponse,
  GetProjectParams,
  GetProjectResponse,
  UpdateProjectParams,
  UpdateProjectBody,
  UpdateProjectResponse,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function withShotCount(project: typeof projectsTable.$inferSelect) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shotsTable)
    .where(eq(shotsTable.projectId, project.id));
  return { ...project, shotCount: count };
}

router.get("/projects", async (req, res): Promise<void> => {
  const rows = await db.select().from(projectsTable).orderBy(projectsTable.updatedAt);
  const withCounts = await Promise.all(rows.map(withShotCount));
  res.json(ListProjectsResponse.parse(withCounts));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(projectsTable)
    .values({
      title: parsed.data.title,
      logline: parsed.data.logline ?? "",
      stylePreset: parsed.data.stylePreset ?? "cinematic",
    })
    .returning();
  res.status(201).json(CreateProjectResponse.parse({ ...row, shotCount: 0 }));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const withCount = await withShotCount(row);
  res.json(GetProjectResponse.parse(withCount));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateProjectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.logline !== undefined) updates.logline = body.data.logline;
  if (body.data.stylePreset !== undefined) updates.stylePreset = body.data.stylePreset;
  if (body.data.status !== undefined) updates.status = body.data.status;
  const [row] = await db
    .update(projectsTable)
    .set(updates)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const withCount = await withShotCount(row);
  res.json(UpdateProjectResponse.parse(withCount));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning({ id: projectsTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).end();
});

export default router;
