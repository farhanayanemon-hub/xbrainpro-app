import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

import { game, resetInput } from "@/game/store";

const RADIUS = 56;
const KNOB = 48;

export default function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, g) => {
        let dx = g.dx;
        let dy = g.dy;
        const len = Math.hypot(dx, dy);
        if (len > RADIUS) {
          dx = (dx / len) * RADIUS;
          dy = (dy / len) * RADIUS;
        }
        setKnob({ x: dx, y: dy });
        game.input.x = dx / RADIUS;
        game.input.y = -dy / RADIUS;
      },
      onPanResponderRelease: () => {
        setKnob({ x: 0, y: 0 });
        resetInput();
      },
      onPanResponderTerminate: () => {
        setKnob({ x: 0, y: 0 });
        resetInput();
      },
    }),
  ).current;

  return (
    <View style={styles.zone} {...pan.panHandlers}>
      <View style={styles.ring}>
        <View
          style={[
            styles.knob,
            { transform: [{ translateX: knob.x }, { translateY: knob.y }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    width: RADIUS * 2 + 32,
    height: RADIUS * 2 + 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: "rgba(255,255,255,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
});
