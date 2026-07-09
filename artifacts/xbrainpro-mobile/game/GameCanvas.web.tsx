import { Canvas } from "@react-three/fiber";
import React, { useEffect, useMemo } from "react";

function supportsWebgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
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

  useEffect(() => {
    if (!supported) onReady?.();
  }, [supported, onReady]);

  if (!supported) return <>{fallback}</>;

  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ position: [0, 6.5, 17], fov: 55 }}
      dpr={[1, 2]}
      shadows
      onCreated={() => onReady?.()}
    >
      {children}
    </Canvas>
  );
}
