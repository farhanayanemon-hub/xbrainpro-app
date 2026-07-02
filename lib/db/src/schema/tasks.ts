import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { programsTable } from "./programs";
import { levelsTable } from "./levels";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  programId: integer("program_id")
    .notNull()
    .references(() => programsTable.id, { onDelete: "cascade" }),
  levelId: integer("level_id")
    .notNull()
    .references(() => levelsTable.id, { onDelete: "cascade" }),
  levelNumber: integer("level_number").notNull(),
  dayNumber: integer("day_number").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  timeOfDay: text("time_of_day"),
  durationMinutes: integer("duration_minutes"),
  xp: integer("xp").notNull().default(10),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Task = typeof tasksTable.$inferSelect;
