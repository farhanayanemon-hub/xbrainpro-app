import React from "react";

import CityScene from "@/game/CityScene";
import Npc from "@/game/Npc";
import { NPCS } from "@/game/npcs";
import Player from "@/game/Player";

export default function WorldScene({
  onNearNpc,
}: {
  onNearNpc: (npcId: string | null) => void;
}) {
  return (
    <>
      <color attach="background" args={["#292345"]} />
      <fog attach="fog" args={["#292345", 26, 60]} />
      <ambientLight intensity={0.55} color="#b6a8ff" />
      <directionalLight
        position={[-14, 18, 8]}
        intensity={1.15}
        color="#ffb079"
      />
      <pointLight position={[3, 4, -3]} intensity={22} color="#ff5c8a" />
      <pointLight position={[-9, 4, 4]} intensity={18} color="#4dd6ff" />
      <CityScene />
      {NPCS.map((n) => (
        <Npc key={n.id} npc={n} />
      ))}
      <Player onNearNpc={onNearNpc} />
    </>
  );
}
