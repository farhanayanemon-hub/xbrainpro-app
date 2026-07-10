import { useFrame } from "@react-three/fiber";
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

  if (!ready) {
    return (
      <View style={styles.stage}>
        {photo}
        <ActivityIndicator color={C.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <GameCanvas camera={{ position: [0, 1.15, 4.4], fov: 40 }} fallback={photo}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 6, 4]} intensity={1.7} castShadow />
        <directionalLight position={[-4, 3, -2]} intensity={0.9} color={C.primary} />
        <pointLight position={[0, 2.2, 2.6]} intensity={0.7} color={C.accent} />
        <Spin>
          <React.Suspense fallback={null}>
            <Avatar avatarId={avatarId} getMotion={() => 0} />
          </React.Suspense>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.15, 48]} />
            <meshStandardMaterial color="#0d1230" />
          </mesh>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.12, 1.28, 48]} />
            <meshStandardMaterial
              color={C.primary}
              emissive={C.primary}
              emissiveIntensity={1.5}
            />
          </mesh>
        </Spin>
      </GameCanvas>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { position: "absolute", bottom: 60 },
  photoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  photo: { width: "60%", height: "80%", opacity: 0.9 },
});
