import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import type { Group, Mesh } from "three";

import type { NpcDef } from "@/game/npcs";

export default function Npc({ npc }: { npc: NpcDef }) {
  const marker = useRef<Mesh>(null);
  const body = useRef<Group>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta;
    if (marker.current) {
      marker.current.rotation.y += delta * 1.6;
      marker.current.position.y = 2.55 + Math.sin(t.current * 2) * 0.08;
    }
    if (body.current) {
      // gentle idle sway
      body.current.rotation.y = Math.sin(t.current * 0.6) * 0.15;
    }
  });

  return (
    <group position={[npc.x, 0, npc.z]}>
      <group ref={body}>
        <mesh castShadow position={[-0.13, 0.33, 0]}>
          <boxGeometry args={[0.18, 0.66, 0.22]} />
          <meshStandardMaterial color="#232946" />
        </mesh>
        <mesh castShadow position={[0.13, 0.33, 0]}>
          <boxGeometry args={[0.18, 0.66, 0.22]} />
          <meshStandardMaterial color="#232946" />
        </mesh>
        <mesh castShadow position={[0, 1, 0]}>
          <boxGeometry args={[0.58, 0.72, 0.32]} />
          <meshStandardMaterial color={npc.color} />
        </mesh>
        <mesh castShadow position={[-0.4, 0.98, 0]}>
          <boxGeometry args={[0.15, 0.58, 0.18]} />
          <meshStandardMaterial color={npc.color} />
        </mesh>
        <mesh castShadow position={[0.4, 0.98, 0]}>
          <boxGeometry args={[0.15, 0.58, 0.18]} />
          <meshStandardMaterial color={npc.color} />
        </mesh>
        <mesh castShadow position={[0, 1.64, 0]}>
          <boxGeometry args={[0.42, 0.42, 0.38]} />
          <meshStandardMaterial color="#f2c9a1" />
        </mesh>
        <mesh castShadow position={[0, 1.85, -0.02]}>
          <boxGeometry args={[0.46, 0.14, 0.42]} />
          <meshStandardMaterial color="#1c1c2c" />
        </mesh>
      </group>
      {/* floating talk marker */}
      <mesh ref={marker} position={[0, 2.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color={npc.accent}
          emissive={npc.accent}
          emissiveIntensity={1.8}
        />
      </mesh>
    </group>
  );
}
