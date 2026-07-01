import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader, Card } from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <View style={styles.flex}>
      <AppHeader title="Settings" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.levelPill}>
            <Ionicons name="ribbon" size={14} color={c.primary} />
            <Text style={styles.levelText}>Lv {user?.level ?? 1}</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Text style={styles.miniValue}>{user?.xp ?? 0}</Text>
            <Text style={styles.miniLabel}>XP</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniValue}>{user?.streak ?? 0}</Text>
            <Text style={styles.miniLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.group}>
          <Row
            icon="clipboard-outline"
            label="Assessment edit korun"
            onPress={() => router.push("/edit-assessment")}
            testID="settings-edit-assessment"
          />
          <View style={styles.divider} />
          <Row
            icon="refresh-outline"
            label="Notun program shuru korun"
            onPress={() => router.push("/new-program")}
            testID="settings-new-program"
          />
          <View style={styles.divider} />
          <Row
            icon="notifications-outline"
            label="Reminders"
            onPress={() => router.push("/reminders")}
            testID="settings-reminders"
          />
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [
            styles.logout,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          testID="logout-button"
        >
          <Ionicons name="log-out-outline" size={20} color={c.destructive} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={styles.version}>XBrainPro · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={c.foreground} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: "#fff",
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: c.foreground,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 2,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${c.primary}22`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: c.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  miniStat: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: c.cardBorder,
    paddingVertical: 16,
    alignItems: "center",
    gap: 2,
  },
  miniValue: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: c.foreground,
  },
  miniLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
  },
  group: {
    backgroundColor: c.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: "hidden",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: c.cardBorder,
    marginLeft: 52,
  },
  rowIcon: {
    width: 24,
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: c.foreground,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: c.border,
  },
  logoutText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: c.destructive,
  },
  version: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
    textAlign: "center",
    marginTop: 24,
  },
});
