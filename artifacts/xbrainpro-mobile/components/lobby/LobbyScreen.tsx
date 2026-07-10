import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type PlayerProfile } from "@workspace/api-client-react";

import colors, { fonts } from "@/constants/colors";
import { absoluteApiUrl } from "@/lib/session";
import FriendsPanel, { type JoinTarget } from "@/components/lobby/FriendsPanel";

const C = colors.dark;

type Tile = {
  key: string;
  icon: string;
  label: string;
  tagline: string;
  ready: boolean;
};

const TILES: Tile[] = [
  { key: "play", icon: "🎮", label: "PLAY", tagline: "Enter Neura City", ready: true },
  { key: "shop", icon: "🛍️", label: "SHOP", tagline: "Skins & gear", ready: false },
  { key: "events", icon: "🎉", label: "EVENTS", tagline: "City happenings", ready: false },
  { key: "maps", icon: "🗺️", label: "MAPS", tagline: "New districts", ready: false },
];

export default function LobbyScreen({
  profile,
  onPlay,
  onEditProfile,
  onLogout,
  onJoinFriend,
}: {
  profile: PlayerProfile;
  onPlay: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onJoinFriend: (target: JoinTarget) => void;
}) {
  const [comingSoon, setComingSoon] = useState<Tile | null>(null);

  const photoUrl = profile.photoUrl ? absoluteApiUrl(profile.photoUrl) : null;
  const initialLetter = profile.displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.profileCard} onPress={onEditProfile}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName} numberOfLines={1}>
                {profile.displayName}
              </Text>
              <Text style={styles.playerMeta} numberOfLines={1}>
                {profile.gender === "female" ? "♀" : "♂"} Citizen
                {profile.bio ? ` • ${profile.bio}` : ""}
              </Text>
            </View>
            <Text style={styles.editHint}>Edit ✏️</Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.brand}>✦ NEURA CITY</Text>
        <Text style={styles.tagline}>Choose your next move, citizen</Text>

        <View style={styles.tiles}>
          {TILES.map((tile) => (
            <Pressable
              key={tile.key}
              style={[
                styles.tile,
                tile.ready ? styles.tilePlay : styles.tileLocked,
              ]}
              onPress={() => (tile.ready ? onPlay() : setComingSoon(tile))}
            >
              <Text style={styles.tileIcon}>{tile.icon}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileTagline}>{tile.tagline}</Text>
              {!tile.ready && (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>SOON</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <FriendsPanel onJoinFriend={onJoinFriend} />
      </ScrollView>

      {comingSoon && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setComingSoon(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalIcon}>{comingSoon.icon}</Text>
              <Text style={styles.modalTitle}>{comingSoon.label}</Text>
              <Text style={styles.modalBody}>
                This district is still under construction. Coming soon to
                Neura City!
              </Text>
              <Pressable
                style={styles.modalBtn}
                onPress={() => setComingSoon(null)}
              >
                <Text style={styles.modalBtnText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 900, width: "100%", alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  profileCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 16,
    padding: 10,
    paddingRight: 14,
  },
  avatar: { width: 46, height: 46, borderRadius: 12 },
  avatarFallback: {
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: "#fff",
  },
  playerName: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    color: "#fff",
  },
  playerMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: C.mutedForeground,
    marginTop: 1,
  },
  editHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: C.mutedForeground,
  },
  logoutBtn: {
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  logoutText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: C.mutedForeground,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 4,
    color: "#fff",
    textAlign: "center",
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  tile: {
    width: 170,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
  },
  tilePlay: {
    backgroundColor: C.primary,
    borderColor: C.primaryBorder,
  },
  tileLocked: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    opacity: 0.85,
  },
  tileIcon: { fontSize: 30, marginBottom: 8 },
  tileLabel: {
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 2,
    color: "#fff",
  },
  tileTagline: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
  },
  soonBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  soonBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: "#fff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(6,8,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalIcon: { fontSize: 34, marginBottom: 8 },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    letterSpacing: 2,
    color: "#fff",
  },
  modalBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 28,
  },
  modalBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: "#fff",
  },
});
