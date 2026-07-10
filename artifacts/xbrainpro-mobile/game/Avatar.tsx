import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import type { AnimationClip, Group, Mesh, Object3D } from "three";
import { Box3, Vector3 } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

import { resolveAvatar } from "@/game/assetResolver";
import { useAnimations, useGLTF } from "@/game/drei";
import { game } from "@/game/store";

/** World-unit height every avatar is normalized to. */
const TARGET_HEIGHT = 1.8;
const FADE = 0.22;
const WALK_THRESHOLD = 0.12;
const RUN_THRESHOLD = 0.78;

type Motion = "idle" | "walk" | "run";

/**
 * The player's animated avatar. Loads the selected realistic human GLB,
 * clones it (skeleton-aware), normalizes its height, and crossfades between
 * idle / walk / run clips based on the joystick input magnitude. Clip names
 * are matched case-insensitively so any rig (mixamo, KayKit, …) works.
 */
export default function Avatar({
  avatarId,
  getMotion,
}: {
  avatarId: string;
  /**
   * Optional 0..1 movement magnitude source. Defaults to the local joystick
   * input; remote players pass their own interpolated speed so their walk/run
   * animation matches how they're actually moving.
   */
  getMotion?: () => number;
}) {
  const gltf = useGLTF(resolveAvatar(avatarId)) as unknown as {
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

  // Match the rig's clips to our idle/walk/run roles by name (case-insensitive)
  // so we don't depend on exact clip labels across different character packs.
  const clips = useMemo(() => {
    const names = Object.keys(actions);
    const find = (kw: string) =>
      names.find((n) => n.toLowerCase().includes(kw));
    return {
      idle: find("idle") ?? names[0],
      walk: find("walk") ?? find("idle") ?? names[0],
      run: find("run") ?? find("walk") ?? names[0],
    } as Record<Motion, string | undefined>;
  }, [actions]);

  const current = useRef<Motion>("idle");

  useEffect(() => {
    current.current = "idle";
    const idle = clips.idle ? actions[clips.idle] : undefined;
    idle?.reset().play();
    return () => {
      for (const name of Object.keys(actions)) actions[name]?.stop();
    };
  }, [actions, clips]);

  useFrame(() => {
    let mag: number;
    if (getMotion) {
      mag = Math.min(Math.max(getMotion(), 0), 1);
    } else {
      const { x, y } = game.frozen ? { x: 0, y: 0 } : game.input;
      mag = Math.min(Math.hypot(x, y), 1);
    }
    const next: Motion =
      mag > RUN_THRESHOLD ? "run" : mag > WALK_THRESHOLD ? "walk" : "idle";
    if (next === current.current) return;
    const fromName = clips[current.current];
    const toName = clips[next];
    const to = toName ? actions[toName] : undefined;
    if (!to) return;
    if (fromName && fromName !== toName) actions[fromName]?.fadeOut(FADE);
    to.reset().fadeIn(FADE).play();
    current.current = next;
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}
