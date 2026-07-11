import type { PlacedFurniture } from "@workspace/api-client-react";

import { apartmentModelsSync } from "@/game/assetManifest";

export type { PlacedFurniture };

/**
 * A furniture item the player can place. Built-ins are drawn from primitives
 * (always available, no upload needed); "model" items are admin-uploaded GLBs
 * in the "apartment" asset zone. `id` must match the server's BUILTIN_FURNITURE
 * set for built-ins, or the asset id for models.
 */
export interface FurnitureDef {
  id: string;
  label: string;
  icon: string;
  kind: "builtin" | "model";
}

/**
 * Built-in starter furniture. Keep the ids in sync with the server's
 * BUILTIN_FURNITURE set (artifacts/api-server/src/lib/apartment.ts).
 */
export const BUILTIN_FURNITURE: FurnitureDef[] = [
  { id: "bed", label: "Bed", icon: "🛏️", kind: "builtin" },
  { id: "sofa", label: "Sofa", icon: "🛋️", kind: "builtin" },
  { id: "armchair", label: "Armchair", icon: "💺", kind: "builtin" },
  { id: "table", label: "Table", icon: "🍽️", kind: "builtin" },
  { id: "rug", label: "Rug", icon: "🟪", kind: "builtin" },
  { id: "plant", label: "Plant", icon: "🪴", kind: "builtin" },
  { id: "lamp", label: "Lamp", icon: "💡", kind: "builtin" },
  { id: "bookshelf", label: "Bookshelf", icon: "📚", kind: "builtin" },
  { id: "tv", label: "TV", icon: "📺", kind: "builtin" },
];

const BUILTIN_IDS = new Set(BUILTIN_FURNITURE.map((f) => f.id));

export function isBuiltinFurniture(id: string): boolean {
  return BUILTIN_IDS.has(id);
}

/**
 * The full palette the player can add from: built-in starters plus any
 * admin-uploaded models in the "apartment" zone (which appear once the manifest
 * has loaded). De-duped by id, built-ins first.
 */
export function furnitureCatalog(): FurnitureDef[] {
  const models = apartmentModelsSync().map<FurnitureDef>((m) => ({
    id: m.id,
    label: m.label,
    icon: "🪑",
    kind: "model",
  }));
  return [...BUILTIN_FURNITURE, ...models];
}

let uidCounter = 0;

/** A collision-free instance id for a newly placed piece. */
export function newFurnitureUid(): string {
  uidCounter += 1;
  return `f-${Date.now().toString(36)}-${uidCounter}`;
}

/** Make a fresh placed piece at the room centre for the given catalog item. */
export function makePlacement(itemId: string): PlacedFurniture {
  return { uid: newFurnitureUid(), item: itemId, x: 0, z: 0, rotY: 0 };
}
