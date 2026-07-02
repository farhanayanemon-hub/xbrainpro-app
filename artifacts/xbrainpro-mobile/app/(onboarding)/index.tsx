import { Ionicons } from "@expo/vector-icons";
import {
  createProgram,
  updateProfile,
  useListPaths,
  type Path,
} from "@workspace/api-client-react";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Card,
  Chip,
  Field,
  LoadingView,
  ProgressBar,
} from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { pathIcon } from "@/constants/paths";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

interface Assessment {
  about: string;
  currentSituation: string;
  biggestChallenge: string;
  motivation: string;
  focusMinutesPerDay: number;
}

const FOCUS_OPTIONS = [15, 30, 45, 60, 90];

const QUESTIONS: {
  key: keyof Omit<Assessment, "focusMinutesPerDay">;
  title: string;
  subtitle: string;
  placeholder: string;
}[] = [
  {
    key: "about",
    title: "Apnar somporke bolun",
    subtitle: "Ke apni, ki koren — ektu likhun.",
    placeholder: "Ami ekjon...",
  },
  {
    key: "currentSituation",
    title: "Ekhon apnar obostha ki?",
    subtitle: "Ei muhurte life ta kemon jacche?",
    placeholder: "Ekhon ami...",
  },
  {
    key: "biggestChallenge",
    title: "Sobcheye boro challenge ki?",
    subtitle: "Kon jinis ta apnake atke rakhche?",
    placeholder: "Amar challenge holo...",
  },
  {
    key: "motivation",
    title: "Ki apnake drive kore?",
    subtitle: "Keno apni change chan?",
    placeholder: "Ami chai...",
  },
];

// Steps: 0-3 assessment questions, 4 focus minutes, 5 path select, 6 duration.
const TOTAL_STEPS = 7;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { data: paths, isLoading: pathsLoading } = useListPaths();

  const [step, setStep] = useState(0);
  const [assessment, setAssessment] = useState<Assessment>({
    about: "",
    currentSituation: "",
    biggestChallenge: "",
    motivation: "",
    focusMinutesPerDay: 30,
  });
  const [pathKey, setPathKey] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState<30 | 60>(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPath: Path | undefined = useMemo(
    () => paths?.find((p) => p.key === pathKey),
    [paths, pathKey],
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const canAdvance = (): boolean => {
    if (step <= 3) {
      return assessment[QUESTIONS[step].key].trim().length > 0;
    }
    if (step === 4) return true;
    if (step === 5) return !!pathKey;
    return true;
  };

  const next = () => {
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      generate();
    }
  };

  const back = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  };

  const generate = async () => {
    if (!pathKey) return;
    setGenerating(true);
    setError(null);
    try {
      await updateProfile({
        about: assessment.about.trim(),
        currentSituation: assessment.currentSituation.trim(),
        biggestChallenge: assessment.biggestChallenge.trim(),
        motivation: assessment.motivation.trim(),
        focusMinutesPerDay: assessment.focusMinutesPerDay,
        onboarded: true,
      });
      await createProgram({
        pathKey,
        durationDays,
        about: assessment.about.trim(),
        currentSituation: assessment.currentSituation.trim(),
        biggestChallenge: assessment.biggestChallenge.trim(),
        motivation: assessment.motivation.trim(),
      });
      await refreshUser();
      // Guard in _layout will move us to the tabs once user.hasProgram is true.
    } catch {
      setError("Program banate parini. Abar try korun.");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <View style={styles.flex}>
        <View style={styles.generating}>
          <LoadingView />
          <Text style={styles.generatingTitle}>
            Apnar personalized program toiri hocche
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.progressWrap, { paddingTop: topPad + 12 }]}>
        <View style={styles.progressHeader}>
          {step > 0 ? (
            <Pressable onPress={back} hitSlop={12} testID="onboard-back">
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <Text style={styles.stepText}>
            {step + 1} / {TOTAL_STEPS}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ProgressBar value={((step + 1) / TOTAL_STEPS) * 100} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {step <= 3 ? (
          <View style={styles.block}>
            <Text style={styles.qTitle}>{QUESTIONS[step].title}</Text>
            <Text style={styles.qSub}>{QUESTIONS[step].subtitle}</Text>
            <Field
              placeholder={QUESTIONS[step].placeholder}
              value={assessment[QUESTIONS[step].key]}
              onChangeText={(t) =>
                setAssessment((a) => ({ ...a, [QUESTIONS[step].key]: t }))
              }
              multiline
              style={styles.textarea}
              testID="assessment-input"
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.block}>
            <Text style={styles.qTitle}>Prottidin koto somoy debেন?</Text>
            <Text style={styles.qSub}>
              Roj koto minute focus korte parben?
            </Text>
            <View style={styles.chipWrap}>
              {FOCUS_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  label={`${m} min`}
                  selected={assessment.focusMinutesPerDay === m}
                  onPress={() =>
                    setAssessment((a) => ({ ...a, focusMinutesPerDay: m }))
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.block}>
            <Text style={styles.qTitle}>Apnar path beছে nin</Text>
            <Text style={styles.qSub}>
              Kon transformation ta apni chan?
            </Text>
            {pathsLoading ? (
              <View style={{ paddingVertical: 40 }}>
                <LoadingView />
              </View>
            ) : (
              <View style={styles.pathList}>
                {paths?.map((p) => {
                  const active = p.key === pathKey;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setPathKey(p.key)}
                      testID={`path-${p.key}`}
                    >
                      <Card
                        style={[
                          styles.pathCard,
                          active
                            ? { borderColor: p.accent, borderWidth: 2 }
                            : null,
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
            )}
          </View>
        ) : null}

        {step === 6 ? (
          <View style={styles.block}>
            <Text style={styles.qTitle}>Koto diner plan?</Text>
            <Text style={styles.qSub}>
              {selectedPath ? selectedPath.title : "Apnar"} journey er duration
              beছে nin.
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
                    testID={`duration-${d}`}
                  >
                    <Card
                      style={[
                        styles.durationCard,
                        active
                          ? { borderColor: accent, borderWidth: 2 }
                          : null,
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
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={c.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
      >
        <Button
          label={step === TOTAL_STEPS - 1 ? "Program banao" : "Continue"}
          onPress={next}
          disabled={!canAdvance()}
          icon={step === TOTAL_STEPS - 1 ? "sparkles" : undefined}
          testID="onboard-continue"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.mutedForeground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  block: { gap: 8 },
  qTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: c.foreground,
  },
  qSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: c.mutedForeground,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 130,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pathList: { gap: 12, marginTop: 4 },
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
    marginTop: 4,
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
