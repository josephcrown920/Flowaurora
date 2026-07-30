import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shotsTable } from "./shots";
import { charactersTable } from "./characters";

export const shotCharactersTable = pgTable(
  "shot_characters",
  {
    shotId: integer("shot_id")
      .notNull()
      .references(() => shotsTable.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => charactersTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.shotId, table.characterId] })],
);

export const insertShotCharacterSchema = createInsertSchema(shotCharactersTable);
export type InsertShotCharacter = z.infer<typeof insertShotCharacterSchema>;
export type ShotCharacter = typeof shotCharactersTable.$inferSelect;
