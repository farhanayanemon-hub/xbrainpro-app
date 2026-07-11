import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * A player's spendable currency balances for Neura City. One row per account.
 * Balances are server-authoritative — clients only ever read them; every
 * change flows through the wallet helpers so it is atomic and audited.
 */
export const playerWalletsTable = pgTable("player_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Soft currency, earned through play. */
  coins: integer("coins").notNull().default(0),
  /** Premium currency. */
  gems: integer("gems").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Append-only ledger of every balance change. Gives an audit trail and, via
 * the optional `reference` idempotency key, lets one-shot operations (a
 * purchase, a one-time grant) be safely retried without double-charging.
 */
export const walletTransactionsTable = pgTable(
  "wallet_transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** "coins" | "gems". */
    currency: text("currency").notNull(),
    /** Signed delta: positive = earned, negative = spent. */
    amount: integer("amount").notNull(),
    /** Human/machine reason, e.g. "grant:new-player", "purchase:avatar:maya". */
    reason: text("reason").notNull(),
    /**
     * Idempotency key. When set, a second transaction with the same
     * (userId, reference) is rejected by the unique index, so retries never
     * double-apply. NULL for ordinary repeatable earns/spends.
     */
    reference: text("reference"),
    /** Snapshot of the balance in this currency right after the change. */
    balanceAfter: integer("balance_after").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("wallet_tx_user_idx").on(t.userId),
    // NULL references are treated as distinct by Postgres, so ordinary
    // earns/spends (reference = NULL) never collide here.
    referenceUnique: uniqueIndex("wallet_tx_user_reference_unique").on(
      t.userId,
      t.reference,
    ),
  }),
);

export type PlayerWallet = typeof playerWalletsTable.$inferSelect;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
