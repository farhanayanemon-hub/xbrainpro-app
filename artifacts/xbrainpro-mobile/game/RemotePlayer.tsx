import { useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useRef } from "react";
import type { Group } from "three";
import { Vector3 } from "three";

import Avatar from "@/game/Avatar";
import { resolveAvatar } from "@/game/assetResolver";
import { DEFAULT_AVATAR_ID } from "@/game/avatar";
import { labels } from "@/game/labels";
import { remote } from "@/game/net";

const SPEED = 5; // matches the local player's max speed (Player.tsx)
const _head = new Vector3();

/** Blocky stand-in shown while a remote avatar's GLB loads or if it fails. */
function RemotePlaceholder({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 1.1, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.36]} />
        <meshStandardMaterial color="#f2c9a1" />
      </mesh>
    </>
  );
}

/**
 * Keeps a failed remote avatar load from tearing down the shared canvas —
 * falls back to the placeholder body instead.
 */
class RemoteAvatarBoundary extends React.Component<
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
    if (this.state.failed) return <RemotePlaceholder color="#3a4a6b" />;
    return this.props.children;
  }
}

/**
 * One other online player. Reads its latest server target from `net.remote`
 * every frame, smoothly interpolates position + heading, drives the avatar's
 * walk/run animation from its own speed, and projects its head to screen so
 * the RN overlay can draw the display name.
 */
export default function RemotePlayer({ id }: { id: string }) {
  const group = useRef<Group>(null);
  const motion = useRef(0);
  const { camera, size } = useThree();

  useFrame((_, rawDelta) => {
    const p = remote.get(id);
    const g = group.current;
    if (!p || !g) return;

    const delta = Math.min(rawDelta, 0.05) || 0.016;
    const prevX = p.cur.x;
    const prevZ = p.cur.z;

    // Smoothly chase the latest target from the network.
    const k = 1 - Math.pow(0.001, delta);
    p.cur.x += (p.target.x - p.cur.x) * k;
    p.cur.z += (p.target.z - p.cur.z) * k;

    // Shortest-arc heading interpolation.
    let dh = p.target.h - p.cur.h;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    p.cur.h += dh * Math.min(1, delta * 12);

    g.position.set(p.cur.x, 0, p.cur.z);
    g.rotation.y = p.cur.h;

    // Estimate movement magnitude from how far we actually moved this frame.
    const dist = Math.hypot(p.cur.x - prevX, p.cur.z - prevZ);
    const inst = Math.min(dist / delta / SPEED, 1);
    motion.current += (inst - motion.current) * Math.min(1, delta * 10);
    p.motion = motion.current;

    // Project the head to screen pixels for the name-label overlay.
    _head.set(p.cur.x, 2.35, p.cur.z);
    _head.project(camera);
    const behind = _head.z > 1;
    labels.set(id, {
      name: p.name,
      sx: (_head.x * 0.5 + 0.5) * size.width,
      sy: (-_head.y * 0.5 + 0.5) * size.height,
      visible: !behind && _head.x >= -1 && _head.x <= 1,
    });
  });

  const p0 = remote.get(id);
  const avatarId = p0?.avatarId ?? DEFAULT_AVATAR_ID;
  const src = resolveAvatar(avatarId);

  return (
    <group ref={group}>
      <RemoteAvatarBoundary resetKey={avatarId}>
        {src ? (
          <Suspense fallback={<RemotePlaceholder color="#3a4a6b" />}>
            <Avatar
              key={avatarId}
              avatarId={avatarId}
              getMotion={() => motion.current}
            />
          </Suspense>
        ) : (
          <RemotePlaceholder color="#3a4a6b" />
        )}
      </RemoteAvatarBoundary>
    </group>
  );
}
