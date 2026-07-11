import React, { useMemo } from "react";
import type { Mesh, Object3D } from "three";

import { apartmentModelEntrySync } from "@/game/assetManifest";
import { resolvedUri } from "@/game/assetResolver";
import { useGLTF } from "@/game/drei";

/** Placeholder box shown when an uploaded furniture model can't be resolved. */
function MissingBox() {
  return (
    <mesh position={[0, 0.4, 0]} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#8a6bb0" roughness={0.8} />
    </mesh>
  );
}

/**
 * Loads an admin-uploaded GLB furniture piece (asset zone "apartment") by its
 * id and drops it at the group origin. Mirrors the lobby's GlbRoom pattern:
 * resolve the on-device cached copy if present, else stream the manifest CDN
 * url. Rendered inside a FurnitureBoundary so a bad model never crashes the room.
 */
export default function FurnitureModel({ id }: { id: string }) {
  const entry = apartmentModelEntrySync(id);
  const uri = entry ? resolvedUri(entry.id, entry.url) : "";
  if (!uri) return <MissingBox />;
  return <GlbFurniture uri={uri} />;
}

function GlbFurniture({ uri }: { uri: string }) {
  const gltf = useGLTF(uri) as unknown as { scene: Object3D };
  const object = useMemo(() => {
    const o = gltf.scene.clone(true);
    o.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return o;
  }, [gltf]);
  return <primitive object={object} />;
}

/**
 * Falls back to a placeholder if a furniture GLB fails to load, so one broken
 * upload can never brick the apartment room.
 */
export class FurnitureBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <MissingBox />;
    return this.props.children;
  }
}
