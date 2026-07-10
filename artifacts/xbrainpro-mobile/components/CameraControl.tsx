import React, { useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

import { CAM_PITCH_MAX, CAM_PITCH_MIN, game } from "@/game/store";

const YAW_SPEED = 0.0075;
const PITCH_SPEED = 0.005;

/**
 * Invisible drag surface covering the right half of the screen. Dragging
 * rotates the orbit camera (yaw 360°, pitch clamped) around the player.
 * Writes straight into the shared game store so the 3D loop picks it up
 * without re-renders.
 */
export default function CameraControl() {
  const last = useRef({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        last.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_evt, g) => {
        if (game.frozen) return;
        const dx = g.dx - last.current.x;
        const dy = g.dy - last.current.y;
        last.current = { x: g.dx, y: g.dy };
        game.cam.yaw -= dx * YAW_SPEED;
        game.cam.pitch = Math.min(
          CAM_PITCH_MAX,
          Math.max(CAM_PITCH_MIN, game.cam.pitch + dy * PITCH_SPEED),
        );
      },
    }),
  ).current;

  return <View style={styles.zone} {...pan.panHandlers} />;
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: "45%",
  },
});
