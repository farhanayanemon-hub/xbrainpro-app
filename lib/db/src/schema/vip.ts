import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * A player's VIP membership for Neura City. One row per account, holding the
 * moment the membership lapses. VIP is server-authoritative: perks (a Daily
 * Task reward bonus, the VIP tag) are active only while `expiresAt` is in the
 * future, and purchasing extends it. Buying more time stacks onto whatever is
 * left, so the expiry only ever moves forward.
 */
export const vipMembershipsTable = pgTable("vip_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** When the membership lapses. Perks are active only while this is future. */
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type VipMembership = typeof vipMembershipsTable.$inferSelect;
