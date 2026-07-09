import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * One placed object in the Neura City world map. `kind` selects the client
 * renderer (building, tree, lamp, prop, roofProp, car, fountain, stall, npc)
 * and `data` carries the kind-specific fields (model id, position, rotation,
 * scale, collision size, ...). Kept as jsonb so new content never needs an
 * app update — the payload references bundled model ids only.
 */
export const worldObjectsTable = pgTable("world_objects", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorldObject = typeof worldObjectsTable.$inferSelect;
export type InsertWorldObject = typeof worldObjectsTable.$inferInsert;
