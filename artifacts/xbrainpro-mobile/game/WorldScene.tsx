import React, { useEffect } from "react";

import type { HouseDef } from "@/game/cityLayout";
import CityScene from "@/game/CityScene";
import { Sky } from "@/game/drei";
import InteriorScene from "@/game/InteriorScene";
import Npc from "@/game/Npc";
import Player from "@/game/Player";
import RemotePlayer from "@/game/RemotePlayer";
import TrafficCars from "@/game/TrafficCars";
import type { Interactable, ParsedWorldMap } from "@/game/worldMap";

const SUN_POSITION: [number, number, number] = [35, 42, -20];

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
      <InteriorScene avatarId={avatarId} onNearInteract={onNearInteract} />
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
      <Player
        avatarId={avatarId}
        onNearNpc={onNearNpc}
        onNearInteract={onNearInteract}
      />
    </>
  );
}
