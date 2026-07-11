/**
 * Screen-space speech bubbles for city chat. When a chat message arrives the
 * net layer records it here keyed by player id ("me" for the local player);
 * the RN overlay (`components/PlayerLabels`) draws the bubble above the
 * player's head until it expires. Remote head positions come from `labels`;
 * the local head position is projected each frame into `localHead` by the
 * 3D scene.
 */
export interface Bubble {
  text: string;
  /** Epoch ms after which the bubble stops rendering. */
  until: number;
}

export const BUBBLE_TTL_MS = 5000;

/** player id (or "me") -> active speech bubble. */
export const bubbles = new Map<string, Bubble>();

/** The local player's projected head position, written by the render loop. */
export const localHead = { sx: 0, sy: 0, visible: false };

export function setBubble(id: string, text: string): void {
  bubbles.set(id, { text, until: Date.now() + BUBBLE_TTL_MS });
}

export function clearBubbles(): void {
  bubbles.clear();
  localHead.visible = false;
}
