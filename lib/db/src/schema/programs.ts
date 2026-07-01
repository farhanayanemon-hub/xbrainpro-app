import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const programsTable = pgTable("programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pathKey: text("path_key").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  durationDays: integer("duration_days").notNull(),
  status: text("status").notNull().default("active"),
  currentLevel: integer("current_level").notNull().default(1),
  accent: text("accent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Program = typeof programsTable.$inferSelect;
