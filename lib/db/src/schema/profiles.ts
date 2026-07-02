import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  onboarded: boolean("onboarded").notNull().default(false),
  about: text("about"),
  currentSituation: text("current_situation"),
  biggestChallenge: text("biggest_challenge"),
  motivation: text("motivation"),
  focusMinutesPerDay: integer("focus_minutes_per_day"),
});

export type Profile = typeof profilesTable.$inferSelect;
