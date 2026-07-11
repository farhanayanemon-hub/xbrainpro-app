import { useFrame } from "@react-three/fiber";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import type { Group, Mesh, Object3D } from "three";

import Avatar from "@/game/Avatar";
import { getManifest, sceneEntrySync } from "@/game/assetManifest";
import { resolveAvatar, resolvedUri } from "@/game/assetResolver";
import { useGLTF } from "@/game/drei";
import GameCanvas from "@/game/GameCanvas";
import { ensureAvatarCached } from "@/game/resources";
import colors from "@/constants/colors";

const C = colors.dark;

/** Slowly turns its children so the showcased avatar rotates like a turntable. */
function Spin({
  children,
  speed = 0.3,
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * The default lobby room — an Avakin-style apartment built from primitives so
 * it always renders (no upload required). A warm floor + rug, dark walls and a
 * glowing neon window make the character look like it's standing in a real
 * room. Admins can replace this with an uploaded GLB (scene / "lobby" slot).
 */
function DefaultRoom() {
  return (
    <>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#2a2140" roughness={0.95} />
      </mesh>
      {/* rug under the character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.2]}>
        <circleGeometry args={[2.3, 48]} />
        <meshStandardMaterial color="#3a2b57" roughness={0.95} />
      </mesh>
      {/* soft selection ring at the feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.05, 1.22, 48]} />
        <meshStandardMaterial
          color={C.primary}
          emissive={C.primary}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* back wall */}
      <mesh position={[0, 2.6, -3.2]} receiveShadow>
        <boxGeometry args={[12, 5.2, 0.2]} />
        <meshStandardMaterial color="#191630" roughness={1} />
      </mesh>
      {/* side walls */}
      <mesh position={[-4.2, 2.6, -0.6]} receiveShadow>
        <boxGeometry args={[0.2, 5.2, 5.4]} />
        <meshStandardMaterial color="#141127" roughness={1} />
      </mesh>
      <mesh position={[4.2, 2.6, -0.6]} receiveShadow>
        <boxGeometry args={[0.2, 5.2, 5.4]} />
        <meshStandardMaterial color="#141127" roughness={1} />
      </mesh>

      {/* glowing neon window on the back wall */}
      <mesh position={[0, 2.9, -3.08]}>
        <planeGeometry args={[3.6, 2.1]} />
        <meshStandardMaterial
          color={C.accent}
          emissive={C.accent}
          emissiveIntensity={0.75}
        />
      </mesh>
      {/* window mullions */}
      <mesh position={[0, 2.9, -3.06]}>
        <boxGeometry args={[0.08, 2.1, 0.02]} />
        <meshStandardMaterial color="#0c0a1c" />
      </mesh>
      <mesh position={[0, 2.9, -3.06]}>
        <boxGeometry args={[3.6, 0.08, 0.02]} />
        <meshStandardMaterial color="#0c0a1c" />
      </mesh>
    </>
  );
}

/** Loads an admin-uploaded GLB room and centers it. */
function GlbRoom({ uri }: { uri: string }) {
  const gltf = useGLTF(uri) as unknown as { scene: Object3D };
  const object = useMemo(() => {
    const o = gltf.scene.clone(true);
    o.traverse((child) => {
      if ((child as Mesh).isMesh) child.receiveShadow = true;
    });
    return o;
  }, [gltf]);
  return <primitive object={object} />;
}

/**
 * Falls back to the built-in room if the uploaded GLB fails to load, so a bad
 * scene upload can never brick the lobby.
 */
class RoomBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <DefaultRoom />;
    return this.props.children;
  }
}

/**
 * Full-screen hero that shows the player's actual 3D game character standing
 * idle in a real room (Avakin style). Reuses the same avatar GLB the player
 * controls in the city. Falls back to the profile photo when WebGL is
 * unavailable or while the model streams in.
 */
export default function LobbyAvatarStage({
  avatarId,
  fallbackPhotoUrl,
}: {
  avatarId: string;
  fallbackPhotoUrl?: string | null;
}) {
  const [ready, setReady] = useState(false);
  const [roomUri, setRoomUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setReady(false);

    // Keep retrying until the manifest resolves — a single failed getManifest()
    // (offline/startup race) must not leave the lobby stuck on the fallback.
    const attempt = async (tries: number): Promise<void> => {
      if (cancelled) return;
      await getManifest(tries > 0);
      if (cancelled) return;
      // Pick up an admin-uploaded lobby room, if one exists.
      const scene = sceneEntrySync("lobby");
      setRoomUri(scene ? resolvedUri(scene.id, scene.url) : null);
      if (resolveAvatar(avatarId)) {
        // Warm the on-device cache in the background — the CDN url already
        // renders, so don't block first paint on it.
        void ensureAvatarCached(avatarId).catch(() => {});
        setReady(true);
        return;
      }
      const delay = Math.min(1000 * 2 ** tries, 8000);
      timer = setTimeout(() => void attempt(tries + 1), delay);
    };

    void attempt(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [avatarId]);

  const photo = fallbackPhotoUrl ? (
    <View style={styles.photoWrap}>
      <Image
        source={{ uri: fallbackPhotoUrl }}
        style={styles.photo}
        resizeMode="contain"
      />
    </View>
  ) : null;

  return (
    <View style={styles.stage}>
      <Backdrop />
      {ready ? (
        <GameCanvas
          camera={{ position: [0, 1.55, 5.6], fov: 42 }}
          fallback={photo}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 6, 5]} intensity={1.7} castShadow />
          <directionalLight position={[-4, 3, -2]} intensity={0.9} color={C.primary} />
          <pointLight position={[0, 3.2, -2.6]} intensity={1.1} color={C.accent} />
          <pointLight position={[0, 2.2, 2.6]} intensity={0.5} color="#ffd9a8" />

          <React.Suspense fallback={<DefaultRoom />}>
            {roomUri ? (
              <RoomBoundary>
                <GlbRoom uri={roomUri} />
              </RoomBoundary>
            ) : (
              <DefaultRoom />
            )}
          </React.Suspense>

          <Spin>
            <React.Suspense fallback={null}>
              <Avatar avatarId={avatarId} getMotion={() => 0} />
            </React.Suspense>
          </Spin>
        </GameCanvas>
      ) : (
        <View style={styles.loadingWrap}>
          {photo}
          <ActivityIndicator color={C.primary} style={styles.spinner} />
        </View>
      )}
    </View>
  );
}

/**
 * Static neon backdrop rendered behind the 3D character. Keeps the lobby from
 * ever looking like an empty app before the 3D scene streams in or when WebGL
 * is unavailable.
 */
function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#0a0c1c", "#111634", "#2a1c46"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowOuter} />
      <View style={styles.glowInner} />
      <LinearGradient
        colors={["transparent", "rgba(255,92,138,0.16)", "rgba(139,92,246,0.10)"]}
        style={styles.floor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { ...StyleSheet.absoluteFillObject, backgroundColor: C.background },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { position: "absolute", bottom: 70 },
  glowOuter: {
    position: "absolute",
    alignSelf: "center",
    top: "18%",
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: "rgba(255,92,138,0.10)",
  },
  glowInner: {
    position: "absolute",
    alignSelf: "center",
    top: "26%",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(139,92,246,0.14)",
  },
  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "34%",
  },
  photoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  photo: { width: "58%", height: "78%", opacity: 0.92 },
});
