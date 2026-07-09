/**
 * Asset manifest for the 3D world. All models are CC0 (KayKit City Builder
 * Bits + KayKit Medieval Hexagon trees) converted to GLB; ground textures are
 * CC0 from ambientCG. Swapping a model only requires changing this file.
 */

export const MODEL_SOURCES = {
  buildingA: require("../assets/models/building_A.glb"),
  buildingD: require("../assets/models/building_D.glb"),
  buildingE: require("../assets/models/building_E.glb"),
  buildingF: require("../assets/models/building_F.glb"),
  buildingG: require("../assets/models/building_G.glb"),
  buildingH: require("../assets/models/building_H.glb"),
  treeA: require("../assets/models/tree_single_A.glb"),
  treeB: require("../assets/models/tree_single_B.glb"),
  treeCluster: require("../assets/models/trees_A_medium.glb"),
  bush: require("../assets/models/bush.glb"),
  streetlight: require("../assets/models/streetlight.glb"),
  bench: require("../assets/models/bench.glb"),
  firehydrant: require("../assets/models/firehydrant.glb"),
  dumpster: require("../assets/models/dumpster.glb"),
  trash: require("../assets/models/trash_A.glb"),
  watertower: require("../assets/models/watertower.glb"),
  trafficlight: require("../assets/models/trafficlight_A.glb"),
  carSedan: require("../assets/models/car_sedan.glb"),
  carTaxi: require("../assets/models/car_taxi.glb"),
  carHatchback: require("../assets/models/car_hatchback.glb"),
} as const;

export type ModelId = keyof typeof MODEL_SOURCES;

export const TEXTURE_SOURCES = {
  grass: require("../assets/textures/grass.jpg"),
  paving: require("../assets/textures/paving.jpg"),
  asphalt: require("../assets/textures/asphalt.jpg"),
} as const;

export type TextureId = keyof typeof TEXTURE_SOURCES;

/**
 * Native (unscaled) sizes of the building models, measured from the GLB
 * bounding boxes. Footprints are all 2x2 world units.
 */
export const BUILDING_MODELS: { id: ModelId; nativeH: number }[] = [
  { id: "buildingA", nativeH: 1.65 },
  { id: "buildingD", nativeH: 2.97 },
  { id: "buildingE", nativeH: 2.35 },
  { id: "buildingF", nativeH: 2.35 },
  { id: "buildingG", nativeH: 2.98 },
  { id: "buildingH", nativeH: 3.05 },
];

/** Footprint (in native units) of every building model. */
export const BUILDING_NATIVE_FOOTPRINT = 2;
