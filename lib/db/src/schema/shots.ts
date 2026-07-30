import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const shotsTable = pgTable("shots", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  shotType: text("shot_type").notNull().default("medium"),
  cameraAngle: text("camera_angle").notNull().default("eye-level"),
  prompt: text("prompt").notNull().default(""),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  colorGrade: text("color_grade").notNull().default("none"),
  status: text("status").notNull().default("draft"),
  parentShotId: integer("parent_shot_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertShotSchema = createInsertSchema(shotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShot = z.infer<typeof insertShotSchema>;
export type Shot = typeof shotsTable.$inferSelect;
