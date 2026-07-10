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
  { key: "character", icon: "🧍", label: "CHARACTER", action: "character", ready: true },
  { key: "friends", icon: "👥", label: "FRIENDS", action: "friends", ready: true },
  { key: "store", icon: "🛍️", label: "STORE", action: "store", ready: true },
  { key: "events", icon: "🎉", label: "EVENTS", action: "soon", ready: false },
  { key: "maps", icon: "🗺️", label: "MAPS", action: "soon", ready: false },
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
      {/* 3D character hero */}
      <LobbyAvatarStage avatarId={heroAvatarId} fallbackPhotoUrl={photoUrl} />

      {/* Legibility scrims so UI stays readable over the 3D scene */}
      <View style={styles.scrimTop} pointerEvents="none" />
      <View style={styles.scrimBottom} pointerEvents="none" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.profileCard} onPress={onEditProfile}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{initialLetter}</Text>
            </View>
          )}
          <View style={{ maxWidth: 150 }}>
            <Text style={styles.playerName} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text style={styles.playerMeta} numberOfLines={1}>
              {profile.gender === "female" ? "♀" : "♂"} Citizen
            </Text>
          </View>
        </Pressable>

        <Text style={styles.brand}>✦ NEURA CITY</Text>

        <View style={styles.topRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setFriendsOpen(true)}
          >
            <Text style={styles.iconBtnText}>👥</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onEditProfile}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </Pressable>
          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {/* Left vertical menu */}
      <View style={styles.leftMenu}>
        {MENU.map((item) => (
          <Pressable
            key={item.key}
            style={styles.menuItem}
            onPress={() => handleMenu(item)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {!item.ready && (
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>SOON</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Bottom-right START */}
      <View style={styles.bottomRight}>
        <View style={styles.modeCard}>
          <Text style={styles.modeLabel}>OPEN WORLD</Text>
          <Text style={styles.modeSub}>Neura City</Text>
        </View>
        <Pressable style={styles.startBtn} onPress={onPlay}>
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
  scrimTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: "rgba(6,8,20,0.55)",
  },
  scrimBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "rgba(6,8,20,0.45)",
  },

  topBar: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,19,42,0.8)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 8,
    paddingRight: 14,
  },
  avatar: { width: 40, height: 40, borderRadius: 10 },
  avatarFallback: {
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontFamily: fonts.heading, fontSize: 18, color: "#fff" },
  playerName: { fontFamily: fonts.headingSemi, fontSize: 15, color: "#fff" },
  playerMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 18,
    letterSpacing: 3,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 8,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,19,42,0.8)",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  iconBtnText: { fontSize: 18 },
  logoutBtn: {
    backgroundColor: "rgba(16,19,42,0.8)",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: C.mutedForeground,
  },

  leftMenu: {
    position: "absolute",
    left: 16,
    top: 90,
    bottom: 90,
    justifyContent: "center",
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,19,42,0.82)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: 178,
  },
  menuIcon: { fontSize: 18, width: 22, textAlign: "center" },
  menuLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    letterSpacing: 1.5,
    color: "#fff",
  },
  soonBadge: {
    marginLeft: "auto",
    backgroundColor: C.accent,
    borderRadius: 7,
    paddingHorizontal: 6,
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
    bottom: 24,
    alignItems: "flex-end",
    gap: 10,
  },
  modeCard: {
    backgroundColor: "rgba(16,19,42,0.82)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  modeLabel: {
    fontFamily: fonts.headingSemi,
    fontSize: 13,
    letterSpacing: 2,
    color: "#fff",
  },
  modeSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },
  startBtn: {
    backgroundColor: C.primary,
    borderWidth: 1,
    borderColor: C.primaryBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 54,
    shadowColor: C.primary,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  startText: {
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: 4,
    color: "#fff",
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
