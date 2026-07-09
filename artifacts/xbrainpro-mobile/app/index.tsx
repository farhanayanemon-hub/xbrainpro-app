import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import Hud from "@/components/Hud";
import Joystick from "@/components/Joystick";
import NpcChat from "@/components/NpcChat";
import PauseMenu from "@/components/PauseMenu";
import colors, { fonts } from "@/constants/colors";
import GameCanvas from "@/game/GameCanvas";
import { NPCS } from "@/game/npcs";
import { game, resetInput } from "@/game/store";
import WorldScene from "@/game/WorldScene";

export default function NeuraCity() {
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [nearNpcId, setNearNpcId] = useState<string | null>(null);
  const [chatNpcId, setChatNpcId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setShowLoader(false), 150);
      return () => clearTimeout(t);
    }
  }, [ready]);

  useEffect(() => {
    game.frozen = paused || chatNpcId !== null;
    if (game.frozen) resetInput();
  }, [paused, chatNpcId]);

  const onNearNpc = useCallback((id: string | null) => setNearNpcId(id), []);

  const nearNpc = useMemo(
    () => NPCS.find((n) => n.id === nearNpcId) ?? null,
    [nearNpcId],
  );
  const chatNpc = useMemo(
    () => NPCS.find((n) => n.id === chatNpcId) ?? null,
    [chatNpcId],
  );

  const WorldFallback = useCallback(() => {
    // Shown when the device/browser can't create a 3D (WebGL) context.
    return <GlUnavailable onShown={() => setReady(true)} />;
  }, []);

  return (
    <View style={styles.root}>
      <ErrorBoundary FallbackComponent={WorldFallback}>
        <GameCanvas
          onReady={() => setReady(true)}
          fallback={<GlUnavailable onShown={() => setReady(true)} />}
        >
          <WorldScene onNearNpc={onNearNpc} />
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
      {paused && <PauseMenu onResume={() => setPaused(false)} />}

      {/* loading screen */}
      {showLoader && (
        <View style={styles.loader}>
          <Text style={styles.loaderSpark}>✦</Text>
          <Text style={styles.loaderTitle}>NEURA CITY</Text>
          <Text style={styles.loaderSub}>Entering the Plaza district…</Text>
          <ActivityIndicator
            color={colors.dark.primary}
            style={{ marginTop: 24 }}
          />
        </View>
      )}
    </View>
  );
}

function GlUnavailable({ onShown }: { onShown: () => void }) {
  useEffect(() => {
    onShown();
  }, [onShown]);
  return (
    <View style={styles.glFallback}>
      <Text style={styles.loaderSpark}>✦</Text>
      <Text style={styles.glTitle}>NEURA CITY</Text>
      <Text style={styles.glText}>
        This device can't render the 3D world (no WebGL support). Open the app
        on your phone or a browser with 3D graphics enabled.
      </Text>
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
});
