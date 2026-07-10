import { Canvas } from "@react-three/fiber";
import React, { useEffect, useMemo, useState } from "react";

function supportsWebgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function isTouchDevice(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/** True while a touch device is held in portrait. */
function usePortraitOnTouch(): boolean {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (!isTouchDevice()) return;
    const mq = window.matchMedia("(orientation: portrait)");
    const update = () => setPortrait(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    // Older iOS Safari only supports addListener/removeListener.
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);
  return portrait;
}

export default function GameCanvas({
  children,
  onReady,
  fallback = null,
}: {
  children: React.ReactNode;
  onReady?: () => void;
  fallback?: React.ReactNode;
}) {
  const supported = useMemo(supportsWebgl, []);
  const portrait = usePortraitOnTouch();

  useEffect(() => {
    if (!supported) onReady?.();
  }, [supported, onReady]);

  // Best-effort landscape lock (only works in some mobile browsers /
  // fullscreen contexts — failures are silently ignored).
  useEffect(() => {
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      orientation?.lock?.("landscape")?.catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  if (!supported) return <>{fallback}</>;

  return (
    <>
      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [0, 6.5, 17], fov: 55 }}
        dpr={[1, 2]}
        shadows
        onCreated={() => onReady?.()}
      >
        {children}
      </Canvas>
      {portrait && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "rgba(10, 13, 30, 0.92)",
            color: "#fff",
            textAlign: "center",
            padding: 32,
          }}
        >
          <div style={{ fontSize: 42 }}>📱↻</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
            ROTATE YOUR PHONE
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 260 }}>
            Neura City plays in landscape. Turn your phone sideways to enter
            the city.
          </div>
        </div>
      )}
    </>
  );
}
