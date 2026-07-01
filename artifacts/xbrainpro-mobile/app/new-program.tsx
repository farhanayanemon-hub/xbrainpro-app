import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  createProgram,
  getGetDashboardQueryKey,
  getGetProgressQueryKey,
  getGetTodayTasksQueryKey,
  useListPaths,
  type Path,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppHeader,
  Button,
  Card,
  ErrorView,
  LoadingView,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { pathIcon } from "@/constants/paths";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

export default function NewProgramScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const { data: paths, isLoading, isError, refetch } = useListPaths();

  const [pathKey, setPathKey] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState<30 | 60>(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPath: Path | undefined = useMemo(
    () => paths?.find((p) => p.key === pathKey),
    [paths, pathKey],
  );

  const generate = async () => {
    if (!pathKey) return;
    setGenerating(true);
    setError(null);
    try {
      await createProgram({ pathKey, durationDays });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
      await refreshUser();
      router.replace("/(tabs)");
    } catch {
      setError("Program banate parini. Abar try korun.");
      setGenerating(false);
    }
  };

  const confirmGenerate = () => {
    if (!pathKey) return;
    if (Platform.OS === "web") {
      generate();
      return;
    }
    Alert.alert(
      "Notun program shuru korben?",
      "Apnar ekhonkar chola program ta archive hoye jabe ebong ekta notun plan toiri hobe.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Shuru koro", style: "destructive", onPress: generate },
      ],
    );
  };

  if (generating) {
    return (
      <View style={styles.flex}>
        <View style={styles.generating}>
          <LoadingView />
          <Text style={styles.generatingTitle}>
            Apnar notun program toiri hocche
          </Text>
          <Text style={styles.generatingSub}>
            AI apnar answer gulo diye ekta full plan banacche. Ektu somoy lagte
            pare.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <AppHeader
        title="Notun program"
        subtitle="Path ba duration poriborton korun"
        onBack={() => router.back()}
      />

      {isLoading ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={c.mutedForeground}
            />
            <Text style={styles.noticeText}>
              Notun program shuru korle apnar ekhonkar plan archive hoye jabe.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Path beche nin</Text>
          <View style={styles.pathList}>
            {paths?.map((p) => {
              const active = p.key === pathKey;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPathKey(p.key)}
                  testID={`newprog-path-${p.key}`}
                >
                  <Card
                    style={[
                      styles.pathCard,
                      active ? { borderColor: p.accent, borderWidth: 2 } : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.pathIcon,
                        { backgroundColor: `${p.accent}22` },
                      ]}
                    >
                      <Ionicons
                        name={pathIcon(p.key)}
                        size={22}
                        color={p.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pathTitle}>{p.title}</Text>
                      <Text style={styles.pathTagline} numberOfLines={2}>
                        {p.tagline}
                      </Text>
                    </View>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={p.accent}
                      />
                    ) : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Koto diner plan?
          </Text>
          <View style={styles.durationRow}>
            {([30, 60] as const).map((d) => {
              const active = durationDays === d;
              const accent = selectedPath?.accent ?? c.primary;
              return (
                <Pressable
                  key={d}
                  style={{ flex: 1 }}
                  onPress={() => setDurationDays(d)}
                  testID={`newprog-duration-${d}`}
                >
                  <Card
                    style={[
                      styles.durationCard,
                      active ? { borderColor: accent, borderWidth: 2 } : null,
                    ]}
                  >
                    <Text style={styles.durationNum}>{d}</Text>
                    <Text style={styles.durationLabel}>din</Text>
                    <Text style={styles.durationSub}>
                      {d === 30 ? "Quick start" : "Deep transformation"}
                    </Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={c.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {!isLoading && !isError ? (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            },
          ]}
        >
          <Button
            label="Program banao"
            onPress={confirmGenerate}
            disabled={!pathKey}
            icon="sparkles"
            testID="newprog-generate"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.secondary,
    borderRadius: colors.radius,
    padding: 12,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: c.mutedForeground,
  },
  sectionTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    color: c.foreground,
    marginBottom: 12,
  },
  pathList: { gap: 12 },
  pathCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pathIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pathTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: c.foreground,
  },
  pathTagline: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 2,
  },
  durationRow: {
    flexDirection: "row",
    gap: 12,
  },
  durationCard: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 2,
  },
  durationNum: {
    fontFamily: fonts.heading,
    fontSize: 40,
    color: c.foreground,
  },
  durationLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: c.mutedForeground,
  },
  durationSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: c.mutedForeground,
    marginTop: 6,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.destructive,
    flex: 1,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  generating: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  generatingTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 20,
    color: c.foreground,
    textAlign: "center",
    marginTop: 8,
  },
  generatingSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 280,
  },
});
