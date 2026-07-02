import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const earnedBadgesTable = pgTable(
  "earned_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    badgeKey: text("badge_key").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.badgeKey)],
);

export type EarnedBadge = typeof earnedBadgesTable.$inferSelect;
