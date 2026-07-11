/**
 * Mystery Box client helpers.
 *
 * The server charges gems, rolls the reward, and credits currency — all
 * atomically. Each open sends a fresh `openId` so a retry (dropped response,
 * double-tap) is idempotent and never charges or re-rolls twice.
 */
import {
  getMysteryBox,
  openMysteryBox,
  type MysteryBoxInfo,
  type MysteryReward,
  type OpenMysteryBoxResult,
} from "@workspace/api-client-react";

export type { MysteryBoxInfo, MysteryReward, OpenMysteryBoxResult };

/** Fetch the box cost + reward pool. */
export function fetchMysteryBox(): Promise<MysteryBoxInfo> {
  return getMysteryBox();
}

/** A reasonably-unique idempotency key for one open attempt. */
export function newOpenId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Open the box with a given idempotency key; resolves with reward + balance. */
export function openBox(openId: string): Promise<OpenMysteryBoxResult> {
  return openMysteryBox({ openId });
}
