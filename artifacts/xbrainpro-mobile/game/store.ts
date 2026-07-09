/**
 * Mutable game state shared between the React Native UI layer (joystick,
 * HUD) and the 3D scene loop. Kept outside React state so the 60fps game
 * loop never triggers re-renders.
 */
export const game = {
  /** Joystick vector, each axis in [-1, 1]. y > 0 means "push up" (walk away from camera). */
  input: { x: 0, y: 0 },
  /** Player world state, written by the game loop. */
  player: { x: 0, z: 8, heading: 0 },
  /** When true the loop ignores input (chat / pause open). */
  frozen: false,
};

export function resetInput() {
  game.input.x = 0;
  game.input.y = 0;
}
