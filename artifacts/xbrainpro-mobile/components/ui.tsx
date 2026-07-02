import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors, { fonts } from "@/constants/colors";

const c = colors.light;
const RADIUS = colors.radius;

type IoniconName = keyof typeof Ionicons.glyphMap;

/* -------------------------------------------------------------------------- */
/* Screen header                                                              */
/* -------------------------------------------------------------------------- */

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <View style={[styles.header, { paddingTop: topPad + 8 }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backBtn}
            testID="back-button"
          >
            <Ionicons name="chevron-back" size={24} color={c.foreground} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === "primary"
      ? c.primary
      : variant === "secondary"
        ? c.secondary
        : "transparent";
  const borderColor =
    variant === "primary"
      ? c.primaryBorder
      : variant === "outline"
        ? c.border
        : "transparent";
  const textColor = variant === "primary" ? c.primaryForeground : c.foreground;

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (isDisabled) return;
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" || variant === "primary" ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? (
            <Ionicons name={icon} size={18} color={textColor} />
          ) : null}
          <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

export function Field({
  style,
  ...props
}: TextInputProps & { style?: StyleProp<TextStyle> }) {
  return (
    <TextInput
      placeholderTextColor={c.mutedForeground}
      style={[styles.input, style]}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Chip (selectable)                                                          */
/* -------------------------------------------------------------------------- */

export function Chip({
  label,
  selected,
  onPress,
  accent,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: string;
}) {
  const active = accent ?? c.primary;
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
        onPress();
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? active : c.secondary,
          borderColor: selected ? active : c.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: selected ? "#ffffff" : c.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Progress bar                                                               */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
  color,
}: {
  value: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct}%`, backgroundColor: color ?? c.primary },
        ]}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: IoniconName;
  value: string | number;
  label: string;
  accent?: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={20} color={accent ?? c.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* State views                                                                */
/* -------------------------------------------------------------------------- */

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}

export function EmptyView({
  icon = "sparkles-outline",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={c.mutedForeground} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: 16, alignSelf: "center", paddingHorizontal: 28 }}
        />
      ) : null}
    </View>
  );
}

export function ErrorView({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyView
      icon="cloud-offline-outline"
      title="Kichu ekta problem hocche"
      message="Data load korte parini. Abar try korun."
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export const theme = { c, fonts, RADIUS };

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: c.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    marginLeft: -6,
    marginRight: 2,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: c.foreground,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: RADIUS,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: c.cardBorder,
    padding: 16,
  },
  input: {
    backgroundColor: c.secondary,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: c.border,
    color: c.foreground,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: c.secondary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  statCard: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
    padding: 14,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: c.foreground,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 6,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: c.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: c.foreground,
    textAlign: "center",
  },
  emptyMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
    textAlign: "center",
    maxWidth: 260,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    color: c.foreground,
    marginBottom: 12,
  },
});
