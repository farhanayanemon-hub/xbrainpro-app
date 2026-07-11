/**
 * VIP membership client helpers.
 *
 * The server owns VIP status, pricing, and expiry; the client only reads the
 * status and asks to buy. Purchasing returns the updated status + fresh wallet
 * balance so the UI re-syncs from one place. Perks (a Daily Task reward bonus,
 * the VIP badge) are driven off the server's `active` flag, so they switch off
 * on their own the moment the membership lapses.
 */
import {
  getVip,
  purchaseVip,
  type VipStatus,
  type VipPurchaseResult,
} from "@workspace/api-client-react";

export type { VipStatus, VipPurchaseResult };

/** Fetch the player's VIP status and the current offer terms. */
export function fetchVip(): Promise<VipStatus> {
  return getVip();
}

/** Buy or extend VIP with gems; resolves with the new status + balance. */
export function buyVip(): Promise<VipPurchaseResult> {
  return purchaseVip();
}

/**
 * A short "Xd left" / "Xh left" label from an ISO expiry. Returns null when the
 * membership isn't active (never bought or already lapsed).
 */
export function formatVipRemaining(
  expiresAt: string | null,
  now: Date = new Date(),
): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / (60 * 24));
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} left`;
  const hours = Math.floor(mins / 60);
  if (hours >= 1) return `${hours}h left`;
  return `${mins}m left`;
}
