import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetDashboardQueryKey,
  getGetProfileQueryKey,
  getGetProfileQueryOptions,
  getGetProgressQueryKey,
  updateProfile,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppHeader,
  Button,
  Chip,
  ErrorView,
  Field,
  LoadingView,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

const FOCUS_OPTIONS = [15, 30, 45, 60, 90];

interface AssessmentForm {
  about: string;
  currentSituation: string;
  biggestChallenge: string;
  motivation: string;
  focusMinutesPerDay: number;
}

const QUESTIONS: {
  key: keyof Omit<AssessmentForm, "focusMinutesPerDay">;
  title: string;
  subtitle: string;
  placeholder: string;
}[] = [
  {
    key: "about",
    title: "Apnar somporke",
    subtitle: "Ke apni, ki koren.",
    placeholder: "Ami ekjon...",
  },
  {
    key: "currentSituation",
    title: "Ekhon apnar obostha",
    subtitle: "Ei muhurte life ta kemon jacche?",
    placeholder: "Ekhon ami...",
  },
  {
    key: "biggestChallenge",
    title: "Sobcheye boro challenge",
    subtitle: "Kon jinis ta apnake atke rakhche?",
    placeholder: "Amar challenge holo...",
  },
  {
    key: "motivation",
    title: "Ki apnake drive kore",
    subtitle: "Keno apni change chan?",
    placeholder: "Ami chai...",
  },
];

export default function EditAssessmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery(getGetProfileQueryOptions());

  const [form, setForm] = useState<AssessmentForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the editable form once the profile has loaded.
  useEffect(() => {
    if (profile && !form) {
      setForm({
        about: profile.about ?? "",
        currentSituation: profile.currentSituation ?? "",
        biggestChallenge: profile.biggestChallenge ?? "",
        motivation: profile.motivation ?? "",
        focusMinutesPerDay: profile.focusMinutesPerDay ?? 30,
      });
    }
  }, [profile, form]);

  const canSave =
    !!form &&
    QUESTIONS.every((q) => form[q.key].trim().length > 0) &&
    !saving;

  const save = async () => {
    if (!form || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        about: form.about.trim(),
        currentSituation: form.currentSituation.trim(),
        biggestChallenge: form.biggestChallenge.trim(),
        motivation: form.motivation.trim(),
        focusMinutesPerDay: form.focusMinutesPerDay,
        onboarded: true,
      });
      await queryClient.invalidateQueries({
        queryKey: getGetProfileQueryKey(),
      });
      // Reflect any downstream changes on the home dashboard.
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
      await refreshUser();
      if (Platform.OS === "web") {
        router.back();
      } else {
        Alert.alert("Save holo", "Apnar answer gulo update kora hoyeche.", [
          { text: "Thik ache", onPress: () => router.back() },
        ]);
      }
    } catch {
      setError("Save korte parini. Abar try korun.");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader
        title="Assessment edit"
        subtitle="Apnar answer gulo update korun"
        onBack={() => router.back()}
      />

      {isLoading || (!form && !isError) ? (
        <LoadingView />
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : form ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {QUESTIONS.map((q) => (
            <View key={q.key} style={styles.block}>
              <Text style={styles.qTitle}>{q.title}</Text>
              <Text style={styles.qSub}>{q.subtitle}</Text>
              <Field
                placeholder={q.placeholder}
                value={form[q.key]}
                onChangeText={(t) =>
                  setForm((f) => (f ? { ...f, [q.key]: t } : f))
                }
                multiline
                style={styles.textarea}
                testID={`edit-${q.key}`}
              />
            </View>
          ))}

          <View style={styles.block}>
            <Text style={styles.qTitle}>Daily focus</Text>
            <Text style={styles.qSub}>Roj koto minute focus korben?</Text>
            <View style={styles.chipWrap}>
              {FOCUS_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  label={`${m} min`}
                  selected={form.focusMinutesPerDay === m}
                  onPress={() =>
                    setForm((f) => (f ? { ...f, focusMinutesPerDay: m } : f))
                  }
                />
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={c.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Save changes"
            onPress={save}
            loading={saving}
            disabled={!canSave}
            style={{ marginTop: 12 }}
            testID="save-assessment"
          />
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  block: { gap: 8, marginTop: 20 },
  qTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 18,
    color: c.foreground,
  },
  qSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
    marginBottom: 6,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
});
