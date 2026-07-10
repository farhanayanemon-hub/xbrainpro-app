import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import type { AnimationClip, Group, Mesh, Object3D } from "three";
import { Box3, Vector3 } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

import { assetUri } from "@/game/assetUri";
import { AVATAR_MAP, DEFAULT_AVATAR_ID } from "@/game/avatar";
import { useAnimations, useGLTF } from "@/game/drei";
import { game } from "@/game/store";

/** World-unit height every avatar is normalized to. */
const TARGET_HEIGHT = 1.8;
const FADE = 0.18;
const WALK_THRESHOLD = 0.12;
const RUN_THRESHOLD = 0.78;

type ClipName = "Idle" | "Walking_A" | "Running_A";

/**
 * The player's animated avatar. Loads the selected KayKit character GLB,
 * clones it (skeleton-aware), normalizes its height, and crossfades between
 * idle / walk / run clips based on the joystick input magnitude.
 */
export default function Avatar({ avatarId }: { avatarId: string }) {
  const def = AVATAR_MAP[avatarId] ?? AVATAR_MAP[DEFAULT_AVATAR_ID];
  const gltf = useGLTF(assetUri(def.src)) as unknown as {
    scene: Object3D;
    animations: AnimationClip[];
  };

  const scene = useMemo(() => {
    const o = cloneSkeleton(gltf.scene);
    o.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        // Skinned meshes move outside their static bounds while animating.
        child.frustumCulled = false;
      }
    });
    return o;
  }, [gltf]);

  const scale = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = box.getSize(new Vector3());
    return size.y > 0.001 ? TARGET_HEIGHT / size.y : 1;
  }, [gltf]);

  const group = useRef<Group>(null);
  const { actions } = useAnimations(gltf.animations, group);
  const current = useRef<ClipName>("Idle");

  useEffect(() => {
    const idle = actions.Idle;
    if (!idle) return;
    current.current = "Idle";
    idle.reset().play();
    return () => {
      for (const name of Object.keys(actions)) actions[name]?.stop();
    };
  }, [actions]);

  useFrame(() => {
    const { x, y } = game.frozen ? { x: 0, y: 0 } : game.input;
    const mag = Math.min(Math.hypot(x, y), 1);
    const next: ClipName =
      mag > RUN_THRESHOLD
        ? "Running_A"
        : mag > WALK_THRESHOLD
          ? "Walking_A"
          : "Idle";
    if (next === current.current) return;
    const from = actions[current.current];
    const to = actions[next];
    if (!to) return;
    from?.fadeOut(FADE);
    to.reset().fadeIn(FADE).play();
    current.current = next;
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}
