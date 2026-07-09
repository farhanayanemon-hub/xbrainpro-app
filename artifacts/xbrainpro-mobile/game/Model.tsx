import React, { useMemo } from "react";
import type { Mesh, Object3D } from "three";

import { useGLTF } from "@/game/drei";
import { MODEL_SOURCES, type ModelId } from "@/game/models";

/**
 * Places one instance of a GLB model in the scene. The loaded scene graph is
 * cloned per instance (geometry + materials stay shared), and every mesh is
 * flagged to cast/receive shadows.
 */
export default function Model({
  id,
  position,
  rotationY = 0,
  scale = 1,
}: {
  id: ModelId;
  position: [number, number, number];
  rotationY?: number;
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(
    MODEL_SOURCES[id] as unknown as string,
  ) as unknown as { scene: Object3D };

  const object = useMemo(() => {
    const o = gltf.scene.clone(true);
    o.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return o;
  }, [gltf]);

  const s: [number, number, number] =
    typeof scale === "number" ? [scale, scale, scale] : scale;

  return (
    <primitive
      object={object}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={s}
    />
  );
}
