import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type PlayerProfile } from "@workspace/api-client-react";

import colors, { fonts } from "@/constants/colors";
import { getUnreadTotal } from "@/lib/dm";
import { buyAvatar, fetchWallet, formatAmount, type Wallet } from "@/lib/wallet";
import { absoluteApiUrl } from "@/lib/session";
import { playBack, playConfirm, playTap } from "@/lib/sfx";
import AmbientFX from "@/components/lobby/AmbientFX";
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
const NATIVE = Platform.OS !== "web";

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  action: "play" | "friends" | "character" | "store";
};

// Only shipping features live here — placeholder tiles are added back when
// their real feature lands, never as dead "coming soon" buttons.
const MENU: MenuItem[] = [
  { key: "store", icon: "🛍️", label: "STORE", action: "store" },
  { key: "character", icon: "🧍", label: "CHARACTER", action: "character" },
  { key: "friends", icon: "👥", label: "FRIENDS", action: "friends" },
];

/* -------------------------------------------------------------------------- */
/* Animated menu tab — slides in from the left with a stagger, springs on tap  */
/* -------------------------------------------------------------------------- */

function MenuTab({
  item,
  index,
  onPress,
}: {
  item: MenuItem;
  index: number;
  onPress: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      delay: 260 + index * 75,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [enter, index]);

  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] });

  return (
    <Animated.View
      style={{ opacity: enter, transform: [{ translateX }, { scale }] }}
    >
      <Pressable
        style={styles.menuItem}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: NATIVE,
            speed: 40,
            bounciness: 0,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: NATIVE,
            speed: 20,
            bounciness: 8,
          }).start()
        }
        onPress={() => {
          playTap();
          onPress();
        }}
      >
        {({ pressed }) => (
          <>
            <View style={[styles.menuPlate, pressed && styles.menuPlatePressed]} />
            <View style={styles.menuEdge} />
            <View style={styles.menuContent}>
              <View style={styles.menuIconBox}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* START button — breathing glow, shine sweep, press-scale                    */
/* -------------------------------------------------------------------------- */

function StartButton({ onPress }: { onPress: () => void }) {
  const glow = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(shine, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ]),
    );
    glowLoop.start();
    shineLoop.start();
    return () => {
      glowLoop.stop();
      shineLoop.stop();
    };
  }, [glow, shine]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-120, 240] });
  const shineOpacity = shine.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 0],
  });

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: NATIVE,
          speed: 40,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: NATIVE,
          speed: 18,
          bounciness: 10,
        }).start()
      }
      onPress={() => {
        playConfirm();
        onPress();
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Pulsing glow halo behind the button */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.startGlow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
        <View style={styles.startWrap}>
          <View style={styles.startSkew}>
            <LinearGradient
              colors={[C.primary, C.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Shine sweep */}
            <Animated.View
              style={[
                styles.startShine,
                { opacity: shineOpacity, transform: [{ translateX: shineX }, { skewX: "-12deg" }] },
              ]}
            />
          </View>
          <View style={styles.startInner}>
            <Text style={styles.startText}>START</Text>
            <Text style={styles.startChevrons}>▶▶</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Small resource pill (coins / gems) — Free Fire style HUD                    */
/* -------------------------------------------------------------------------- */

function ResourcePill({
  icon,
  value,
  tint,
  onPress,
}: {
  icon: string;
  value: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.pill}
      onPress={() => {
        playTap();
        onPress();
      }}
    >
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillValue}>{value}</Text>
      <View style={[styles.pillPlus, { backgroundColor: tint }]}>
        <Text style={styles.pillPlusText}>+</Text>
      </View>
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
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  // Unread private messages across all friends — badges the 👥 button.
  const [unreadTotal, setUnreadTotal] = useState(0);
  // The equipped look — this is what persists and carries into the city.
  const [equippedId, setEquippedId] = useState(
    GENDER_AVATAR[profile.gender === "female" ? "female" : "male"],
  );
  // The look currently being previewed in the Store (drives the 3D hero while
  // the sheet is open). Falls back to the equipped look when the store closes.
  const [previewId, setPreviewId] = useState(equippedId);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  // Server-authoritative currency balance. Null until the first fetch lands.
  const [wallet, setWallet] = useState<Wallet | null>(null);
  // Id of the look currently being purchased (disables its Unlock button).
  const [buyingId, setBuyingId] = useState<string | null>(null);
  // Transient store message (e.g. "Not enough coins") shown under the sheet.
  const [notice, setNotice] = useState<string | null>(null);

  // Entrance choreography: top bar drops in, bottom panel scales up.
  const enter = useRef(new Animated.Value(0)).current;
  const online = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();

    const onlineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(online, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(online, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE,
        }),
      ]),
    );
    onlineLoop.start();
    return () => onlineLoop.stop();
  }, [enter, online]);

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
    void fetchWallet()
      .then((w) => {
        if (!cancelled) setWallet(w);
      })
      .catch(() => {
        /* non-fatal: pills stay at last known / dashes until a retry */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll the unread-DM total so the friends badge stays fresh, and refresh
  // right after the drawer closes (reading a thread clears its unread count).
  useEffect(() => {
    if (friendsOpen) return;
    let cancelled = false;
    const tick = () => {
      void getUnreadTotal()
        .then((n) => {
          if (!cancelled) setUnreadTotal(n);
        })
        .catch(() => {
          /* non-fatal: badge just stays as-is */
        });
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [friendsOpen]);

  const openStore = () => {
    setPreviewId(equippedId);
    setStoreOpen(true);
  };

  const closeStore = () => {
    setPreviewId(equippedId); // discard any un-equipped preview
    setStoreOpen(false);
  };

  const handleUnlock = (id: string) => {
    if (buyingId) return; // one purchase at a time
    setNotice(null);
    setBuyingId(id);
    void buyAvatar(id)
      .then(async (res) => {
        setWallet({ coins: res.coins, gems: res.gems });
        const ids = await unlockAvatar(id);
        setOwnedIds(ids);
        playConfirm();
      })
      .catch((err: unknown) => {
        // customFetch throws ApiError with .data.error on non-2xx.
        const msg =
          typeof err === "object" &&
          err !== null &&
          "data" in err &&
          typeof (err as { data?: { error?: unknown } }).data?.error ===
            "string"
            ? (err as { data: { error: string } }).data.error
            : "Couldn't complete purchase. Try again.";
        setNotice(msg);
        // Re-sync balance in case the server state moved.
        void fetchWallet()
          .then((w) => setWallet(w))
          .catch(() => {});
      })
      .finally(() => setBuyingId(null));
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
      default:
        onPlay();
    }
  };

  const topBarTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [-46, 0] });
  const bottomScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const bottomTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const onlineScale = online.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const onlineOpacity = online.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <View style={styles.root}>
      {/* 3D character hero + neon stage backdrop */}
      <LobbyAvatarStage avatarId={heroAvatarId} fallbackPhotoUrl={photoUrl} />

      {/* Animated atmosphere (embers, glows, vignette, light sweep) */}
      <AmbientFX />

      {/* Top bar */}
      <Animated.View
        style={[
          styles.topBar,
          { opacity: enter, transform: [{ translateY: topBarTranslate }] },
        ]}
      >
        <Pressable
          style={styles.profileCard}
          onPress={() => {
            playTap();
            onEditProfile();
          }}
        >
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
          <View style={{ maxWidth: 168 }}>
            <Text style={styles.playerName} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDotWrap}>
                <Animated.View
                  style={[
                    styles.onlinePulse,
                    { transform: [{ scale: onlineScale }], opacity: onlineOpacity },
                  ]}
                />
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.playerMeta} numberOfLines={1}>
                Citizen · Lv 1
              </Text>
            </View>
            {/* XP progress */}
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={[C.primary, C.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.xpFill}
              />
            </View>
          </View>
        </Pressable>

        <View style={styles.topRight}>
          <Text style={styles.brand}>
            NEURA<Text style={styles.brandAccent}> CITY</Text>
          </Text>
          <View style={styles.hudRow}>
            <ResourcePill
              icon="🪙"
              value={wallet ? formatAmount(wallet.coins) : "…"}
              tint="#f5b942"
              onPress={openStore}
            />
            <ResourcePill
              icon="💎"
              value={wallet ? formatAmount(wallet.gems) : "…"}
              tint={C.accent}
              onPress={openStore}
            />
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                playTap();
                setFriendsOpen(true);
              }}
            >
              <Text style={styles.iconBtnText}>👥</Text>
              {unreadTotal > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                playTap();
                onEditProfile();
              }}
            >
              <Text style={styles.iconBtnText}>⚙️</Text>
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                playBack();
                onLogout();
              }}
            >
              <Text style={styles.iconBtnText}>⏻</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Left vertical angular menu */}
      <View style={styles.leftMenu}>
        {MENU.map((item, i) => (
          <MenuTab
            key={item.key}
            item={item}
            index={i}
            onPress={() => handleMenu(item)}
          />
        ))}
      </View>

      {/* Bottom-right mode card + START */}
      <Animated.View
        style={[
          styles.bottomRight,
          { opacity: enter, transform: [{ translateY: bottomTranslate }, { scale: bottomScale }] },
        ]}
      >
        <View style={styles.modeCard}>
          <View style={styles.modeIcon}>
            <Text style={{ fontSize: 18 }}>🌆</Text>
          </View>
          <View>
            <Text style={styles.modeLabel}>OPEN WORLD</Text>
            <Text style={styles.modeSub}>Neura City</Text>
          </View>
          <View style={styles.modeLive}>
            <View style={styles.modeLiveDot} />
            <Text style={styles.modeLiveText}>LIVE</Text>
          </View>
        </View>

        <StartButton onPress={onPlay} />
      </Animated.View>

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
                  onPress={() => {
                    playBack();
                    setFriendsOpen(false);
                  }}
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
          coins={wallet?.coins ?? 0}
          gems={wallet?.gems ?? 0}
          busyId={buyingId}
          notice={notice}
          onPreview={(id) => {
            setNotice(null);
            setPreviewId(id);
          }}
          onUnlock={handleUnlock}
          onEquip={handleEquip}
          onClose={() => {
            setNotice(null);
            closeStore();
          }}
        />
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
    backgroundColor: "rgba(16,19,42,0.82)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 7,
    paddingRight: 18,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.primary,
    padding: 1,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 9 },
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
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  onlineDotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  onlinePulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38e08a",
  },
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
  xpTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 6,
    overflow: "hidden",
  },
  xpFill: { height: "100%", width: "22%", borderRadius: 3 },

  topRight: { alignItems: "flex-end", gap: 8 },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 3,
    color: "#fff",
    textShadowColor: "rgba(255,92,138,0.5)",
    textShadowRadius: 12,
  },
  brandAccent: { color: C.primary },
  hudRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,19,42,0.85)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 999,
    paddingLeft: 8,
    paddingRight: 4,
    height: 30,
  },
  pillIcon: { fontSize: 13 },
  pillValue: { fontFamily: fonts.bold, fontSize: 12, color: "#fff", minWidth: 12 },
  pillPlus: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  pillPlusText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#fff",
    marginTop: -1,
  },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,19,42,0.85)",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  iconBtnText: { fontSize: 15, color: "#fff" },
  unreadBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#ff5470",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#fff",
  },

  leftMenu: {
    position: "absolute",
    left: 14,
    top: 96,
    bottom: 78,
    justifyContent: "center",
    gap: 11,
  },
  menuItem: {
    width: 200,
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
    backgroundColor: "rgba(16,19,42,0.85)",
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
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
  modeLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 6,
    backgroundColor: "rgba(56,224,138,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  modeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38e08a",
  },
  modeLiveText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1,
    color: "#38e08a",
  },

  startGlow: {
    position: "absolute",
    top: -10,
    left: -6,
    right: -6,
    bottom: -10,
    borderRadius: 20,
    backgroundColor: C.primary,
  },
  startWrap: {
    width: 224,
    height: 64,
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
    borderColor: "rgba(255,255,255,0.4)",
  },
  startShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 46,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  startInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startText: {
    fontFamily: fonts.heading,
    fontSize: 28,
    letterSpacing: 5,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowRadius: 6,
  },
  startChevrons: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
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
