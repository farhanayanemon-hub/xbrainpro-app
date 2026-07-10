import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import { absoluteApiUrl } from "@/lib/session";
import {
  acceptFriendRequest,
  listFriends,
  sendFriendRequest,
  FriendsError,
  type FriendEntry,
  type FriendsData,
  type RequestEntry,
} from "@/lib/friends";

const C = colors.dark;

const REFRESH_MS = 5000;

export type JoinTarget = { x: number; z: number };

function Avatar({
  photoUrl,
  displayName,
  online,
}: {
  photoUrl: string | null;
  displayName: string;
  online?: boolean;
}) {
  const uri = photoUrl ? absoluteApiUrl(photoUrl) : null;
  return (
    <View>
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {online != null && (
        <View
          style={[styles.dot, online ? styles.dotOnline : styles.dotOffline]}
        />
      )}
    </View>
  );
}

export default function FriendsPanel({
  onJoinFriend,
}: {
  onJoinFriend: (target: JoinTarget) => void;
}) {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [addName, setAddName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    kind: "ok" | "error";
  } | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const next = await listFriends();
      if (mounted.current) {
        setData(next);
        setLoadError(false);
      }
    } catch {
      if (mounted.current) setLoadError(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [refresh]);

  const flash = useCallback((text: string, kind: "ok" | "error") => {
    setNotice({ text, kind });
    setTimeout(() => {
      if (mounted.current) setNotice(null);
    }, 3500);
  }, []);

  const handleAdd = useCallback(async () => {
    const name = addName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const status = await sendFriendRequest(name);
      setAddName("");
      flash(
        status === "accepted"
          ? `You're now friends with ${name}!`
          : `Request sent to ${name}`,
        "ok",
      );
      await refresh();
    } catch (e) {
      const msg =
        e instanceof FriendsError ? e.message : "Couldn't send request";
      flash(msg, "error");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [addName, busy, flash, refresh]);

  const handleAccept = useCallback(
    async (r: RequestEntry) => {
      try {
        await acceptFriendRequest(r.userId);
        flash(`You're now friends with ${r.displayName}!`, "ok");
        await refresh();
      } catch (e) {
        const msg =
          e instanceof FriendsError ? e.message : "Couldn't accept request";
        flash(msg, "error");
      }
    },
    [flash, refresh],
  );

  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];
  const onlineCount = friends.filter((f) => f.online).length;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>👥 FRIENDS</Text>
        {friends.length > 0 && (
          <Text style={styles.onlineCount}>{onlineCount} online</Text>
        )}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={addName}
          onChangeText={setAddName}
          placeholder="Add a friend by name"
          placeholderTextColor={C.mutedForeground}
          style={styles.input}
          autoCapitalize="none"
          returnKeyType="send"
          onSubmitEditing={() => void handleAdd()}
          editable={!busy}
        />
        <Pressable
          style={[styles.addBtn, (!addName.trim() || busy) && styles.addBtnOff]}
          onPress={() => void handleAdd()}
          disabled={!addName.trim() || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </Pressable>
      </View>

      {notice && (
        <Text
          style={[
            styles.notice,
            notice.kind === "error" ? styles.noticeError : styles.noticeOk,
          ]}
        >
          {notice.text}
        </Text>
      )}

      {incoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Requests</Text>
          {incoming.map((r) => (
            <View key={r.userId} style={styles.row}>
              <Avatar photoUrl={r.photoUrl} displayName={r.displayName} />
              <Text style={styles.rowName} numberOfLines={1}>
                {r.displayName}
              </Text>
              <Pressable
                style={styles.acceptBtn}
                onPress={() => void handleAccept(r)}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        {data === null && !loadError ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
        ) : loadError ? (
          <Text style={styles.emptyText}>
            Couldn&apos;t load friends. Retrying…
          </Text>
        ) : friends.length === 0 ? (
          <Text style={styles.emptyText}>
            No friends yet. Add someone by their display name to play together.
          </Text>
        ) : (
          friends.map((f: FriendEntry) => (
            <View key={f.userId} style={styles.row}>
              <Avatar
                photoUrl={f.photoUrl}
                displayName={f.displayName}
                online={f.online}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {f.displayName}
                </Text>
                <Text
                  style={[
                    styles.rowStatus,
                    f.online ? styles.statusOnline : styles.statusOffline,
                  ]}
                >
                  {f.online
                    ? f.position
                      ? "In the city"
                      : "Online"
                    : "Offline"}
                </Text>
              </View>
              {f.online && f.position && (
                <Pressable
                  style={styles.joinBtn}
                  onPress={() => onJoinFriend(f.position!)}
                >
                  <Text style={styles.joinText}>Join</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>

      {outgoing.length > 0 && (
        <Text style={styles.pendingHint}>
          {outgoing.length} pending request{outgoing.length > 1 ? "s" : ""} sent
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: 2,
    color: "#fff",
  },
  onlineCount: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: C.primary,
  },
  addRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 62,
  },
  addBtnOff: { opacity: 0.5 },
  addBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#fff",
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 10,
  },
  noticeOk: { color: C.primary },
  noticeError: { color: "#ff6b6b" },
  section: { marginTop: 14 },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    color: C.mutedForeground,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 11 },
  avatarFallback: {
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: "#fff",
  },
  dot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.card,
  },
  dotOnline: { backgroundColor: "#33d17a" },
  dotOffline: { backgroundColor: C.mutedForeground },
  rowName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#fff",
  },
  rowStatus: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 1,
  },
  statusOnline: { color: "#33d17a" },
  statusOffline: { color: C.mutedForeground },
  joinBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  joinText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#fff",
  },
  acceptBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  acceptText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#fff",
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.mutedForeground,
    lineHeight: 19,
  },
  pendingHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 12,
    textAlign: "center",
  },
});
