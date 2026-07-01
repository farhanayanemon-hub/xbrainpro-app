import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
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

import { Button, Field } from "@/components/ui";
import colors, { fonts } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const c = colors.light;

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email ar password din.");
      return;
    }
    if (isRegister && !name.trim()) {
      setError("Apnar naam din.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimum 6 character hote hobe.");
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await signUp(name.trim(), email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      // Navigation handled by the guard in _layout once user state updates.
    } catch (e) {
      const status =
        typeof e === "object" && e !== null && "status" in e
          ? (e as { status?: number }).status
          : undefined;
      if (status === 401) {
        setError("Email ba password thik nei.");
      } else if (status === 400 || status === 409) {
        setError("Ei email diye account ache, login korun.");
      } else {
        setError("Kichu problem holo. Abar try korun.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="cover"
          />
          <Text style={styles.appName}>XBrainPro</Text>
          <Text style={styles.tagline}>
            Nijeke transform korun, ek step at a time.
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister ? (
            <Field
              placeholder="Naam"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              testID="name-input"
            />
          ) : null}
          <Field
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            testID="email-input"
          />
          <Field
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="password-input"
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={c.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={isRegister ? "Account banao" : "Login"}
            onPress={submit}
            loading={submitting}
            testID="submit-button"
            style={{ marginTop: 4 }}
          />
        </View>

        <Pressable
          onPress={() => {
            setError(null);
            setMode(isRegister ? "login" : "register");
          }}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            {isRegister ? "Already account ache? " : "Notun ekhane? "}
            <Text style={styles.switchLink}>
              {isRegister ? "Login korun" : "Account banao"}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.background },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: c.foreground,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 260,
  },
  form: {
    gap: 12,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.destructive,
    flex: 1,
  },
  switchRow: {
    marginTop: 24,
    alignItems: "center",
  },
  switchText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.mutedForeground,
  },
  switchLink: {
    fontFamily: fonts.semibold,
    color: c.primary,
  },
});
