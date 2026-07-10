import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

// Lightweight UI sound effects. Players are created lazily on first use (which
// is always a user gesture, satisfying web autoplay rules) and reused so repeat
// taps replay instantly. Everything is wrapped in try/catch so audio can never
// crash the UI — sound is a nice-to-have, not a hard dependency.

type Key = "tap" | "confirm" | "back";

const players: Partial<Record<Key, AudioPlayer>> = {};
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  try {
    // Let SFX play even when the phone's ringer is on silent.
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
    players.tap = createAudioPlayer(require("../assets/sfx/tap.wav"));
    players.confirm = createAudioPlayer(require("../assets/sfx/confirm.wav"));
    players.back = createAudioPlayer(require("../assets/sfx/back.wav"));
    for (const p of Object.values(players)) {
      if (p) p.volume = 0.9;
    }
  } catch {
    // ignore — UI stays fully functional without sound
  }
}

function fire(key: Key) {
  init();
  const p = players[key];
  if (!p) return;
  try {
    // Rewind so rapid presses always retrigger from the start.
    p.seekTo(0);
    p.play();
  } catch {
    // ignore
  }
}

/** Soft click for generic taps (menu items, chips, icon buttons). */
export function playTap() {
  fire("tap");
}

/** Rising confirmation used for primary / START actions. */
export function playConfirm() {
  fire("confirm");
}

/** Descending tone for back / close / dismiss actions. */
export function playBack() {
  fire("back");
}
