import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Player-submitted reports about city chat messages. One row per report:
 * the `reporter` flagged a message sent by `reported`. The offending text is
 * snapshotted at report time (chat history is session-only, so the message
 * itself may be gone by the time an admin reviews it).
 */
export const chatReportsTable = pgTable("chat_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  reportedId: integer("reported_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** The message text as the reporter saw it (already masked server-side). */
  messageText: text("message_text").notNull(),
  /** Client timestamp of the reported message (ms epoch), if known. */
  messageTs: timestamp("message_ts", { withTimezone: true }),
  reason: text("reason"),
  /** "open" | "reviewed" | "dismissed" — admin triage state. */
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Server-side chat mutes. At most one row per user (upserted); a user is
 * muted while `mutedUntil` is in the future. Rows are written either by an
 * admin action or automatically when reports/profanity strikes pile up.
 */
export const chatMutesTable = pgTable("chat_mutes", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  mutedUntil: timestamp("muted_until", { withTimezone: true }).notNull(),
  /** Why the mute happened, e.g. "reports", "profanity", "admin". */
  reason: text("reason").notNull().default("admin"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ChatReport = typeof chatReportsTable.$inferSelect;
export type ChatMute = typeof chatMutesTable.$inferSelect;
