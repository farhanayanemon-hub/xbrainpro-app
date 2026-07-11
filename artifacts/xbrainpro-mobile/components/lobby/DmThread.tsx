import React, { useCallback, useEffect, useRef, useState } from "react";
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
import {
  DM_MAX_LEN,
  DmError,
  getConversation,
  sendDm,
  type DmMessage,
} from "@/lib/dm";
import { subscribeDm } from "@/game/net";

const C = colors.dark;

/** Poll fallback so offline->online transitions surface without a socket. */
const POLL_MS = 4000;

/**
 * Private conversation with one friend, shown as a full-screen modal. New
 * messages arrive over the city WebSocket when it's connected; a light poll
 * covers the lobby (no socket) and any missed pushes.
 */
export default function DmThread({
  friendUserId,
  friendName,
  onClose,
}: {
  friendUserId: number;
  friendName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<DmMessage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const mounted = useRef(true);

  const mergeMessages = useCallback((incoming: DmMessage[]) => {
    setMessages((prev) => {
      const seen = new Set((prev ?? []).map((m) => m.id));
      const merged = [...(prev ?? [])];
      for (const m of incoming) {
        if (!seen.has(m.id)) merged.push(m);
      }
      merged.sort((a, b) => a.id - b.id);
      return merged;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await getConversation(friendUserId);
      if (!mounted.current) return;
      mergeMessages(list);
      setLoadError(null);
    } catch (e) {
      if (!mounted.current) return;
      if (messagesRef.current === null) {
        setLoadError(
          e instanceof DmError ? e.message : "Couldn't load messages",
        );
      }
    }
  }, [friendUserId, mergeMessages]);

  // Keep a ref of messages for the error branch above without re-creating
  // the refresh callback on every new message.
  const messagesRef = useRef<DmMessage[] | null>(null);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  // Realtime: append pushes from this friend while the city socket is up.
  useEffect(
    () =>
      subscribeDm((m) => {
        if (m.fromId !== friendUserId) return;
        mergeMessages([
          { id: m.id, fromId: m.fromId, toId: m.toId, text: m.text, ts: m.ts },
        ]);
        // Mark it read server-side since the thread is open.
        void getConversation(friendUserId).catch(() => {});
      }),
    [friendUserId, mergeMessages],
  );

  useEffect(() => {
    const t = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      80,
    );
    return () => clearTimeout(t);
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const sent = await sendDm(friendUserId, text);
      if (!mounted.current) return;
      setInput("");
      mergeMessages([sent]);
    } catch (e) {
      if (!mounted.current) return;
      setLoadError(
        e instanceof DmError ? e.message : "Couldn't send message",
      );
      setTimeout(() => {
        if (mounted.current) setLoadError(null);
      }, 3500);
    } finally {
      if (mounted.current) setSending(false);
    }
  }, [friendUserId, input, sending, mergeMessages]);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <View
            style={[styles.sheet, { paddingBottom: 10 + insets.bottom }]}
          >
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                💬 {friendName.toUpperCase()}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.feed}
              contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
            >
              {messages === null && !loadError && (
                <ActivityIndicator
                  color={C.primary}
                  style={{ marginVertical: 20 }}
                />
              )}
              {messages !== null && messages.length === 0 && (
                <Text style={styles.empty}>
                  No messages yet — say hi to {friendName}!
                </Text>
              )}
              {(messages ?? []).map((m) => {
                const mine = m.fromId !== friendUserId;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.bubble,
                      mine ? styles.bubbleMine : styles.bubbleTheirs,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{m.text}</Text>
                  </View>
                );
              })}
            </ScrollView>

            {loadError && <Text style={styles.error}>{loadError}</Text>}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={`Message ${friendName}…`}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => void send()}
                returnKeyType="send"
                maxLength={DM_MAX_LEN}
                editable={!sending}
                blurOnSubmit={false}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  (!input.trim() || sending) && styles.sendBtnOff,
                ]}
                onPress={() => void send()}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendText}>➤</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4,6,16,0.6)",
  },
  dismiss: { ...StyleSheet.absoluteFillObject },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "80%",
    minHeight: 320,
    backgroundColor: C.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.6,
    color: "#fff",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  feed: { flexGrow: 1 },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "center",
    paddingVertical: 20,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: C.primary,
    borderBottomRightRadius: 5,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: C.secondary,
    borderBottomLeftRadius: 5,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: "#fff",
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#ff6b6b",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.5 },
  sendText: { color: "#fff", fontSize: 15 },
});
