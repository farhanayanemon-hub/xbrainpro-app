import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  timeOfDay: text("time_of_day").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  daysOfWeek: integer("days_of_week").array().notNull().default([0, 1, 2, 3, 4, 5, 6]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Reminder = typeof remindersTable.$inferSelect;
