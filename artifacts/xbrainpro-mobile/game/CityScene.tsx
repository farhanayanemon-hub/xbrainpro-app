import React, { useMemo } from "react";
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three";

import { resolveTexture } from "@/game/assetResolver";
import { GROUND_SIZE, WORLD_BOUND, type BuildingDef } from "@/game/cityLayout";
import { useTexture } from "@/game/drei";
import House from "@/game/House";
import Model from "@/game/Model";
import { BUILDING_NATIVE_FOOTPRINT, type TextureId } from "@/game/models";
import type { FountainDef, ParsedWorldMap, StallDef } from "@/game/worldMap";

/** Load a bundled ground texture and give it its own repeat settings. */
function useGroundTexture(id: TextureId, rx: number, ry: number): Texture {
  const tex = useTexture(resolveTexture(id)) as Texture;
  return useMemo(() => {
    const t = tex.clone();
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }, [tex, rx, ry]);
}

function Building(bd: BuildingDef) {
  const sx = bd.w / BUILDING_NATIVE_FOOTPRINT;
  const sz = bd.d / BUILDING_NATIVE_FOOTPRINT;
  const sy = bd.h / bd.nativeH;
  return (
    <Model
      id={bd.model}
      position={[bd.x, 0, bd.z]}
      rotationY={bd.rotY}
      scale={[sx, sy, sz]}
    />
  );
}

function Fountain({ f }: { f: FountainDef }) {
  return (
    <group position={[f.x, 0, f.z]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[f.radius, f.radius + 0.2, 0.6, 24]} />
        <meshStandardMaterial color="#a7abb3" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[f.radius - 0.25, 24]} />
        <meshStandardMaterial
          color="#4db3d4"
          emissive="#1d6a85"
          emissiveIntensity={0.25}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1, 10]} />
        <meshStandardMaterial color="#8f939b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Stall({ s }: { s: StallDef }) {
  return (
    <group position={[s.x, 0, s.z]}>
      <mesh position={[0, s.h / 2 - 0.4, 0]} castShadow>
        <boxGeometry args={[s.w, s.h - 0.8, s.d]} />
        <meshStandardMaterial color="#8a5a36" roughness={0.85} />
      </mesh>
      <mesh position={[0, s.h + 0.05, 0]} castShadow>
        <boxGeometry args={[s.w + 0.5, 0.14, s.d + 0.5]} />
        <meshStandardMaterial color="#c8455f" roughness={0.7} />
      </mesh>
      <mesh
        position={[s.w / 2 + 0.02, s.h - 0.55, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[1.2, 0.4]} />
        <meshStandardMaterial
          color="#ffd166"
          emissive="#ffd166"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

/** Dashed center-line segments, skipping the plaza circle. */
const DASH_POSITIONS: number[] = [];
for (let p = -GROUND_SIZE / 2 + 4; p <= GROUND_SIZE / 2 - 4; p += 3) {
  if (Math.abs(p) > 9) DASH_POSITIONS.push(p);
}

/** Low perimeter wall so the world edge feels contained, not a void. */
function PerimeterWalls() {
  const b = WORLD_BOUND + 1;
  const len = b * 2;
  const wy = 0.9;
  return (
    <group>
      {[-b, b].map((z) => (
        <mesh key={`pz${z}`} position={[0, wy, z]} castShadow receiveShadow>
          <boxGeometry args={[len, wy * 2, 0.4]} />
          <meshStandardMaterial color="#6f7f6a" roughness={0.95} />
        </mesh>
      ))}
      {[-b, b].map((x) => (
        <mesh key={`px${x}`} position={[x, wy, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, wy * 2, len]} />
          <meshStandardMaterial color="#6f7f6a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export default function CityScene({
  map,
  homePlot = null,
}: {
  map: ParsedWorldMap;
  homePlot?: number | null;
}) {
  const grass = useGroundTexture("grass", 14, 14);
  const asphaltV = useGroundTexture("asphalt", 1, 14);
  const asphaltH = useGroundTexture("asphalt", 14, 1);
  const pavingPlaza = useGroundTexture("paving", 6, 6);
  const pavingWalkV = useGroundTexture("paving", 1, 24);
  const pavingWalkH = useGroundTexture("paving", 24, 1);

  return (
    <group>
      {/* grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial map={grass} color="#b8c9a0" />
      </mesh>

      {/* asphalt roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5, GROUND_SIZE]} />
        <meshStandardMaterial map={asphaltV} color="#9c9c9c" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, 5]} />
        <meshStandardMaterial map={asphaltH} color="#9c9c9c" />
      </mesh>

      {/* sidewalks along both roads */}
      {[3.4, -3.4].map((x) => (
        <mesh
          key={`swv${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.04, 0]}
          receiveShadow
        >
          <planeGeometry args={[1.8, GROUND_SIZE]} />
          <meshStandardMaterial map={pavingWalkV} color="#cfcabe" />
        </mesh>
      ))}
      {[3.4, -3.4].map((z) => (
        <mesh
          key={`swh${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.04, z]}
          receiveShadow
        >
          <planeGeometry args={[GROUND_SIZE, 1.8]} />
          <meshStandardMaterial map={pavingWalkH} color="#cfcabe" />
        </mesh>
      ))}

      {/* dashed lane markings */}
      {DASH_POSITIONS.map((z) => (
        <mesh
          key={`dv${z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.06, z]}
        >
          <planeGeometry args={[0.14, 1.3]} />
          <meshStandardMaterial color="#e8e6da" />
        </mesh>
      ))}
      {DASH_POSITIONS.map((x) => (
        <mesh
          key={`dh${x}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.06, 0]}
        >
          <planeGeometry args={[1.3, 0.14]} />
          <meshStandardMaterial color="#e8e6da" />
        </mesh>
      ))}

      {/* paved plaza over the crossing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
        <circleGeometry args={[8, 40]} />
        <meshStandardMaterial map={pavingPlaza} color="#d8d2c4" />
      </mesh>

      {/* fountains */}
      {map.fountains.map((f, i) => (
        <Fountain key={`fountain${i}`} f={f} />
      ))}

      {/* market stalls */}
      {map.stalls.map((s, i) => (
        <Stall key={`stall${i}`} s={s} />
      ))}

      {/* residential houses */}
      {map.houses.map((hh) => (
        <House key={`house${hh.plot}`} house={hh} isHome={hh.plot === homePlot} />
      ))}

      {/* perimeter wall */}
      <PerimeterWalls />

      {/* buildings */}
      {map.buildings.map((bd, i) => (
        <Building key={`b${i}-${bd.model}`} {...bd} />
      ))}

      {/* trees */}
      {map.trees.map((t, i) => (
        <Model
          key={`tree${i}`}
          id={t.model}
          position={[t.x, 0, t.z]}
          rotationY={t.rotY}
          scale={t.scale}
        />
      ))}

      {/* streetlights */}
      {map.lamps.map((l, i) => (
        <Model
          key={`lamp${i}`}
          id={l.model}
          position={[l.x, 0, l.z]}
          rotationY={l.rotY}
          scale={l.scale}
        />
      ))}

      {/* street props */}
      {map.props.map((p, i) => (
        <Model
          key={`prop${i}`}
          id={p.model}
          position={[p.x, 0, p.z]}
          rotationY={p.rotY}
          scale={p.scale}
        />
      ))}

      {/* rooftop props */}
      {map.roofProps.map((p, i) => (
        <Model
          key={`roof${i}`}
          id={p.model}
          position={[p.x, p.y, p.z]}
          rotationY={p.rotY}
          scale={p.scale}
        />
      ))}

      {/* parked cars */}
      {map.cars.map((c, i) => (
        <Model
          key={`car${i}`}
          id={c.model}
          position={[c.x, 0, c.z]}
          rotationY={c.rotY}
          scale={c.scale}
        />
      ))}
    </group>
  );
}
