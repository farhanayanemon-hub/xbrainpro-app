import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListChatMessagesQueryKey,
  useListChatMessages,
  useSendChatMessage,
  type ChatMessage,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader, EmptyView, ErrorView, LoadingView } from "@/components/ui";
import colors, { fonts } from "@/constants/colors";

const c = colors.light;

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useListChatMessages();
  const [text, setText] = useState("");

  const send = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListChatMessagesQueryKey(),
        });
      },
    },
  });

  const onSend = () => {
    const content = text.trim();
    if (!content || send.isPending) return;
    setText("");
    send.mutate({ data: { content } });
  };

  // Newest first for inverted FlatList.
  const ordered: ChatMessage[] = React.useMemo(
    () => (messages ? [...messages].reverse() : []),
    [messages],
  );

  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  return (
    <View style={styles.flex}>
      <AppHeader title="Coach" subtitle="Apnar personal AI mentor" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <LoadingView />
        ) : isError ? (
          <View style={styles.flex}>
            <ErrorView onRetry={refetch} />
          </View>
        ) : ordered.length === 0 ? (
          <View style={styles.flex}>
            <EmptyView
              icon="chatbubbles-outline"
              title="Coach er sathe kotha bolun"
              message="Apnar plan, motivation ba je kono challenge niye jiggesh korun."
            />
          </View>
        ) : (
          <FlatList
            data={ordered}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              send.isPending ? (
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <ActivityIndicator color={c.mutedForeground} size="small" />
                </View>
              ) : null
            }
            renderItem={({ item }) => <Bubble message={item} />}
          />
        )}

        <View
          style={[styles.inputBar, { paddingBottom: bottomInset + 10 }]}
        >
          <TextInput
            style={styles.input}
            placeholder="Kichu likhun..."
            placeholderTextColor={c.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            testID="chat-input"
          />
          <Pressable
            onPress={onSend}
            disabled={!text.trim() || send.isPending}
            style={[
              styles.sendBtn,
              { opacity: !text.trim() || send.isPending ? 0.5 : 1 },
            ]}
            testID="chat-send"
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text style={[styles.bubbleText, isUser ? styles.userText : null]}>
        {message.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: c.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: c.foreground,
    lineHeight: 21,
  },
  userText: {
    color: "#ffffff",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.background,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: c.secondary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    color: c.foreground,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
