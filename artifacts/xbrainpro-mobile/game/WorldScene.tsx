import React, { useEffect } from "react";

import CityScene from "@/game/CityScene";
import { Sky } from "@/game/drei";
import Npc from "@/game/Npc";
import Player from "@/game/Player";
import type { ParsedWorldMap } from "@/game/worldMap";

const SUN_POSITION: [number, number, number] = [35, 42, -20];

export default function WorldScene({
  map,
  avatarId,
  onNearNpc,
  onLoaded,
}: {
  map: ParsedWorldMap;
  avatarId: string;
  onNearNpc: (npcId: string | null) => void;
  /** Fires once all suspended assets (models, textures) are ready. */
  onLoaded?: () => void;
}) {
  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

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
      <CityScene map={map} />
      {map.npcs.map((n) => (
        <Npc key={n.id} npc={n} />
      ))}
      <Player avatarId={avatarId} onNearNpc={onNearNpc} />
    </>
  );
}
