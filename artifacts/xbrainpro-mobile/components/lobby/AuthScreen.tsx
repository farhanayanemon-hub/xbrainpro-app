import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  login,
  register,
  type AuthResult,
} from "@workspace/api-client-react";

import colors, { fonts } from "@/constants/colors";

const C = colors.dark;

export default function AuthScreen({
  onAuthed,
}: {
  /** isNew = true when the account was just created (go to profile setup). */
  onAuthed: (result: AuthResult, isNew: boolean) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        const result = await register({
          email: cleanEmail,
          password,
          name: cleanEmail.split("@")[0],
        });
        onAuthed(result, true);
      } else {
        const result = await login({ email: cleanEmail, password });
        onAuthed(result, false);
      }
    } catch (e) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ||
        (e as Error).message ||
        "Something went wrong";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.spark}>✦</Text>
        <Text style={styles.title}>NEURA CITY</Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? "Welcome back, citizen" : "Become a citizen"}
        </Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "login" && styles.tabActive]}
            onPress={() => {
              setMode("login");
              setError(null);
            }}
          >
            <Text
              style={[styles.tabText, mode === "login" && styles.tabTextActive]}
            >
              Log in
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => {
              setMode("register");
              setError(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                mode === "register" && styles.tabTextActive,
              ]}
            >
              Sign up
            </Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={C.mutedForeground}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (8+ characters)"
          placeholderTextColor={C.mutedForeground}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.submit, busy && { opacity: 0.6 }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === "login" ? "ENTER" : "CREATE ACCOUNT"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
  },
  spark: { color: C.primary, fontSize: 24, marginBottom: 8 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: 5,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
    marginTop: 6,
    marginBottom: 18,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: C.muted,
    borderRadius: 12,
    padding: 4,
    alignSelf: "stretch",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: { backgroundColor: C.primary },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: C.mutedForeground,
  },
  tabTextActive: { color: "#fff" },
  input: {
    alignSelf: "stretch",
    backgroundColor: C.input,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: 10,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#f87171",
    marginBottom: 8,
    textAlign: "center",
  },
  submit: {
    alignSelf: "stretch",
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    color: "#fff",
  },
});
