import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/constants/colors";
import {
  CHAT_MAX_LEN,
  SYSTEM_CHAT_ID,
  getMyId,
  sendChat,
  subscribeChat,
  type ChatMessage,
} from "@/game/net";
import { reportChatMessage } from "@/lib/moderation";

const NAME_COLORS = [
  "#7cc0ff",
  "#8ef0c6",
  "#ffb86c",
  "#f18fff",
  "#ffe066",
  "#8fd0ff",
];

function nameColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(h) % NAME_COLORS.length];
}

/**
 * City chat overlay: a collapsed 💬 button with a faint mini-feed of the
 * latest messages, expanding into a full feed + input panel on the left side
 * of the screen (landscape-safe, keyboard-safe).
 */
export default function CityChat({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reportNote, setReportNote] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => subscribeChat(setFeed), []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [feed, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    sendChat(text);
    setInput("");
  };

  /** Long-press: offer to report someone else's message. */
  const onLongPressMessage = (m: ChatMessage) => {
    if (m.id === SYSTEM_CHAT_ID || m.id === getMyId()) return;
    setReportNote(null);
    setReportTarget(m);
  };

  const submitReport = async () => {
    const target = reportTarget;
    if (!target) return;
    setReportTarget(null);
    try {
      await reportChatMessage(target.id, target.text, target.ts);
      setReportNote(`Reported ${target.name} — thanks for keeping it friendly.`);
    } catch (err) {
      setReportNote(err instanceof Error ? err.message : "Report failed");
    }
  };

  if (!open) {
    const recent = feed.slice(-2);
    return (
      <View
        style={[styles.collapsedWrap, { top: insets.top + 66 }]}
        pointerEvents="box-none"
      >
        <Pressable style={styles.chatBtn} onPress={onOpen} hitSlop={8}>
          <Text style={styles.chatBtnIcon}>💬</Text>
        </Pressable>
        {recent.length > 0 && (
          <View style={styles.miniFeed} pointerEvents="none">
            {recent.map((m) => (
              <Text
                key={`${m.id}-${m.ts}`}
                numberOfLines={1}
                style={styles.miniLine}
              >
                <Text style={[styles.miniName, { color: nameColor(m.id) }]}>
                  {m.name}:{" "}
                </Text>
                {m.text}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Tap anywhere outside the panel to close. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.panel,
            {
              top: insets.top + 58,
              bottom: 16 + insets.bottom,
              left: 12 + insets.left,
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>CITY CHAT</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            ref={scrollRef}
            style={styles.feed}
            contentContainerStyle={{ gap: 6, paddingVertical: 8 }}
          >
            {feed.length === 0 && (
              <Text style={styles.empty}>
                No messages yet — say hi to the city!
              </Text>
            )}
            {feed.map((m) =>
              m.id === SYSTEM_CHAT_ID ? (
                <Text key={`${m.id}-${m.ts}`} style={styles.systemLine}>
                  {m.text}
                </Text>
              ) : (
                <Pressable
                  key={`${m.id}-${m.ts}`}
                  onLongPress={() => onLongPressMessage(m)}
                  delayLongPress={350}
                >
                  <Text style={styles.line}>
                    <Text style={[styles.lineName, { color: nameColor(m.id) }]}>
                      {m.name}:{" "}
                    </Text>
                    {m.text}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>
          {reportTarget && (
            <View style={styles.reportBar}>
              <Text style={styles.reportText} numberOfLines={2}>
                Report {reportTarget.name}'s message?
              </Text>
              <View style={styles.reportActions}>
                <Pressable
                  style={styles.reportCancelBtn}
                  onPress={() => setReportTarget(null)}
                >
                  <Text style={styles.reportCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.reportBtn} onPress={submitReport}>
                  <Text style={styles.reportBtnText}>Report</Text>
                </Pressable>
              </View>
            </View>
          )}
          {!reportTarget && reportNote && (
            <Text style={styles.reportNote} numberOfLines={2}>
              {reportNote}
            </Text>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Say something…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
              maxLength={CHAT_MAX_LEN}
              autoFocus
              blurOnSubmit={false}
            />
            <Pressable style={styles.sendBtn} onPress={send}>
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedWrap: {
    position: "absolute",
    left: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    maxWidth: "55%",
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16,20,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtnIcon: { fontSize: 17 },
  miniFeed: {
    gap: 2,
    paddingTop: 3,
    flexShrink: 1,
  },
  miniLine: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(10,14,26,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  miniName: { fontFamily: fonts.bold },
  kav: { flex: 1 },
  panel: {
    position: "absolute",
    width: 300,
    maxWidth: "70%",
    backgroundColor: "rgba(14,18,38,0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  panelTitle: {
    fontFamily: fonts.heading,
    fontSize: 12,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.9)",
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  feed: { flexGrow: 1 },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    paddingVertical: 12,
  },
  line: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: "#fff",
  },
  lineName: { fontFamily: fonts.bold },
  systemLine: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "#ffd27c",
    fontStyle: "italic",
  },
  reportBar: {
    backgroundColor: "rgba(255,120,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,120,90,0.4)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  reportText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.92)",
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  reportCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  reportCancelText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  reportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#e5484d",
  },
  reportBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#fff",
  },
  reportNote: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    paddingTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 15 },
});
