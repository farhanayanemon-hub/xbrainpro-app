/**
 * Player currency (coins + gems) client helpers.
 *
 * Balances are server-authoritative: we only ever read them and let the server
 * apply every change. `buyAvatar` charges the server-priced cost and returns
 * the fresh balance.
 */
import {
  getWallet,
  purchaseAvatar,
  type Wallet,
  type PurchaseAvatarResult,
} from "@workspace/api-client-react";

export type { Wallet, PurchaseAvatarResult };

/** Fetch the authenticated player's coin + gem balance. */
export function fetchWallet(): Promise<Wallet> {
  return getWallet();
}

/** Buy an avatar look; resolves with the updated balance. */
export function buyAvatar(avatarId: string): Promise<PurchaseAvatarResult> {
  return purchaseAvatar(avatarId);
}

/** Compact HUD formatting: 1250 -> "1.3K", 2_400_000 -> "2.4M". */
export function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
