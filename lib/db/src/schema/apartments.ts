import {
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * A single piece of furniture placed in a player's apartment: which catalog
 * item it is and where it sits. `item` is either a built-in furniture id or an
 * admin-uploaded model id (asset zone "apartment"). `x`/`z` are floor
 * coordinates inside the room; `rotY` is the yaw in radians.
 */
export interface PlacedFurniture {
  uid: string;
  item: string;
  x: number;
  z: number;
  rotY: number;
}

/**
 * A player's apartment layout. One row per account. The whole arrangement is
 * stored as a single JSON array so saving is one atomic upsert — the client
 * sends the full layout and it replaces the previous one. A missing row means
 * the player has never decorated, so the server serves a default starter set.
 */
export const apartmentsTable = pgTable("apartments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Full furniture arrangement (array of PlacedFurniture). */
  layout: jsonb("layout").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Apartment = typeof apartmentsTable.$inferSelect;
