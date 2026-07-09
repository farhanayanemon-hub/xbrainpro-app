import { useFrame } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

import Avatar from "@/game/Avatar";
import { COLLIDERS, WORLD_BOUND } from "@/game/cityLayout";
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

/** Simple blocky stand-in shown while the avatar GLB loads (or fails). */
function PlaceholderBody() {
  return (
    <>
      <mesh castShadow position={[-0.14, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.24]} />
        <meshStandardMaterial color="#2d3561" />
      </mesh>
      <mesh castShadow position={[0.14, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.24]} />
        <meshStandardMaterial color="#2d3561" />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.62, 0.75, 0.34]} />
        <meshStandardMaterial color="#ff5c8a" />
      </mesh>
      <mesh castShadow position={[0, 1.72, 0]}>
        <boxGeometry args={[0.44, 0.44, 0.4]} />
        <meshStandardMaterial color="#f2c9a1" />
      </mesh>
    </>
  );
}

/**
 * Error boundary that lives inside the 3D scene graph, so a failed avatar
 * load falls back to the placeholder body instead of crashing the canvas.
 */
class AvatarBoundary extends React.Component<
  { children: React.ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) return <PlaceholderBody />;
    return this.props.children;
  }
}

export default function Player({
  avatarId,
  onNearNpc,
}: {
  avatarId: string;
  onNearNpc: (npcId: string | null) => void;
}) {
  const group = useRef<Group>(null);
  const camTarget = useRef(new Vector3());
  const lastNear = useRef<string | null>(null);

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
      <AvatarBoundary resetKey={avatarId}>
        <Suspense fallback={<PlaceholderBody />}>
          <Avatar key={avatarId} avatarId={avatarId} />
        </Suspense>
      </AvatarBoundary>
    </group>
  );
}
