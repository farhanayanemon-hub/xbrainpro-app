import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  upsertPlayerProfile,
  uploadPlayerPhoto,
  type PlayerProfile,
} from "@workspace/api-client-react";

import colors, { fonts } from "@/constants/colors";
import { absoluteApiUrl } from "@/lib/session";
import { GENDER_AVATAR, saveAvatarId, type AvatarGender } from "@/game/avatar";

const C = colors.dark;

type Gender = AvatarGender;

export default function ProfileSetup({
  initial,
  onDone,
  onCancel,
}: {
  initial: PlayerProfile | null;
  onDone: (profile: PlayerProfile) => void;
  onCancel?: () => void;
}) {
  const isNew = !initial;
  const [gender, setGender] = useState<Gender>(
    (initial?.gender as Gender) || "male",
  );
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [photo, setPhoto] = useState<{
    base64: string;
    mime: string;
    uri: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingPhotoUrl = initial?.photoUrl
    ? absoluteApiUrl(initial.photoUrl)
    : null;

  const pickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (res.canceled || !res.assets?.[0]?.base64) return;
      const asset = res.assets[0];
      setPhoto({
        base64: asset.base64!,
        mime: asset.mimeType ?? "image/jpeg",
        uri: asset.uri,
      });
    } catch {
      setError("Could not open the photo library");
    }
  };

  const save = async () => {
    const name = displayName.trim();
    if (name.length < 2) {
      setError("Player name must be at least 2 characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let profile = await upsertPlayerProfile({
        displayName: name,
        gender,
        bio: bio.trim() || null,
      });
      if (photo) {
        profile = await uploadPlayerPhoto({
          imageBase64: photo.base64,
          contentType: photo.mime,
        });
      }
      if (isNew) {
        // First-time setup: give a sensible default 3D avatar per gender.
        await saveAvatarId(GENDER_AVATAR[gender]);
      }
      onDone(profile);
    } catch (e) {
      const msg =
        (e as { data?: { error?: string } })?.data?.error ||
        (e as Error).message ||
        "Could not save profile";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const photoPreview = photo?.uri ?? existingPhotoUrl;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          {isNew ? "CREATE YOUR CITIZEN" : "EDIT PROFILE"}
        </Text>
        <Text style={styles.subtitle}>
          {isNew
            ? "Tell Neura City who you are"
            : "Update your citizen details"}
        </Text>

        <View style={styles.row}>
          <Pressable style={styles.photoWrap} onPress={pickPhoto}>
            {photoPreview ? (
              <Image source={{ uri: photoPreview }} style={styles.photo} />
            ) : (
              <View style={styles.photoEmpty}>
                <Text style={styles.photoPlus}>+</Text>
                <Text style={styles.photoHint}>Photo</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.fields}>
            <View style={styles.genderRow}>
              {(["male", "female"] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.genderBtn,
                    gender === g && styles.genderBtnActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text style={styles.genderIcon}>
                    {g === "male" ? "♂" : "♀"}
                  </Text>
                  <Text
                    style={[
                      styles.genderText,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g === "male" ? "Male" : "Female"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Player name"
              placeholderTextColor={C.mutedForeground}
              maxLength={24}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
        </View>

        <TextInput
          style={[styles.input, styles.bio]}
          placeholder="Short bio (optional)"
          placeholderTextColor={C.mutedForeground}
          multiline
          maxLength={300}
          value={bio}
          onChangeText={setBio}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.submit, busy && { opacity: 0.6 }]}
          onPress={save}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isNew ? "ENTER THE CITY" : "SAVE CHANGES"}
            </Text>
          )}
        </Pressable>

        {onCancel && (
          <Pressable style={styles.cancel} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
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
    maxWidth: 520,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 3,
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: C.mutedForeground,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  row: { flexDirection: "row", gap: 14, marginBottom: 10 },
  photoWrap: { width: 96, height: 96 },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  photoEmpty: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.border,
    backgroundColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlus: { color: C.primary, fontSize: 26, lineHeight: 28 },
  photoHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
  },
  fields: { flex: 1, gap: 10 },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.muted,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 10,
  },
  genderBtnActive: { backgroundColor: C.primary, borderColor: C.primaryBorder },
  genderIcon: { color: "#fff", fontSize: 15 },
  genderText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: C.mutedForeground,
  },
  genderTextActive: { color: "#fff" },
  input: {
    backgroundColor: C.input,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontFamily: fonts.body,
    fontSize: 14,
  },
  bio: { minHeight: 70, textAlignVertical: "top", marginTop: 4 },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#f87171",
    marginTop: 10,
    textAlign: "center",
  },
  submit: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  submitText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    color: "#fff",
  },
  cancel: { alignItems: "center", paddingVertical: 12 },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
  },
});
