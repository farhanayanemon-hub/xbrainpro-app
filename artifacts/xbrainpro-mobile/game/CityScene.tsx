import React from "react";

import {
  BUILDINGS,
  FOUNTAIN,
  LAMPS,
  STALL,
  TREES,
} from "@/game/cityLayout";

function Building({
  x,
  z,
  w,
  d,
  h,
  color,
  neon,
}: (typeof BUILDINGS)[number]) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow={false}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* roof cap */}
      <mesh position={[0, h + 0.15, 0]}>
        <boxGeometry args={[w * 0.7, 0.3, d * 0.7]} />
        <meshStandardMaterial color="#161a33" />
      </mesh>
      {/* neon sign strip facing the nearest road */}
      <mesh
        position={[
          x > 0 ? -w / 2 - 0.02 : w / 2 + 0.02,
          h * 0.55,
          0,
        ]}
        rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
      >
        <planeGeometry args={[Math.min(d * 0.6, 2.6), 0.45]} />
        <meshStandardMaterial
          color={neon}
          emissive={neon}
          emissiveIntensity={1.6}
        />
      </mesh>
      {/* lit window rows */}
      <mesh
        position={[0, h * 0.45, z > 0 ? -d / 2 - 0.02 : d / 2 + 0.02]}
        rotation={[0, z > 0 ? Math.PI : 0, 0]}
      >
        <planeGeometry args={[w * 0.75, h * 0.55]} />
        <meshStandardMaterial
          color="#0e1226"
          emissive="#ffb677"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 1, 6]} />
        <meshStandardMaterial color="#4a3b32" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.85, 1.9, 6]} />
        <meshStandardMaterial color="#2f7d5c" />
      </mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.8, 6]} />
        <meshStandardMaterial color="#3a4062" />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffca7a"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

export default function CityScene() {
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#1b2033" />
      </mesh>
      {/* roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[5, 70]} />
        <meshStandardMaterial color="#141726" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[70, 5]} />
        <meshStandardMaterial color="#141726" />
      </mesh>
      {/* road center glow strips */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.12, 70]} />
        <meshStandardMaterial
          color="#4dd6ff"
          emissive="#4dd6ff"
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[70, 0.12]} />
        <meshStandardMaterial
          color="#ff5c8a"
          emissive="#ff5c8a"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* plaza disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial color="#20263f" />
      </mesh>

      {/* fountain */}
      <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[FOUNTAIN.radius, FOUNTAIN.radius + 0.2, 0.6, 20]} />
          <meshStandardMaterial color="#2c3357" />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[FOUNTAIN.radius - 0.25, 20]} />
          <meshStandardMaterial
            color="#3ec8e8"
            emissive="#3ec8e8"
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 1, 8]} />
          <meshStandardMaterial color="#39406b" />
        </mesh>
      </group>

      {/* Rex's noodle stall */}
      <group position={[STALL.x, 0, STALL.z]}>
        <mesh position={[0, STALL.h / 2 - 0.4, 0]}>
          <boxGeometry args={[STALL.w, STALL.h - 0.8, STALL.d]} />
          <meshStandardMaterial color="#5b3a4a" />
        </mesh>
        <mesh position={[0, STALL.h + 0.05, 0]}>
          <boxGeometry args={[STALL.w + 0.5, 0.14, STALL.d + 0.5]} />
          <meshStandardMaterial color="#c8455f" />
        </mesh>
        <mesh position={[STALL.w / 2 + 0.02, STALL.h - 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 0.4]} />
          <meshStandardMaterial
            color="#ffd166"
            emissive="#ffd166"
            emissiveIntensity={1.8}
          />
        </mesh>
      </group>

      {BUILDINGS.map((bd, i) => (
        <Building key={i} {...bd} />
      ))}
      {TREES.map((t, i) => (
        <Tree key={i} {...t} />
      ))}
      {LAMPS.map((l, i) => (
        <Lamp key={i} {...l} />
      ))}
    </group>
  );
}
