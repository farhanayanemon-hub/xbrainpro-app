import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Private one-to-one messages between friends. Every message is persisted so
 * it doubles as an offline inbox: `readAt` stays NULL until the recipient
 * opens the conversation, which is what drives the unread badges.
 */
export const directMessagesTable = pgTable(
  "direct_messages",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    recipientId: integer("recipient_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** NULL while unread; set when the recipient opens the conversation. */
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => ({
    // Unread lookups: "how many unread messages do I have, per sender?"
    recipientReadIdx: index("direct_messages_recipient_read_idx").on(
      t.recipientId,
      t.readAt,
    ),
    // Conversation lookups: both directions between two users, newest first.
    pairIdx: index("direct_messages_pair_idx").on(
      t.senderId,
      t.recipientId,
      t.id,
    ),
  }),
);

export type DirectMessage = typeof directMessagesTable.$inferSelect;
