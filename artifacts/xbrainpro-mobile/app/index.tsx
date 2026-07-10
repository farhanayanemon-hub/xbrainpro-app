import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  getCurrentUser,
  getPlayerProfile,
  logout as apiLogout,
  type AuthResult,
  type PlayerProfile,
} from "@workspace/api-client-react";

import AuthScreen from "@/components/lobby/AuthScreen";
import LobbyScreen from "@/components/lobby/LobbyScreen";
import ProfileSetup from "@/components/lobby/ProfileSetup";
import colors, { fonts } from "@/constants/colors";
import { clearToken, loadToken, saveToken } from "@/lib/session";

const C = colors.dark;

type Stage = "loading" | "auth" | "setup" | "editing" | "lobby" | "error";

/** Read an HTTP status off a thrown API error, if present. */
function errStatus(e: unknown): number | undefined {
  return (e as { status?: number })?.status;
}

export default function Gate() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  // Restore the session on launch: token → user → profile → lobby.
  const restore = useCallback(async () => {
    setStage("loading");
    const token = await loadToken();
    if (!token) {
      setStage("auth");
      return;
    }
    try {
      await getCurrentUser();
    } catch (e) {
      if (errStatus(e) === 401) {
        // Token expired or invalid — back to login.
        await clearToken();
        setStage("auth");
      } else {
        // Network / server hiccup — let the user retry instead of losing session.
        setStage("error");
      }
      return;
    }
    try {
      const p = await getPlayerProfile();
      setProfile(p);
      setStage("lobby");
    } catch (e) {
      const status = errStatus(e);
      if (status === 404) {
        setStage("setup"); // logged in but no profile yet
      } else if (status === 401) {
        await clearToken();
        setStage("auth");
      } else {
        setStage("error");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await restore();
    })();
    return () => {
      cancelled = true;
    };
  }, [restore]);

  const handleAuthed = useCallback(async (result: AuthResult, isNew: boolean) => {
    await saveToken(result.token);
    if (isNew) {
      setProfile(null);
      setStage("setup");
      return;
    }
    try {
      const p = await getPlayerProfile();
      setProfile(p);
      setStage("lobby");
    } catch (e) {
      // Existing account without a profile still needs setup; only 404 means that.
      if (errStatus(e) === 404) {
        setStage("setup");
      } else {
        setStage("error");
      }
    }
  }, []);

  const handleProfileDone = useCallback((p: PlayerProfile) => {
    setProfile(p);
    setStage("lobby");
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // even if the server call fails, drop the local session
    }
    await clearToken();
    setProfile(null);
    setStage("auth");
  }, []);

  if (stage === "loading") {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingSpark}>✦</Text>
        <Text style={styles.loadingTitle}>NEURA CITY</Text>
        <ActivityIndicator color={C.primary} style={{ marginTop: 14 }} />
      </View>
    );
  }

  if (stage === "error") {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingSpark}>✦</Text>
        <Text style={styles.loadingTitle}>NEURA CITY</Text>
        <Text style={styles.errorText}>
          Couldn't reach the city servers. Check your connection and try
          again.
        </Text>
        <Pressable style={styles.retryBtn} onPress={() => void restore()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === "auth") {
    return <AuthScreen onAuthed={handleAuthed} />;
  }

  if (stage === "setup" || stage === "editing") {
    return (
      <ProfileSetup
        initial={stage === "editing" ? profile : null}
        onDone={handleProfileDone}
        onCancel={
          stage === "editing" ? () => setStage("lobby") : undefined
        }
      />
    );
  }

  return (
    <LobbyScreen
      profile={profile!}
      onPlay={() => router.push("/city")}
      onEditProfile={() => setStage("editing")}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingSpark: { color: C.primary, fontSize: 26, marginBottom: 8 },
  loadingTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 5,
    color: "#fff",
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 14,
    marginHorizontal: 40,
  },
  retryBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
  },
  retryText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    color: "#fff",
  },
});
