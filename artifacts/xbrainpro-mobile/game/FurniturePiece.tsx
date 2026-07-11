import React from "react";
import type { ThreeEvent } from "@react-three/fiber";

import FurnitureModel, { FurnitureBoundary } from "@/game/FurnitureModel";
import { isBuiltinFurniture, type PlacedFurniture } from "@/game/furniture";

/* -------------------------------------------------------------------------- */
/* Built-in furniture, drawn from primitives (always available, no upload)     */
/* -------------------------------------------------------------------------- */

function Bed() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.55, 2.6]} />
        <meshStandardMaterial color="#6d8ab0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.62, -0.8]} castShadow>
        <boxGeometry args={[1.5, 0.22, 0.7]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0.4]} castShadow>
        <boxGeometry args={[1.9, 0.18, 1.4]} />
        <meshStandardMaterial color="#c8455f" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Sofa() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.4, 0.9]} />
        <meshStandardMaterial color="#4f7a6a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.62, -0.34]} castShadow>
        <boxGeometry args={[2.2, 0.7, 0.28]} />
        <meshStandardMaterial color="#5c8c79" roughness={0.85} />
      </mesh>
      {[-0.98, 0.98].map((x) => (
        <mesh key={x} position={[x, 0.56, 0]} castShadow>
          <boxGeometry args={[0.26, 0.5, 0.9]} />
          <meshStandardMaterial color="#42665a" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Armchair() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.4, 0.9]} />
        <meshStandardMaterial color="#b5713f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.62, -0.34]} castShadow>
        <boxGeometry args={[0.95, 0.7, 0.26]} />
        <meshStandardMaterial color="#c47f49" roughness={0.85} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.56, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.9]} />
          <meshStandardMaterial color="#a5652f" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Table() {
  return (
    <group>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.1, 0.9]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.7} />
      </mesh>
      {[
        [-0.6, -0.35],
        [0.6, -0.35],
        [-0.6, 0.35],
        [0.6, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.1, 0.72, 0.1]} />
          <meshStandardMaterial color="#6f4626" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[2.4, 1.6]} />
      <meshStandardMaterial color="#8a6bb0" roughness={0.9} />
    </mesh>
  );
}

function Plant() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.5, 12]} />
        <meshStandardMaterial color="#b3502f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#3f8f4f" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Lamp() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.35, 0.4, 16]} />
        <meshStandardMaterial
          color="#ffe6bd"
          emissive="#ffcf8a"
          emissiveIntensity={0.6}
        />
      </mesh>
      <pointLight position={[0, 1.5, 0]} intensity={0.7} distance={6} color="#ffe6bd" />
    </group>
  );
}

function Bookshelf() {
  return (
    <group>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 2.0, 0.4]} />
        <meshStandardMaterial color="#6f4626" roughness={0.8} />
      </mesh>
      {[0.5, 1.0, 1.5].map((y) => (
        <mesh key={y} position={[0, y, 0.05]}>
          <boxGeometry args={[1.1, 0.06, 0.34]} />
          <meshStandardMaterial color="#4d2f18" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Tv() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.5, 0.35]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.8, 1.0, 0.1]} />
        <meshStandardMaterial
          color="#0c0a1c"
          emissive="#2a3a6a"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function BuiltinFurniture({ id }: { id: string }) {
  switch (id) {
    case "bed":
      return <Bed />;
    case "sofa":
      return <Sofa />;
    case "armchair":
      return <Armchair />;
    case "table":
      return <Table />;
    case "rug":
      return <Rug />;
    case "plant":
      return <Plant />;
    case "lamp":
      return <Lamp />;
    case "bookshelf":
      return <Bookshelf />;
    case "tv":
      return <Tv />;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Placed piece: positions + rotates a catalog item, handles selection         */
/* -------------------------------------------------------------------------- */

export default function FurniturePiece({
  piece,
  editing,
  selected,
  onSelect,
}: {
  piece: PlacedFurniture;
  editing: boolean;
  selected: boolean;
  onSelect: (uid: string) => void;
}) {
  const handleClick = editing
    ? (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(piece.uid);
      }
    : undefined;

  return (
    <group
      position={[piece.x, 0, piece.z]}
      rotation={[0, piece.rotY, 0]}
      onClick={handleClick}
    >
      {isBuiltinFurniture(piece.item) ? (
        <BuiltinFurniture id={piece.item} />
      ) : (
        <FurnitureBoundary>
          <FurnitureModel id={piece.item} />
        </FurnitureBoundary>
      )}

      {/* Selection ring under the piece while decorating. */}
      {editing && selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color="#7cf0c2" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
