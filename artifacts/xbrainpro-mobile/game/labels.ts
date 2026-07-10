/**
 * Screen-space name labels for remote players. The 3D scene projects each
 * remote player's head position to screen pixels every frame; a plain
 * React Native overlay (`components/PlayerLabels`) reads this map and draws
 * the display names on top of the canvas. This is the only cross-platform
 * way to get crisp text overhead on both native (expo-gl) and web.
 */
export interface PlayerLabel {
  name: string;
  /** Screen position in layout pixels. */
  sx: number;
  sy: number;
  /** Behind the camera or off-screen → hide. */
  visible: boolean;
}

/** id -> label. Mutated from the render loop, read by the RN overlay. */
export const labels = new Map<string, PlayerLabel>();

export function clearLabels(): void {
  labels.clear();
}
