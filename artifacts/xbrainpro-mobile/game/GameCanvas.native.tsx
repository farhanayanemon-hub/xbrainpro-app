import { Canvas } from "@react-three/fiber/native";
import React from "react";

type CameraProps = { position: [number, number, number]; fov: number };

export default function GameCanvas({
  children,
  onReady,
  camera = { position: [0, 6.5, 17], fov: 55 },
}: {
  children: React.ReactNode;
  onReady?: () => void;
  /** Only used on web when WebGL is unavailable; native always supports GL. */
  fallback?: React.ReactNode;
  camera?: CameraProps;
}) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={camera}
      shadows
      gl={{ alpha: true }}
      onCreated={() => onReady?.()}
    >
      {children}
    </Canvas>
  );
}
