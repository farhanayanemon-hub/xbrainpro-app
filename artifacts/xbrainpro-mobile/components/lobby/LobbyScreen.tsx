import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type PlayerProfile } from "@workspace/api-client-react";

import colors, { fonts } from "@/constants/colors";
import { absoluteApiUrl } from "@/lib/session";
import FriendsPanel, { type JoinTarget } from "@/components/lobby/FriendsPanel";
import LobbyAvatarStage from "@/components/lobby/LobbyAvatarStage";
import StorePanel from "@/components/lobby/StorePanel";
import {
  GENDER_AVATAR,
  loadAvatarId,
  loadOwnedAvatarIds,
  saveAvatarId,
  unlockAvatar,
} from "@/game/avatar";

const C = colors.dark;

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  action: "play" | "friends" | "character" | "store" | "soon";
  ready: boolean;
};

const MENU: MenuItem[] = [
  { key: "store", icon: "🛍️", label: "STORE", action: "store", ready: true },
  { key: "character", icon: "🧍", label: "CHARACTER", action: "character", ready: true },
  { key: "friends", icon: "👥", label: "FRIENDS", action: "friends", ready: true },
  { key: "events", icon: "🎉", label: "EVENTS", action: "soon", ready: false },
  { key: "maps", icon: "🗺️", label: "MAPS", action: "soon", ready: false },
];

/** Angular Free Fire style menu tab: a skewed neon-edged plate with upright content. */
function MenuTab({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      {({ pressed }) => (
        <>
          <View style={[styles.menuPlate, pressed && styles.menuPlatePressed]} />
          <View style={styles.menuEdge} />
          <View style={styles.menuContent}>
            <View style={styles.menuIconBox}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {!item.ready && (
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>SOON</Text>
              </View>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

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
  const [comingSoon, setComingSoon] = useState<MenuItem | null>(null);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  // The equipped look — this is what persists and carries into the city.
  const [equippedId, setEquippedId] = useState(
    GENDER_AVATAR[profile.gender === "female" ? "female" : "male"],
  );
  // The look currently being previewed in the Store (drives the 3D hero while
  // the sheet is open). Falls back to the equipped look when the store closes.
  const [previewId, setPreviewId] = useState(equippedId);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);

  // Show the same character the player last used in the city, and load which
  // looks they've unlocked in the Store.
  useEffect(() => {
    let cancelled = false;
    void loadAvatarId().then((id) => {
      if (!cancelled && id) {
        setEquippedId(id);
        setPreviewId(id);
      }
    });
    void loadOwnedAvatarIds().then((ids) => {
      if (!cancelled) setOwnedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openStore = () => {
    setPreviewId(equippedId);
    setStoreOpen(true);
  };

  const closeStore = () => {
    setPreviewId(equippedId); // discard any un-equipped preview
    setStoreOpen(false);
  };

  const handleUnlock = (id: string) => {
    void unlockAvatar(id).then((ids) => setOwnedIds(ids));
  };

  const handleEquip = (id: string) => {
    setEquippedId(id);
    setPreviewId(id);
    void saveAvatarId(id);
  };

  // The 3D hero shows the previewed look while browsing the store, otherwise
  // the equipped one.
  const heroAvatarId = storeOpen ? previewId : equippedId;

  const photoUrl = profile.photoUrl ? absoluteApiUrl(profile.photoUrl) : null;
  const initialLetter = profile.displayName.charAt(0).toUpperCase();

  const handleMenu = (item: MenuItem) => {
    switch (item.action) {
      case "character":
        onEditProfile();
        break;
      case "friends":
        setFriendsOpen(true);
        break;
      case "store":
        openStore();
        break;
      case "soon":
        setComingSoon(item);
        break;
      default:
        onPlay();
    }
  };

  return (
    <View style={styles.root}>
      {/* 3D character hero + neon stage backdrop */}
      <LobbyAvatarStage avatarId={heroAvatarId} fallbackPhotoUrl={photoUrl} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.profileCard} onPress={onEditProfile}>
          <View style={styles.avatarRing}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </View>
            )}
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>1</Text>
            </View>
          </View>
          <View style={{ maxWidth: 150 }}>
            <Text style={styles.playerName} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.playerMeta} numberOfLines={1}>
                Citizen
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.topRight}>
          <Text style={styles.brand}>
            NEURA<Text style={styles.brandAccent}> CITY</Text>
          </Text>
          <View style={styles.topIcons}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => setFriendsOpen(true)}
            >
              <Text style={styles.iconBtnText}>👥</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={onEditProfile}>
              <Text style={styles.iconBtnText}>⚙️</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={onLogout}>
              <Text style={styles.iconBtnText}>⏻</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Left vertical angular menu */}
      <View style={styles.leftMenu}>
        {MENU.map((item) => (
          <MenuTab key={item.key} item={item} onPress={() => handleMenu(item)} />
        ))}
      </View>

      {/* Bottom-right mode card + START */}
      <View style={styles.bottomRight}>
        <View style={styles.modeCard}>
          <View style={styles.modeIcon}>
            <Text style={{ fontSize: 18 }}>🌆</Text>
          </View>
          <View>
            <Text style={styles.modeLabel}>OPEN WORLD</Text>
            <Text style={styles.modeSub}>Neura City</Text>
          </View>
        </View>

        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [
            styles.startWrap,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <View style={styles.startSkew}>
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <Text style={styles.startText}>START</Text>
        </Pressable>
      </View>

      {/* Friends drawer */}
      {friendsOpen && (
        <Modal
          transparent
          animationType="slide"
          onRequestClose={() => setFriendsOpen(false)}
        >
          <View style={styles.drawerBackdrop}>
            <Pressable
              style={styles.drawerDismiss}
              onPress={() => setFriendsOpen(false)}
            />
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>FRIENDS</Text>
                <Pressable
                  style={styles.drawerClose}
                  onPress={() => setFriendsOpen(false)}
                >
                  <Text style={styles.drawerCloseText}>✕</Text>
                </Pressable>
              </View>
              <FriendsPanel
                onJoinFriend={(target) => {
                  setFriendsOpen(false);
                  onJoinFriend(target);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Store bottom sheet — rendered inline (not a Modal) so the 3D hero
          above stays mounted and live-previews the selected look. */}
      {storeOpen && (
        <StorePanel
          selectedId={previewId}
          equippedId={equippedId}
          ownedIds={ownedIds}
          onPreview={setPreviewId}
          onUnlock={handleUnlock}
          onEquip={handleEquip}
          onClose={closeStore}
        />
      )}

      {/* Coming soon modal */}
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

  topBar: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,19,42,0.78)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    padding: 7,
    paddingRight: 16,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.primary,
    padding: 1,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 8 },
  avatarFallback: {
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontFamily: fonts.heading, fontSize: 18, color: "#fff" },
  levelChip: {
    position: "absolute",
    bottom: -7,
    alignSelf: "center",
    backgroundColor: C.primary,
    borderRadius: 6,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#10142a",
  },
  levelChipText: { fontFamily: fonts.bold, fontSize: 9, color: "#fff" },
  playerName: { fontFamily: fonts.headingSemi, fontSize: 15, color: "#fff" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#38e08a",
  },
  playerMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
  },

  topRight: { alignItems: "flex-end", gap: 8 },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 3,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 8,
  },
  brandAccent: { color: C.primary },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,19,42,0.8)",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  iconBtnText: { fontSize: 17, color: "#fff" },

  leftMenu: {
    position: "absolute",
    left: 14,
    top: 92,
    bottom: 74,
    justifyContent: "center",
    gap: 11,
  },
  menuItem: {
    width: 196,
    height: 46,
    justifyContent: "center",
  },
  menuPlate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,24,52,0.9)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 6,
    transform: [{ skewX: "-11deg" }],
  },
  menuPlatePressed: {
    backgroundColor: "rgba(255,92,138,0.22)",
    borderColor: C.primary,
  },
  menuEdge: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    width: 4,
    borderRadius: 2,
    backgroundColor: C.primary,
    transform: [{ skewX: "-11deg" }],
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingLeft: 20,
    paddingRight: 12,
  },
  menuIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.2)",
  },
  menuIcon: { fontSize: 15 },
  menuLabel: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.5,
    color: "#fff",
  },
  soonBadge: {
    marginLeft: "auto",
    backgroundColor: C.accent,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  soonBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1,
    color: "#fff",
  },

  bottomRight: {
    position: "absolute",
    right: 20,
    bottom: 22,
    alignItems: "flex-end",
    gap: 12,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,19,42,0.82)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.18)",
  },
  modeLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#fff",
  },
  modeSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },

  startWrap: {
    width: 216,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  startSkew: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    overflow: "hidden",
    transform: [{ skewX: "-11deg" }],
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  startText: {
    fontFamily: fonts.heading,
    fontSize: 28,
    letterSpacing: 5,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
  },

  drawerBackdrop: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(6,8,20,0.6)",
  },
  drawerDismiss: { flex: 1 },
  drawer: {
    width: 360,
    maxWidth: "90%",
    backgroundColor: C.background,
    borderLeftWidth: 1,
    borderLeftColor: C.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  drawerTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    letterSpacing: 3,
    color: "#fff",
  },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  drawerCloseText: { fontSize: 15, color: C.mutedForeground },

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
  modalBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: "#fff" },
});
