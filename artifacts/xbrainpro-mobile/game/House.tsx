import React from "react";

import type { HouseDef } from "@/game/cityLayout";

/**
 * A small residential house built from primitives (no GLB needed): a coloured
 * body, a pitched roof, a door and two windows on the front (door) side.
 * The front faces +Z rotated by `rotY`, matching houseDoor() in worldMap.
 */
export default function House({
  house,
  isHome = false,
}: {
  house: HouseDef;
  isHome?: boolean;
}) {
  const { x, z, w, d, h, rotY } = house;
  const wall = isHome ? "#f3d9a8" : "#e7ddcb";
  const roof = isHome ? "#c8455f" : "#7c5b46";

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>

      {/* pitched roof (a wide, short pyramid) */}
      <mesh position={[0, h + 0.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.82, 1.5, 4]} />
        <meshStandardMaterial color={roof} roughness={0.7} />
      </mesh>

      {/* door on the front (+Z) face */}
      <mesh position={[0, 1, d / 2 + 0.02]} castShadow>
        <boxGeometry args={[1.1, 2, 0.12]} />
        <meshStandardMaterial color="#5a3d29" roughness={0.6} />
      </mesh>
      {/* door knob */}
      <mesh position={[0.35, 1, d / 2 + 0.12]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#f5d36b" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* two windows flanking the door */}
      {[-1.8, 1.8].map((wx) => (
        <mesh key={wx} position={[wx, 2, d / 2 + 0.02]}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial
            color="#8fd0e8"
            emissive="#2a6f88"
            emissiveIntensity={0.3}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
