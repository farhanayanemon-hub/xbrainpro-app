import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect } from "react";
import { Vector3 } from "three";

import { localHead } from "@/game/bubbles";
import type { HouseDef } from "@/game/cityLayout";
import ApartmentScene from "@/game/ApartmentScene";
import CityScene from "@/game/CityScene";
import { Sky } from "@/game/drei";
import type { PlacedFurniture } from "@/game/furniture";
import Npc from "@/game/Npc";
import Player from "@/game/Player";
import RemotePlayer from "@/game/RemotePlayer";
import { game } from "@/game/store";
import TrafficCars from "@/game/TrafficCars";
import type { Interactable, ParsedWorldMap } from "@/game/worldMap";

const SUN_POSITION: [number, number, number] = [35, 42, -20];

const _localHeadV = new Vector3();

/**
 * Projects the local player's head to screen pixels every frame so the RN
 * overlay can draw the player's own chat bubble in the right spot.
 */
function LocalHeadProjector() {
  const { camera, size } = useThree();
  useFrame(() => {
    _localHeadV.set(game.player.x, 2.35, game.player.z);
    _localHeadV.project(camera);
    localHead.sx = (_localHeadV.x * 0.5 + 0.5) * size.width;
    localHead.sy = (-_localHeadV.y * 0.5 + 0.5) * size.height;
    localHead.visible = _localHeadV.z <= 1;
  });
  return null;
}

/** A glowing marker floating above the player's own house. */
function HomeBeacon({ house }: { house: HouseDef }) {
  const h = house;
  return (
    <group position={[h.x, h.h + 2.6, h.z]}>
      <mesh>
        <coneGeometry args={[0.6, 1.2, 4]} />
        <meshStandardMaterial
          color="#7cf0c2"
          emissive="#2fae87"
          emissiveIntensity={0.9}
        />
      </mesh>
      <pointLight color="#7cf0c2" intensity={1.2} distance={10} />
    </group>
  );
}

export default function WorldScene({
  map,
  avatarId,
  inside,
  homePlot,
  remoteIds,
  apartmentLayout,
  editingApartment,
  selectedFurnitureUid,
  onSelectFurniture,
  onNearNpc,
  onNearInteract,
  onLoaded,
}: {
  map: ParsedWorldMap;
  avatarId: string;
  inside: boolean;
  homePlot: number | null;
  /** Ids of other online players to render (only shown while outside). */
  remoteIds: string[];
  /** Furniture placed in the player's apartment (rendered while inside). */
  apartmentLayout: PlacedFurniture[];
  editingApartment: boolean;
  selectedFurnitureUid: string | null;
  onSelectFurniture: (uid: string) => void;
  onNearNpc: (npcId: string | null) => void;
  onNearInteract: (it: Interactable | null) => void;
  /** Fires once all suspended assets (models, textures) are ready. */
  onLoaded?: () => void;
}) {
  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  if (inside) {
    return (
      <ApartmentScene
        avatarId={avatarId}
        layout={apartmentLayout}
        editing={editingApartment}
        selectedUid={selectedFurnitureUid}
        onSelectFurniture={onSelectFurniture}
        onNearInteract={onNearInteract}
      />
    );
  }

  return (
    <>
      <fog attach="fog" args={["#cfe3f7", 32, 95]} />
      <Sky
        distance={450}
        sunPosition={SUN_POSITION}
        turbidity={6}
        rayleigh={2.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={["#bcd8ff", "#8c9a72", 0.85]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        castShadow
        position={SUN_POSITION}
        intensity={2.1}
        color="#fff2dd"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
      />
      <CityScene map={map} homePlot={homePlot} />
      <TrafficCars />
      {homePlot !== null &&
        (() => {
          const h = map.houses.find((hh) => hh.plot === homePlot);
          return h ? <HomeBeacon house={h} /> : null;
        })()}
      {map.npcs.map((n) => (
        <Npc key={n.id} npc={n} />
      ))}
      {remoteIds.map((id) => (
        <RemotePlayer key={id} id={id} />
      ))}
      <LocalHeadProjector />
      <Player
        avatarId={avatarId}
        onNearNpc={onNearNpc}
        onNearInteract={onNearInteract}
      />
    </>
  );
}
