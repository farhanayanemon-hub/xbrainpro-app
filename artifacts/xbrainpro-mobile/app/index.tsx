import React, { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  getCurrentUser,
  getPlayerProfile,
  logout as apiLogout,
  upsertPlayerProfile,
  type AuthResult,
  type PlayerProfile,
} from "@workspace/api-client-react";

import AuthScreen from "@/components/lobby/AuthScreen";
import CharacterSelect from "@/components/lobby/CharacterSelect";
import Customize from "@/components/lobby/Customize";
import LoadingScreen from "@/components/lobby/LoadingScreen";
import LobbyScreen from "@/components/lobby/LobbyScreen";
import NameSetup from "@/components/lobby/NameSetup";
import ProfileSetup from "@/components/lobby/ProfileSetup";
import Terms from "@/components/lobby/Terms";
import colors, { fonts } from "@/constants/colors";
import { GENDER_AVATAR, loadAvatarId, saveAvatarId, type AvatarGender } from "@/game/avatar";
import { prepareLobby } from "@/game/resources";
import { absoluteApiUrl, clearToken, loadToken, saveToken } from "@/lib/session";

const C = colors.dark;

type Stage =
  | "loading"
  | "preparing"
  | "auth"
  | "terms"
  | "name"
  | "character"
  | "customize"
  | "editing"
  | "lobby"
  | "error";

/** Read an HTTP status off a thrown API error, if present. */
function errStatus(e: unknown): number | undefined {
  return (e as { status?: number })?.status;
}

/**
 * Dev-only lobby preview: open the web build with `?preview=lobby` to render the
 * lobby with a mock profile (no login), so the UI can be reviewed on its own.
 * Compiled out of production and never active on native.
 */
const PREVIEW_PARAM =
  __DEV__ && Platform.OS === "web" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview")
    : null;

const PREVIEW_PROFILE: PlayerProfile | null =
  PREVIEW_PARAM === "lobby"
    ? {
        userId: 0,
        displayName: "Nova",
        gender: "female",
        hasPhoto: false,
        photoUrl: null,
      }
    : null;

/** Dev-only: jump straight to an onboarding step via `?preview=terms|name|character|customize`. */
const PREVIEW_STAGE: Stage | null =
  PREVIEW_PARAM === "terms" ||
  PREVIEW_PARAM === "name" ||
  PREVIEW_PARAM === "character" ||
  PREVIEW_PARAM === "customize"
    ? (PREVIEW_PARAM as Stage)
    : null;

export default function Gate() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(
    PREVIEW_PROFILE ? "lobby" : PREVIEW_STAGE ?? "loading",
  );
  const [profile, setProfile] = useState<PlayerProfile | null>(
    PREVIEW_PROFILE,
  );
  // 0..1 progress of the lobby "preparing" phase (scene + avatar download).
  const [prepProgress, setPrepProgress] = useState(0);

  // Onboarding accumulator: Terms → Name → Character → Customize.
  const [onbName, setOnbName] = useState("");
  const [onbGender, setOnbGender] = useState<AvatarGender>("male");
  const [onbAvatarId, setOnbAvatarId] = useState<string>(GENDER_AVATAR.male);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Start the multi-step onboarding for a freshly-authed user without a profile.
  const startOnboarding = useCallback(() => {
    setOnbName("");
    setOnbGender("male");
    setOnbAvatarId(GENDER_AVATAR.male);
    setSaveError(null);
    setSaveBusy(false);
    setStage("terms");
  }, []);

  // Show the Avakin-style loading screen while the lobby's 3D room + the
  // player's avatar download, with a real progress bar, then reveal the lobby.
  // Fully tolerant: any download failure still lands in the lobby (which falls
  // back to its bundled assets).
  const enterLobby = useCallback(async (p: PlayerProfile) => {
    setProfile(p);
    setPrepProgress(0);
    setStage("preparing");
    const stored = await loadAvatarId().catch(() => null);
    const avatarId =
      stored || GENDER_AVATAR[p.gender === "female" ? "female" : "male"];
    const started = Date.now();
    try {
      await prepareLobby(avatarId, ({ done, total }) => {
        setPrepProgress(total > 0 ? done / total : 1);
      });
    } catch {
      // tolerated — lobby uses bundled defaults
    }
    // Keep the loading screen on screen briefly so it never just flashes.
    const elapsed = Date.now() - started;
    if (elapsed < 700) {
      await new Promise((r) => setTimeout(r, 700 - elapsed));
    }
    setPrepProgress(1);
    setStage("lobby");
  }, []);

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
      await enterLobby(p);
    } catch (e) {
      const status = errStatus(e);
      if (status === 404) {
        startOnboarding(); // logged in but no profile yet
      } else if (status === 401) {
        await clearToken();
        setStage("auth");
      } else {
        setStage("error");
      }
    }
  }, [enterLobby, startOnboarding]);

  useEffect(() => {
    if (PREVIEW_PROFILE || PREVIEW_STAGE) return; // skip auth in preview mode
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
      startOnboarding();
      return;
    }
    try {
      const p = await getPlayerProfile();
      await enterLobby(p);
    } catch (e) {
      // Existing account without a profile still needs setup; only 404 means that.
      if (errStatus(e) === 404) {
        startOnboarding();
      } else {
        setStage("error");
      }
    }
  }, [enterLobby, startOnboarding]);

  const handleProfileDone = useCallback(
    (p: PlayerProfile) => {
      void enterLobby(p);
    },
    [enterLobby],
  );

  // Final onboarding step: persist the collected name + gender + avatar, then
  // stream the lobby. Errors surface on the Customize screen so the user can
  // retry without losing their choices.
  const finishOnboarding = useCallback(async () => {
    setSaveBusy(true);
    setSaveError(null);
    try {
      const p = await upsertPlayerProfile({
        displayName: onbName.trim(),
        gender: onbGender,
      });
      await saveAvatarId(onbAvatarId);
      setSaveBusy(false);
      await enterLobby(p);
    } catch (e) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ||
        (e as Error).message ||
        "Could not create your citizen";
      setSaveError(msg);
      setSaveBusy(false);
    }
  }, [onbName, onbGender, onbAvatarId, enterLobby]);

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

  if (stage === "loading" || stage === "preparing") {
    const photoUrl = profile?.photoUrl
      ? absoluteApiUrl(profile.photoUrl)
      : null;
    return (
      <LoadingScreen
        progress={stage === "preparing" ? prepProgress : null}
        photoUrl={photoUrl}
      />
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

  if (stage === "terms") {
    return (
      <Terms
        onAccept={() => setStage("name")}
        onDecline={() => void handleLogout()}
      />
    );
  }

  if (stage === "name") {
    return (
      <NameSetup
        initialName={onbName}
        onNext={(name) => {
          setOnbName(name);
          setStage("character");
        }}
        onBack={() => setStage("terms")}
      />
    );
  }

  if (stage === "character") {
    return (
      <CharacterSelect
        initialGender={onbGender}
        onNext={(gender, avatarId) => {
          setOnbGender(gender);
          setOnbAvatarId(avatarId);
          setStage("customize");
        }}
        onBack={() => setStage("name")}
      />
    );
  }

  if (stage === "customize") {
    return (
      <Customize
        gender={onbGender}
        avatarId={onbAvatarId}
        playerName={onbName}
        busy={saveBusy}
        error={saveError}
        onFinish={() => void finishOnboarding()}
        onBack={() => {
          setSaveError(null);
          setStage("character");
        }}
      />
    );
  }

  if (stage === "editing") {
    return (
      <ProfileSetup
        initial={profile}
        onDone={handleProfileDone}
        onCancel={() => setStage("lobby")}
      />
    );
  }

  return (
    <LobbyScreen
      profile={profile!}
      onPlay={() => router.push("/city")}
      onApartment={() =>
        router.push({ pathname: "/city", params: { home: "1" } })
      }
      onEditProfile={() => setStage("editing")}
      onLogout={handleLogout}
      onJoinFriend={(target) =>
        router.push({
          pathname: "/city",
          params: { sx: String(target.x), sz: String(target.z) },
        })
      }
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
