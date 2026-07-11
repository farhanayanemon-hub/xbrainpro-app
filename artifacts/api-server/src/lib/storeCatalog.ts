import type { Currency } from "./wallet";

/**
 * Server-authoritative prices for Store avatar looks. The mobile app mirrors
 * these in `game/avatar.ts` for display, but the server is the source of truth
 * for what a purchase actually costs — never trust a price sent by the client.
 *
 * Keep in sync with `artifacts/xbrainpro-mobile/game/avatar.ts` AVATARS.
 */
export interface AvatarPrice {
  price: number;
  currency: Currency;
}

export const AVATAR_PRICES: Record<string, AvatarPrice> = {
  ryan: { price: 250, currency: "coins" },
  maya: { price: 250, currency: "coins" },
};

export function getAvatarPrice(avatarId: string): AvatarPrice | null {
  return AVATAR_PRICES[avatarId] ?? null;
}
