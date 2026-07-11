---
name: Coins & gems economy
description: How Neura City's currency is modeled and where prices must stay in sync
---

# Coins & gems economy

Currency is **server-authoritative**. The client only ever reads balances and
lets the server apply every change; never mutate coins/gems on the client.

**Why:** prevents cheating and double-spends; a single ledger is the source of
truth.

**How to apply:**
- All balance changes go through the api-server wallet helper's `earn` / `spend`
  (which wrap `adjustBalance`: runs in a tx, `FOR UPDATE` locks the row, refuses
  to go negative, writes a ledger row). Pass a `reference` for idempotency so a
  retried purchase/grant never double-charges.
- New players get a one-time starting grant on first wallet creation (grant refs
  `grant:new-player:coins` / `:gems`). `getOrCreateWallet` is safe to call every
  request.
- Store prices live server-side in the api-server store catalog — that is the
  source of truth for what a purchase costs. The mobile avatar catalog carries a
  `price`/`priceCurrency` **for display only** and must be kept in lockstep with
  the server catalog, or the UI will show a price the server won't honor.
- Purchase endpoint returns a **flat** shape `{ coins, gems, avatarId, owned }`
  (NOT `{ wallet: {...} }`). Build the client Wallet from `res.coins/res.gems`.
- Avatar ownership itself stays client-side (AsyncStorage `unlockAvatar`); only
  the spend is server-side. On a successful buy, spend first, then persist the
  local unlock.
