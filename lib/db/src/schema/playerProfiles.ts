import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Game-facing player profile for Neura City. Separate from the coaching
 * `profiles` table so game identity (display name, gender, bio, photo)
 * evolves independently of the self-assessment data.
 */
export const playerProfilesTable = pgTable("player_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  /** "male" | "female" — chosen after registration, maps to avatar set. */
  gender: text("gender").notNull(),
  bio: text("bio"),
  /** Profile photo stored inline as base64 (small, size-limited). */
  photoData: text("photo_data"),
  photoMime: text("photo_mime"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PlayerProfile = typeof playerProfilesTable.$inferSelect;
