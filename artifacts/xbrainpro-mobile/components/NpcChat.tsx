import { npcChat } from "@workspace/api-client-react";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors, { fonts } from "@/constants/colors";
import type { NpcDef } from "@/game/npcs";
import {
  appendMessage,
  getSession,
  type NpcMessage,
} from "@/lib/chatSessions";

export default function NpcChat({
  npc,
  onClose,
}: {
  npc: NpcDef;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<NpcMessage[]>(() => [
    ...getSession(npc.id, npc.greeting),
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    return () => {
      // Invalidate any in-flight request so late responses are dropped
      // instead of appending out-of-order after the sheet is reopened.
      reqIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setError(null);
    setInput("");
    const userMsg: NpcMessage = { role: "user", content };
    appendMessage(npc.id, userMsg);
    const history = getSession(npc.id, npc.greeting).slice(0, -1).slice(-20);
    setMessages([...getSession(npc.id, npc.greeting)]);
    setSending(true);
    const reqId = ++reqIdRef.current;
    try {
      const res = await npcChat({
        npcId: npc.id,
        message: content,
        history: history.map((m) => ({ role: m.role, content: m.content })),
      });
      if (reqId !== reqIdRef.current) return;
      appendMessage(npc.id, { role: "npc", content: res.reply });
      setMessages([...getSession(npc.id, npc.greeting)]);
    } catch {
      if (reqId !== reqIdRef.current) return;
      setError(`${npc.name} is distracted right now — try again.`);
    } finally {
      if (reqId === reqIdRef.current) setSending(false);
    }
  };

  const showChips = messages.length <= 2;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.handle} />
            {/* header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.avatar,
                    { borderColor: npc.accent, backgroundColor: npc.color },
                  ]}
                >
                  <Text style={styles.avatarText}>{npc.name[0]}</Text>
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.name}>{npc.name}</Text>
                    <Text style={[styles.spark, { color: npc.accent }]}>✦</Text>
                  </View>
                  <Text style={styles.title}>{npc.title.toUpperCase()}</Text>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {/* messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.thread}
              contentContainerStyle={{ gap: 14, paddingVertical: 16 }}
            >
              {messages.map((m, i) =>
                m.role === "npc" ? (
                  <View key={i} style={styles.npcRow}>
                    <View
                      style={[
                        styles.avatarSm,
                        { backgroundColor: npc.color },
                      ]}
                    >
                      <Text style={styles.avatarSmText}>{npc.name[0]}</Text>
                    </View>
                    <View style={styles.npcBubble}>
                      <Text style={styles.msgText}>{m.content}</Text>
                    </View>
                  </View>
                ) : (
                  <View key={i} style={styles.userRow}>
                    <View
                      style={[styles.userBubble, { backgroundColor: npc.accent }]}
                    >
                      <Text style={styles.msgText}>{m.content}</Text>
                    </View>
                  </View>
                ),
              )}
              {sending && (
                <View style={styles.npcRow}>
                  <View
                    style={[styles.avatarSm, { backgroundColor: npc.color }]}
                  >
                    <Text style={styles.avatarSmText}>{npc.name[0]}</Text>
                  </View>
                  <View style={[styles.npcBubble, styles.typing]}>
                    <ActivityIndicator size="small" color="#ffffff99" />
                  </View>
                </View>
              )}
              {error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>

            {/* suggestion chips */}
            {showChips && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.chips}
              >
                {npc.suggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={styles.chip}
                    onPress={() => send(s)}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={`Say something to ${npc.name}...`}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
              />
              <Pressable
                style={[styles.sendBtn, { backgroundColor: npc.accent }]}
                onPress={() => send(input)}
                disabled={sending}
              >
                <Text style={styles.sendText}>➤</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(6,8,20,0.45)" },
  sheet: {
    backgroundColor: "rgba(20,24,48,0.97)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "88%",
    minHeight: "72%",
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 22, color: "#1c1c2c" },
  name: { fontFamily: fonts.heading, fontSize: 20, color: "#fff" },
  spark: { fontSize: 12 },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.dark.mutedForeground,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },
  thread: { flexGrow: 1 },
  npcRow: { flexDirection: "row", gap: 10, maxWidth: "85%" },
  avatarSm: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmText: { fontFamily: fonts.bold, fontSize: 13, color: "#1c1c2c" },
  npcBubble: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    borderTopLeftRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexShrink: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  typing: { minWidth: 60, alignItems: "center" },
  userRow: { flexDirection: "row", justifyContent: "flex-end" },
  userBubble: {
    borderRadius: 18,
    borderTopRightRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 11,
    maxWidth: "85%",
  },
  msgText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: "#fff",
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#ff8a8a",
    textAlign: "center",
  },
  chips: { gap: 8, paddingBottom: 10, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: "rgba(255,255,255,0.9)" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 18,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 16 },
});
