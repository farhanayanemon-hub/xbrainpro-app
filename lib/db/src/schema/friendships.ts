import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Social graph for Neura City. A single row per directed request: the
 * `requester` asked to befriend the `addressee`. Once `status` is "accepted"
 * the two are friends (the pair is treated symmetrically when listing).
 *
 * The unique (requester, addressee) constraint prevents duplicate requests in
 * the same direction; the API also collapses a reverse pending request into an
 * immediate acceptance so a mutual "add" never leaves two dangling rows.
 */
export const FRIENDSHIP_STATUSES = ["pending", "accepted"] as const;
export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];

export const friendshipsTable = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    addresseeId: integer("addressee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** "pending" | "accepted" */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniquePair: unique("friendships_pair_unique").on(
      t.requesterId,
      t.addresseeId,
    ),
  }),
);

export type Friendship = typeof friendshipsTable.$inferSelect;
