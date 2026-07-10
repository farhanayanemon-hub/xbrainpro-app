import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AvatarPicker from "@/components/AvatarPicker";
import CameraControl from "@/components/CameraControl";
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
import { HOUSES } from "@/game/cityLayout";
import {
  DEFAULT_MAP,
  houseDoor,
  loadWorldMap,
  setActiveInterior,
  setActiveWorldMap,
  setInteractables,
  INTERIOR_SPAWN,
  type Interactable,
  type ParsedWorldMap,
} from "@/game/worldMap";
import WorldScene from "@/game/WorldScene";
import { loadToken } from "@/lib/session";
import { getCurrentUser, getPlayerHome } from "@workspace/api-client-react";

export default function NeuraCity() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [nearNpcId, setNearNpcId] = useState<string | null>(null);
  const [chatNpcId, setChatNpcId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [worldMap, setWorldMap] = useState<ParsedWorldMap>(DEFAULT_MAP);
  const [homePlot, setHomePlot] = useState<number | null>(null);
  const [inside, setInside] = useState(false);
  const [nearInteract, setNearInteract] = useState<Interactable | null>(null);
  const [sleeping, setSleeping] = useState(false);
  const [resProgress, setResProgress] = useState<ResourceProgress>({
    done: 0,
    total: 1,
  });
  const [resourcesDone, setResourcesDone] = useState(false);

  const userPickedAvatar = useRef(false);
  const sleepFade = useRef(new Animated.Value(0)).current;
  // Mirrors `inside` for use inside effect closures that shouldn't clobber the
  // interior's runtime world state if an async map load resolves late.
  const insideRef = useRef(false);

  // My house comes from the live server map (by plot); the bundled HOUSES is
  // only a fallback so prompts/teleports never desync from rendered houses.
  const myHouse = useMemo(() => {
    if (homePlot === null) return null;
    return (
      worldMap.houses.find((h) => h.plot === homePlot) ??
      HOUSES[homePlot] ??
      null
    );
  }, [worldMap, homePlot]);

  // Route guard: no/invalid session → send back to the lobby/login gate.
  // Prevents deep-linking straight into the game without a valid account.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await loadToken();
      if (cancelled) return;
      if (!token) {
        router.replace("/");
        return;
      }
      try {
        await getCurrentUser();
      } catch (e) {
        // Only bounce on an auth failure; keep the player in-city on transient
        // network/server errors so a hiccup doesn't kick them out mid-session.
        if (!cancelled && (e as { status?: number })?.status === 401) {
          router.replace("/");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
      setWorldMap(map);
      // Don't stomp on the interior's runtime state if the player already went
      // inside before this resolved; leaveHome() will activate the fresh map.
      if (!insideRef.current) setActiveWorldMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Which house is mine? Server assigns a plot deterministically per user.
  useEffect(() => {
    let cancelled = false;
    getPlayerHome()
      .then((res) => {
        if (!cancelled && typeof res?.plot === "number") setHomePlot(res.plot);
      })
      .catch(() => {
        // Non-fatal: without a home the city still works, just no door prompt.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When we're outside and know our plot, the only enterable door is our own
  // home. (All houses are solid; you can't walk into strangers' houses.)
  useEffect(() => {
    if (inside) return;
    if (!myHouse) {
      setInteractables([]);
      return;
    }
    const door = houseDoor(myHouse);
    setInteractables([
      {
        id: "home",
        kind: "house",
        x: door.x,
        z: door.z,
        radius: 2,
        label: "Enter home",
      },
    ]);
  }, [inside, myHouse]);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setShowLoader(false), 150);
      return () => clearTimeout(t);
    }
  }, [ready]);

  useEffect(() => {
    game.frozen = paused || pickingAvatar || chatNpcId !== null || sleeping;
    if (game.frozen) resetInput();
  }, [paused, pickingAvatar, chatNpcId, sleeping]);

  const onSelectAvatar = useCallback((id: string) => {
    userPickedAvatar.current = true;
    setAvatarId(id);
    void saveAvatarId(id);
  }, []);

  const onNearNpc = useCallback((id: string | null) => setNearNpcId(id), []);
  const onNearInteract = useCallback(
    (it: Interactable | null) => setNearInteract(it),
    [],
  );

  const enterHome = useCallback(() => {
    setActiveInterior();
    game.player.x = INTERIOR_SPAWN.x;
    game.player.z = INTERIOR_SPAWN.z;
    game.player.heading = Math.PI; // face the bed (−Z)
    game.cam.yaw = 0; // camera behind the player, looking into the room
    insideRef.current = true;
    setNearInteract(null);
    setInside(true);
  }, []);

  const leaveHome = useCallback(() => {
    setActiveWorldMap(worldMap);
    if (myHouse) {
      const door = houseDoor(myHouse);
      game.player.x = door.x;
      game.player.z = door.z;
      game.player.heading = myHouse.rotY; // step out facing away
    }
    insideRef.current = false;
    setNearInteract(null);
    setInside(false);
  }, [worldMap, myHouse]);

  const sleep = useCallback(() => {
    if (sleeping) return;
    setSleeping(true);
    // Fade to black, then back — a simple "rest" transition.
    Animated.sequence([
      Animated.timing(sleepFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.delay(900),
      Animated.timing(sleepFade, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => setSleeping(false));
  }, [sleeping, sleepFade]);

  const onAction = useCallback(() => {
    if (!nearInteract) return;
    if (nearInteract.kind === "house") enterHome();
    else if (nearInteract.kind === "exit") leaveHome();
    else if (nearInteract.kind === "bed") sleep();
  }, [nearInteract, enterHome, leaveHome, sleep]);

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
              inside={inside}
              homePlot={homePlot}
              onNearNpc={onNearNpc}
              onNearInteract={onNearInteract}
              onLoaded={() => setReady(true)}
            />
          </React.Suspense>
        </GameCanvas>
      </ErrorBoundary>

      {/* right-half drag surface rotates the camera */}
      <CameraControl />

      {/* joystick bottom-left */}
      <View style={[styles.joystickWrap, { bottom: 40 + insets.bottom }]}>
        <Joystick />
      </View>

      <Hud
        nearNpc={nearNpc}
        onTalk={() => nearNpc && setChatNpcId(nearNpc.id)}
        onPause={() => setPaused(true)}
      />

      {/* Contextual action button (enter home / sleep / leave). Sits left of
          the TALK button so both can show at once without overlapping. */}
      {nearInteract && !nearNpc && (
        <Pressable
          style={[styles.actionBtn, { bottom: 60 + insets.bottom }]}
          onPress={onAction}
        >
          <Text style={styles.actionIcon}>
            {nearInteract.kind === "bed"
              ? "🛏️"
              : nearInteract.kind === "exit"
                ? "🚪"
                : "🏠"}
          </Text>
          <Text style={styles.actionText}>{nearInteract.label}</Text>
        </Pressable>
      )}

      {/* Sleep fade overlay */}
      {sleeping && (
        <Animated.View
          pointerEvents="none"
          style={[styles.sleepOverlay, { opacity: sleepFade }]}
        >
          <Text style={styles.sleepText}>Resting…</Text>
        </Animated.View>
      )}

      {chatNpc && <NpcChat npc={chatNpc} onClose={() => setChatNpcId(null)} />}
      {paused && (
        <PauseMenu
          onResume={() => setPaused(false)}
          onChangeAvatar={() => {
            setPaused(false);
            setPickingAvatar(true);
          }}
          onExit={() => {
            setPaused(false);
            router.replace("/");
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
  actionBtn: {
    position: "absolute",
    right: 116,
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2fae87",
    shadowColor: "#2fae87",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  actionIcon: { fontSize: 20 },
  actionText: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 0.6,
    color: "#fff",
    marginTop: 2,
    textAlign: "center",
  },
  sleepOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050810",
    alignItems: "center",
    justifyContent: "center",
  },
  sleepText: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 3,
    color: "#fff",
  },
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
