import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AvatarPicker from "@/components/AvatarPicker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Hud from "@/components/Hud";
import Joystick from "@/components/Joystick";
import NpcChat from "@/components/NpcChat";
import PauseMenu from "@/components/PauseMenu";
import colors, { fonts } from "@/constants/colors";
import {
  DEFAULT_AVATAR_ID,
  loadAvatarId,
  saveAvatarId,
} from "@/game/avatar";
import GameCanvas from "@/game/GameCanvas";
import { game, resetInput } from "@/game/store";
import {
  downloadResources,
  type ResourceProgress,
} from "@/game/resources";
import {
  DEFAULT_MAP,
  loadWorldMap,
  setActiveWorldMap,
  type ParsedWorldMap,
} from "@/game/worldMap";
import WorldScene from "@/game/WorldScene";

export default function NeuraCity() {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [nearNpcId, setNearNpcId] = useState<string | null>(null);
  const [chatNpcId, setChatNpcId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [worldMap, setWorldMap] = useState<ParsedWorldMap>(DEFAULT_MAP);
  const [resProgress, setResProgress] = useState<ResourceProgress>({
    done: 0,
    total: 1,
  });
  const [resourcesDone, setResourcesDone] = useState(false);

  const userPickedAvatar = useRef(false);

  // Game-style resource download step with real progress.
  useEffect(() => {
    let cancelled = false;
    downloadResources((p) => {
      if (!cancelled) setResProgress(p);
    }).finally(() => {
      if (!cancelled) setResourcesDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAvatarId().then((id) => {
      // Don't clobber a choice the user made before hydration finished.
      if (!cancelled && !userPickedAvatar.current) setAvatarId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the live world map (cache/offline fallback handled inside).
  useEffect(() => {
    let cancelled = false;
    loadWorldMap().then((map) => {
      if (cancelled) return;
      setActiveWorldMap(map);
      setWorldMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setShowLoader(false), 150);
      return () => clearTimeout(t);
    }
  }, [ready]);

  useEffect(() => {
    game.frozen = paused || pickingAvatar || chatNpcId !== null;
    if (game.frozen) resetInput();
  }, [paused, pickingAvatar, chatNpcId]);

  const onSelectAvatar = useCallback((id: string) => {
    userPickedAvatar.current = true;
    setAvatarId(id);
    void saveAvatarId(id);
  }, []);

  const onNearNpc = useCallback((id: string | null) => setNearNpcId(id), []);

  const nearNpc = useMemo(
    () => worldMap.npcs.find((n) => n.id === nearNpcId) ?? null,
    [worldMap, nearNpcId],
  );
  const chatNpc = useMemo(
    () => worldMap.npcs.find((n) => n.id === chatNpcId) ?? null,
    [worldMap, chatNpcId],
  );

  const WorldFallback = useCallback(
    ({ error }: { error?: Error }) => {
      // Shown when the 3D world crashes for any reason (WebGL or otherwise).
      return <GlUnavailable onShown={() => setReady(true)} error={error} />;
    },
    [],
  );

  return (
    <View style={styles.root}>
      <ErrorBoundary FallbackComponent={WorldFallback}>
        <GameCanvas
          fallback={<GlUnavailable onShown={() => setReady(true)} />}
        >
          <React.Suspense fallback={null}>
            <WorldScene
              map={worldMap}
              avatarId={avatarId}
              onNearNpc={onNearNpc}
              onLoaded={() => setReady(true)}
            />
          </React.Suspense>
        </GameCanvas>
      </ErrorBoundary>

      {/* joystick bottom-left */}
      <View style={[styles.joystickWrap, { bottom: 40 + insets.bottom }]}>
        <Joystick />
      </View>

      <Hud
        nearNpc={nearNpc}
        onTalk={() => nearNpc && setChatNpcId(nearNpc.id)}
        onPause={() => setPaused(true)}
      />

      {chatNpc && <NpcChat npc={chatNpc} onClose={() => setChatNpcId(null)} />}
      {paused && (
        <PauseMenu
          onResume={() => setPaused(false)}
          onChangeAvatar={() => {
            setPaused(false);
            setPickingAvatar(true);
          }}
        />
      )}
      {pickingAvatar && (
        <AvatarPicker
          selectedId={avatarId}
          onSelect={onSelectAvatar}
          onClose={() => setPickingAvatar(false)}
        />
      )}

      {/* loading screen */}
      {showLoader && (
        <View style={styles.loader}>
          <Text style={styles.loaderSpark}>✦</Text>
          <Text style={styles.loaderTitle}>NEURA CITY</Text>
          <Text style={styles.loaderSub}>
            {resourcesDone
              ? "Entering the Plaza district…"
              : "Downloading city resources…"}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(
                    (resProgress.done / Math.max(resProgress.total, 1)) * 100,
                  )}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {resourcesDone
              ? "Ready"
              : `${resProgress.done} / ${resProgress.total}`}
          </Text>
          {resourcesDone && (
            <ActivityIndicator
              color={colors.dark.primary}
              style={{ marginTop: 16 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

function GlUnavailable({
  onShown,
  error,
}: {
  onShown: () => void;
  error?: Error;
}) {
  useEffect(() => {
    onShown();
  }, [onShown]);
  return (
    <View style={styles.glFallback}>
      <Text style={styles.loaderSpark}>✦</Text>
      <Text style={styles.glTitle}>NEURA CITY</Text>
      <Text style={styles.glText}>
        {error
          ? "Something went wrong while loading the 3D world."
          : "This device can't render the 3D world (no WebGL support). Open the app on your phone or a browser with 3D graphics enabled."}
      </Text>
      {error ? (
        <Text style={styles.glError}>
          {String(error.message || error).slice(0, 300)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.dark.background },
  joystickWrap: { position: "absolute", left: 18 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderSpark: { color: colors.dark.primary, fontSize: 26, marginBottom: 10 },
  loaderTitle: {
    fontFamily: fonts.heading,
    fontSize: 30,
    letterSpacing: 6,
    color: "#fff",
  },
  loaderSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.dark.mutedForeground,
    marginTop: 8,
  },
  progressTrack: {
    width: 220,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.dark.primary,
  },
  progressLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.dark.mutedForeground,
    marginTop: 10,
  },
  glFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.dark.background,
  },
  glTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 5,
    color: "#fff",
    marginBottom: 12,
  },
  glText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.dark.mutedForeground,
    textAlign: "center",
  },
  glError: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: "#f87171",
    textAlign: "center",
    marginTop: 14,
  },
});
