import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

import { COLLIDERS, WORLD_BOUND, type Aabb } from "@/game/cityLayout";
import { NPCS, TALK_DISTANCE } from "@/game/npcs";
import { game } from "@/game/store";

const SPEED = 5;

function resolveCollisions(x: number, z: number): [number, number] {
  let nx = x;
  let nz = z;
  for (const c of COLLIDERS) {
    if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) {
      const pushLeft = nx - c.minX;
      const pushRight = c.maxX - nx;
      const pushUp = nz - c.minZ;
      const pushDown = c.maxZ - nz;
      const min = Math.min(pushLeft, pushRight, pushUp, pushDown);
      if (min === pushLeft) nx = c.minX;
      else if (min === pushRight) nx = c.maxX;
      else if (min === pushUp) nz = c.minZ;
      else nz = c.maxZ;
    }
  }
  return [nx, nz];
}

export default function Player({
  onNearNpc,
}: {
  onNearNpc: (npcId: string | null) => void;
}) {
  const group = useRef<Group>(null);
  const bodyGroup = useRef<Group>(null);
  const camTarget = useRef(new Vector3());
  const lastNear = useRef<string | null>(null);
  const walkPhase = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { x: ix, y: iy } = game.frozen ? { x: 0, y: 0 } : game.input;
    const mag = Math.min(Math.hypot(ix, iy), 1);
    const moving = mag > 0.12;

    if (moving) {
      const step = SPEED * mag * delta;
      const dirX = ix / (mag || 1);
      const dirZ = -iy / (mag || 1);
      let nx = game.player.x + dirX * step;
      let nz = game.player.z + dirZ * step;
      nx = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, nx));
      nz = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, nz));
      [nx, nz] = resolveCollisions(nx, nz);
      game.player.x = nx;
      game.player.z = nz;
      game.player.heading = Math.atan2(dirX, dirZ);
      walkPhase.current += delta * 10 * mag;
    }

    if (group.current) {
      group.current.position.set(game.player.x, 0, game.player.z);
      // smooth turn
      const g = group.current;
      let diff = game.player.heading - g.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y += diff * Math.min(1, delta * 12);
    }
    if (bodyGroup.current) {
      // walk bob
      bodyGroup.current.position.y = moving
        ? Math.abs(Math.sin(walkPhase.current)) * 0.08
        : 0;
    }

    // follow camera
    camTarget.current.set(game.player.x, 6.2, game.player.z + 9.5);
    state.camera.position.lerp(
      camTarget.current,
      1 - Math.pow(0.0005, delta),
    );
    state.camera.lookAt(game.player.x, 1.4, game.player.z);

    // NPC proximity
    let near: string | null = null;
    for (const n of NPCS) {
      const d = Math.hypot(n.x - game.player.x, n.z - game.player.z);
      if (d < TALK_DISTANCE) {
        near = n.id;
        break;
      }
    }
    if (near !== lastNear.current) {
      lastNear.current = near;
      onNearNpc(near);
    }
  });

  return (
    <group ref={group} position={[game.player.x, 0, game.player.z]}>
      <group ref={bodyGroup}>
        {/* legs */}
        <mesh castShadow position={[-0.14, 0.35, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.24]} />
          <meshStandardMaterial color="#2d3561" />
        </mesh>
        <mesh castShadow position={[0.14, 0.35, 0]}>
          <boxGeometry args={[0.2, 0.7, 0.24]} />
          <meshStandardMaterial color="#2d3561" />
        </mesh>
        {/* torso */}
        <mesh castShadow position={[0, 1.05, 0]}>
          <boxGeometry args={[0.62, 0.75, 0.34]} />
          <meshStandardMaterial color="#ff5c8a" />
        </mesh>
        {/* arms */}
        <mesh castShadow position={[-0.42, 1.02, 0]}>
          <boxGeometry args={[0.16, 0.62, 0.2]} />
          <meshStandardMaterial color="#e84876" />
        </mesh>
        <mesh castShadow position={[0.42, 1.02, 0]}>
          <boxGeometry args={[0.16, 0.62, 0.2]} />
          <meshStandardMaterial color="#e84876" />
        </mesh>
        {/* head */}
        <mesh castShadow position={[0, 1.72, 0]}>
          <boxGeometry args={[0.44, 0.44, 0.4]} />
          <meshStandardMaterial color="#f2c9a1" />
        </mesh>
        {/* hair cap */}
        <mesh castShadow position={[0, 1.93, -0.03]}>
          <boxGeometry args={[0.48, 0.16, 0.44]} />
          <meshStandardMaterial color="#31284b" />
        </mesh>
      </group>
    </group>
  );
}
