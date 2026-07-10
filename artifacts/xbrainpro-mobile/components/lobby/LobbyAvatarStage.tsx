import { useFrame } from "@react-three/fiber";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import type { Group } from "three";

import Avatar from "@/game/Avatar";
import { getManifest } from "@/game/assetManifest";
import { resolveAvatar } from "@/game/assetResolver";
import GameCanvas from "@/game/GameCanvas";
import { ensureAvatarCached } from "@/game/resources";
import colors from "@/constants/colors";

const C = colors.dark;

/** Slowly turns its children so the showcased avatar rotates like a turntable. */
function Spin({
  children,
  speed = 0.4,
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
 * Static neon backdrop rendered behind the 3D character. It gives the lobby a
 * "game stage" feel (dusk gradient + spotlight glow + floor) so the screen
 * never looks like an empty app — even before the 3D avatar streams in or if
 * WebGL is unavailable.
 */
function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["#0a0c1c", "#111634", "#2a1c46"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Spotlight glow behind the character */}
      <View style={styles.glowOuter} />
      <View style={styles.glowInner} />
      {/* Floor light band */}
      <LinearGradient
        colors={["transparent", "rgba(255,92,138,0.16)", "rgba(139,92,246,0.10)"]}
        style={styles.floor}
      />
    </View>
  );
}

/**
 * Full-screen hero that shows the player's actual 3D game character standing
 * idle on a glowing podium (Free Fire style). Reuses the same avatar GLB the
 * player controls in the city. Falls back to the profile photo when WebGL is
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
          camera={{ position: [0, 1.15, 4.4], fov: 40 }}
          fallback={photo}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
          <directionalLight
            position={[-4, 3, -2]}
            intensity={1.0}
            color={C.primary}
          />
          <pointLight position={[0, 2.2, 2.6]} intensity={0.8} color={C.accent} />
          <Spin>
            <React.Suspense fallback={null}>
              <Avatar avatarId={avatarId} getMotion={() => 0} />
            </React.Suspense>
            <mesh
              position={[0, 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[1.15, 48]} />
              <meshStandardMaterial color="#0d1230" />
            </mesh>
            <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.12, 1.28, 48]} />
              <meshStandardMaterial
                color={C.primary}
                emissive={C.primary}
                emissiveIntensity={1.6}
              />
            </mesh>
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
