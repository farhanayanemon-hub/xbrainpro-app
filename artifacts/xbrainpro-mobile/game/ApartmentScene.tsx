import React from "react";

import FurniturePiece from "@/game/FurniturePiece";
import type { PlacedFurniture } from "@/game/furniture";
import Player from "@/game/Player";
import { INTERIOR_HALF, type Interactable } from "@/game/worldMap";

const WALL_H = 3.2;
const HALF = INTERIOR_HALF;

/**
 * The player's personal apartment: the same room shell as before (floor, four
 * walls) but now furnished entirely from the player's saved layout instead of a
 * hard-coded bed. In decorate mode each piece is selectable and a selection
 * ring appears under the active one.
 */
export default function ApartmentScene({
  avatarId,
  layout,
  editing,
  selectedUid,
  onSelectFurniture,
  onNearInteract,
}: {
  avatarId: string;
  layout: PlacedFurniture[];
  editing: boolean;
  selectedUid: string | null;
  onSelectFurniture: (uid: string) => void;
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

      {/* the player's furniture */}
      {layout.map((piece) => (
        <FurniturePiece
          key={piece.uid}
          piece={piece}
          editing={editing}
          selected={piece.uid === selectedUid}
          onSelect={onSelectFurniture}
        />
      ))}

      <Player
        avatarId={avatarId}
        onNearNpc={() => {}}
        onNearInteract={onNearInteract}
      />
    </>
  );
}
