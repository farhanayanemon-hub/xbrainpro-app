import React from "react";

import Player from "@/game/Player";
import { BED, INTERIOR_HALF, type Interactable } from "@/game/worldMap";

const WALL_H = 3.2;
const HALF = INTERIOR_HALF;

/**
 * A small self-contained room shown when the player is inside their house.
 * Built entirely from primitives: floor, four walls, a bed and a lamp.
 */
export default function InteriorScene({
  avatarId,
  onNearInteract,
}: {
  avatarId: string;
  onNearInteract: (it: Interactable | null) => void;
}) {
  return (
    <>
      <hemisphereLight args={["#fff4e0", "#3a2f28", 0.8]} />
      <ambientLight intensity={0.4} />
      <pointLight
        position={[0, WALL_H - 0.3, 0]}
        intensity={1.4}
        color="#ffe6bd"
        distance={16}
        castShadow
      />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial color="#a97e5a" roughness={0.9} />
      </mesh>

      {/* back / front walls (along X) */}
      {[-HALF, HALF].map((z) => (
        <mesh key={`wz${z}`} position={[0, WALL_H / 2, z]} receiveShadow>
          <boxGeometry args={[HALF * 2, WALL_H, 0.2]} />
          <meshStandardMaterial color="#e9dcc6" roughness={0.95} />
        </mesh>
      ))}
      {/* left / right walls (along Z) */}
      {[-HALF, HALF].map((x) => (
        <mesh key={`wx${x}`} position={[x, WALL_H / 2, 0]} receiveShadow>
          <boxGeometry args={[0.2, WALL_H, HALF * 2]} />
          <meshStandardMaterial color="#ded0b8" roughness={0.95} />
        </mesh>
      ))}

      {/* bed */}
      <group position={[BED.x, 0, BED.z]}>
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[BED.w, 0.55, BED.d]} />
          <meshStandardMaterial color="#6d8ab0" roughness={0.85} />
        </mesh>
        {/* pillow */}
        <mesh position={[0, 0.62, -BED.d / 2 + 0.5]} castShadow>
          <boxGeometry args={[BED.w - 0.4, 0.22, 0.7]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
        </mesh>
        {/* blanket */}
        <mesh position={[0, 0.58, 0.4]} castShadow>
          <boxGeometry args={[BED.w, 0.18, BED.d - 1.2]} />
          <meshStandardMaterial color="#c8455f" roughness={0.85} />
        </mesh>
      </group>

      {/* small rug by the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.8]}>
        <planeGeometry args={[2, 1.4]} />
        <meshStandardMaterial color="#8a6bb0" roughness={0.9} />
      </mesh>

      <Player avatarId={avatarId} onNearNpc={() => {}} onNearInteract={onNearInteract} />
    </>
  );
}
