import { useCallback, useEffect, useRef, useState } from "react";

import {
  getApartment,
  saveApartment,
  type PlacedFurniture,
} from "@workspace/api-client-react";

import {
  furnitureCatalog,
  makePlacement,
  type FurnitureDef,
} from "@/game/furniture";
import { getManifest } from "@/game/assetManifest";
import { ensureZoneCached } from "@/game/resources";

const MAX_FURNITURE = 40;
/** Keep pieces inside the room walls (matches server ROOM_BOUND). */
const ROOM_BOUND = 3.9;
const MOVE_STEP = 0.35;
const ROT_STEP = Math.PI / 4;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Owns the player's apartment layout: loads it on mount, tracks decorate-mode
 * state (selection + edits), and saves the whole arrangement back. The layout
 * is the single source of truth rendered by ApartmentScene and edited by the
 * ApartmentEditor overlay. Everything is re-validated server-side on save.
 */
export function useApartment() {
  const [layout, setLayout] = useState<PlacedFurniture[]>([]);
  const [editing, setEditing] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<FurnitureDef[]>(() => furnitureCatalog());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  // Latest layout for save() so it never captures a stale closure.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Load the saved layout (or the server's default starter set) once, and
  // stream any admin-uploaded apartment furniture so its GLBs are cached.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await getManifest();
        if (!cancelled) setCatalog(furnitureCatalog());
      } catch {
        // keep built-in catalog
      }
      void ensureZoneCached("apartment").catch(() => {});
      try {
        const res = await getApartment();
        if (!cancelled && Array.isArray(res?.layout)) setLayout(res.layout);
      } catch {
        // Non-fatal: an empty room is still usable; the player can decorate.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback((itemId: string) => {
    setLayout((cur) => {
      if (cur.length >= MAX_FURNITURE) return cur;
      const piece = makePlacement(itemId);
      setSelectedUid(piece.uid);
      return [...cur, piece];
    });
  }, []);

  const moveSelected = useCallback(
    (dx: number, dz: number) => {
      if (!selectedUid) return;
      setLayout((cur) =>
        cur.map((p) =>
          p.uid === selectedUid
            ? {
                ...p,
                x: clamp(p.x + dx * MOVE_STEP, -ROOM_BOUND, ROOM_BOUND),
                z: clamp(p.z + dz * MOVE_STEP, -ROOM_BOUND, ROOM_BOUND),
              }
            : p,
        ),
      );
    },
    [selectedUid],
  );

  const rotateSelected = useCallback(() => {
    if (!selectedUid) return;
    setLayout((cur) =>
      cur.map((p) =>
        p.uid === selectedUid ? { ...p, rotY: p.rotY + ROT_STEP } : p,
      ),
    );
  }, [selectedUid]);

  const deleteSelected = useCallback(() => {
    if (!selectedUid) return;
    setLayout((cur) => cur.filter((p) => p.uid !== selectedUid));
    setSelectedUid(null);
  }, [selectedUid]);

  // Select the next placed piece — a reliable way to pick one on touch devices
  // where tapping the 3D model directly may miss.
  const cycleSelect = useCallback(() => {
    setLayout((cur) => {
      if (cur.length === 0) {
        setSelectedUid(null);
        return cur;
      }
      setSelectedUid((prev) => {
        const idx = cur.findIndex((p) => p.uid === prev);
        return cur[(idx + 1) % cur.length].uid;
      });
      return cur;
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await saveApartment({ layout: layoutRef.current });
      if (Array.isArray(res?.layout)) setLayout(res.layout);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const startEditing = useCallback(() => {
    setSelectedUid(null);
    setEditing(true);
  }, []);

  return {
    layout,
    catalog,
    loaded,
    saving,
    editing,
    selectedUid,
    setSelectedUid,
    startEditing,
    setEditing,
    addItem,
    moveSelected,
    rotateSelected,
    deleteSelected,
    cycleSelect,
    save,
  };
}

export type ApartmentController = ReturnType<typeof useApartment>;
