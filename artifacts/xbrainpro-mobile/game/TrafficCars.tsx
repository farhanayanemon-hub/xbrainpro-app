import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import type { Group } from "three";

import Model from "@/game/Model";
import type { ModelId } from "@/game/models";
import { WORLD_BOUND } from "@/game/cityLayout";

/**
 * Purely visual cars that loop along the two main roads. They don't collide
 * with the player (the roads stay walkable) — they just make the city feel
 * alive. Positions are driven by refs in useFrame so there are no React
 * re-renders every tick.
 */

interface TrafficDef {
  model: ModelId;
  /** "v" drives along the north-south road (varies z), "h" east-west (x). */
  axis: "v" | "h";
  /** Fixed lane offset on the other axis. */
  lane: number;
  /** Units per second; sign sets direction. */
  speed: number;
  /** Starting position along the travel axis. */
  start: number;
}

const SPAN = WORLD_BOUND + 2;

const TRAFFIC: TrafficDef[] = [
  { model: "carSedan", axis: "v", lane: -1.4, speed: 6, start: -SPAN },
  { model: "carTaxi", axis: "v", lane: 1.4, speed: -5, start: 10 },
  { model: "carHatchback", axis: "h", lane: 1.4, speed: 5.5, start: -SPAN * 0.4 },
  { model: "carSedan", axis: "h", lane: -1.4, speed: -6.5, start: SPAN * 0.6 },
];

function TrafficCar({ def }: { def: TrafficDef }) {
  const ref = useRef<Group>(null);
  const pos = useRef(def.start);
  // Face the direction of travel. Along +z (axis v, speed>0) heading is 0;
  // along -z it's π. Along +x it's π/2, along -x it's -π/2.
  const rotY =
    def.axis === "v"
      ? def.speed > 0
        ? 0
        : Math.PI
      : def.speed > 0
        ? Math.PI / 2
        : -Math.PI / 2;

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    pos.current += def.speed * delta;
    // Wrap around so cars loop endlessly.
    if (pos.current > SPAN) pos.current = -SPAN;
    else if (pos.current < -SPAN) pos.current = SPAN;
    if (ref.current) {
      if (def.axis === "v") ref.current.position.set(def.lane, 0, pos.current);
      else ref.current.position.set(pos.current, 0, def.lane);
    }
  });

  return (
    <group ref={ref} rotation={[0, rotY, 0]}>
      <Model id={def.model} position={[0, 0, 0]} scale={4} />
    </group>
  );
}

export default function TrafficCars() {
  return (
    <>
      {TRAFFIC.map((def, i) => (
        <TrafficCar key={i} def={def} />
      ))}
    </>
  );
}
