import { Canvas } from "@react-three/fiber/native";
import React from "react";

export default function GameCanvas({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
  /** Only used on web when WebGL is unavailable; native always supports GL. */
  fallback?: React.ReactNode;
}) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ position: [0, 6.5, 17], fov: 55 }}
      shadows
      onCreated={() => onReady?.()}
    >
      {children}
    </Canvas>
  );
}
