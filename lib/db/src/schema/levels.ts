import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { programsTable } from "./programs";

export const levelsTable = pgTable("levels", {
  id: serial("id").primaryKey(),
  programId: integer("program_id")
    .notNull()
    .references(() => programsTable.id, { onDelete: "cascade" }),
  levelNumber: integer("level_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("locked"),
  xpReward: integer("xp_reward").notNull().default(0),
});

export type Level = typeof levelsTable.$inferSelect;
