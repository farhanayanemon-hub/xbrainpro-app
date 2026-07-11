import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors, { fonts } from "@/constants/colors";
import { AVATAR_MAP } from "@/game/avatar";
import {
  formatCountdown,
  type ContestEntry,
  type ContestState,
} from "@/lib/fashionContest";

const C = colors.dark;

/** Accent color + initial for an entry's look card. */
function lookVisual(avatarId: string, displayName: string): {
  color: string;
  label: string;
} {
  const look = AVATAR_MAP[avatarId];
  return {
    color: look?.color ?? C.primary,
    label: (displayName.charAt(0) || "?").toUpperCase(),
  };
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Bottom sheet for the Fashion Contest. Shows the live round + theme and a
 * countdown, lets the player enter their equipped look, and lists all entries
 * with vote counts + a vote button. Past winners are shown at the bottom.
 *
 * All rules are server-side: one entry per round, one vote per entry, no
 * self-voting. The UI just disables the obvious cases and surfaces server
 * errors via `notice`.
 */
export default function ContestPanel({
  state,
  loading,
  entering,
  votingId,
  notice,
  equippedName,
  onEnter,
  onVote,
  onClose,
}: {
  state: ContestState | null;
  loading: boolean;
  entering: boolean;
  votingId: number | null;
  notice?: string | null;
  equippedName: string;
  onEnter: () => void;
  onVote: (entryId: number) => void;
  onClose: () => void;
}) {
  const round = state?.round ?? null;
  const entries = state?.entries ?? [];
  const entered = state?.myEntryId != null;
  const lastResults = state?.lastResults ?? null;

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>👗 FASHION CONTEST</Text>
          {round ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {round.theme} · closes in {formatCountdown(round.closesAt)}
            </Text>
          ) : (
            <Text style={styles.subtitle}>Loading round…</Text>
          )}
        </View>
        <Pressable style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {notice ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {/* Enter / entered banner */}
      {entered ? (
        <View style={styles.enteredBanner}>
          <Text style={styles.enteredText}>✓ Your look is in this round</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.enterBtn, entering && styles.enterBtnBusy]}
          disabled={entering || !round}
          onPress={onEnter}
        >
          <Text style={styles.enterText}>
            {entering ? "ENTERING…" : `ENTER MY LOOK · ${equippedName}`}
          </Text>
        </Pressable>
      )}

      {loading && !state ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeading}>
            ENTRIES · {entries.length}
          </Text>
          {entries.length === 0 ? (
            <Text style={styles.empty}>
              No entries yet — be the first to enter!
            </Text>
          ) : (
            entries.map((e, i) => (
              <EntryRow
                key={e.id}
                entry={e}
                place={i}
                voting={votingId === e.id}
                onVote={() => onVote(e.id)}
              />
            ))
          )}

          {lastResults && lastResults.winners.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>
                LAST ROUND · {lastResults.theme}
              </Text>
              {lastResults.winners.map((w) => {
                const { color, label } = lookVisual(w.avatarId, w.displayName);
                const medal = MEDALS[w.rank - 1] ?? `#${w.rank}`;
                return (
                  <View key={w.entryId} style={styles.resultRow}>
                    <Text style={styles.resultMedal}>{medal}</Text>
                    <View style={[styles.avatarChip, { borderColor: color }]}>
                      <Text style={[styles.avatarChipText, { color }]}>
                        {label}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {w.displayName}
                      </Text>
                      <Text style={styles.resultMeta}>
                        {w.votes} vote{w.votes === 1 ? "" : "s"}
                      </Text>
                    </View>
                    {w.rewardCoins > 0 || w.rewardGems > 0 ? (
                      <Text style={styles.resultReward}>
                        {w.rewardCoins > 0 ? `🪙 ${w.rewardCoins}` : ""}
                        {w.rewardCoins > 0 && w.rewardGems > 0 ? "  " : ""}
                        {w.rewardGems > 0 ? `💎 ${w.rewardGems}` : ""}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function EntryRow({
  entry,
  place,
  voting,
  onVote,
}: {
  entry: ContestEntry;
  place: number;
  voting: boolean;
  onVote: () => void;
}) {
  const { color, label } = lookVisual(entry.avatarId, entry.displayName);
  const rankBadge = place < 3 ? MEDALS[place] : `#${place + 1}`;

  return (
    <View style={styles.entryRow}>
      <Text style={styles.entryRank}>{rankBadge}</Text>
      <View style={[styles.avatarChip, { borderColor: color }]}>
        <Text style={[styles.avatarChipText, { color }]}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.entryName} numberOfLines={1}>
          {entry.displayName}
          {entry.isMine ? "  (you)" : ""}
        </Text>
        <Text style={styles.entryMeta}>
          {entry.votes} vote{entry.votes === 1 ? "" : "s"}
        </Text>
      </View>
      {entry.isMine ? (
        <View style={[styles.voteBtn, styles.voteBtnDisabled]}>
          <Text style={styles.voteBtnTextMuted}>—</Text>
        </View>
      ) : entry.votedByMe ? (
        <View style={[styles.voteBtn, styles.voteBtnVoted]}>
          <Text style={styles.voteBtnTextVoted}>✓ VOTED</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.voteBtn, voting && styles.voteBtnBusy]}
          disabled={voting}
          onPress={onVote}
        >
          <Text style={styles.voteBtnText}>{voting ? "…" : "VOTE"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: "rgba(12,15,34,0.98)",
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 17,
    letterSpacing: 2,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: C.mutedForeground,
    marginTop: 2,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
  },
  closeText: { fontSize: 15, color: C.mutedForeground },

  notice: {
    marginBottom: 10,
    backgroundColor: "rgba(255,90,90,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noticeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#ffb4b4",
    textAlign: "center",
  },

  enterBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accent,
    marginBottom: 12,
  },
  enterBtnBusy: { opacity: 0.7 },
  enterText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.2,
    color: "#fff",
  },
  enteredBanner: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,224,138,0.14)",
    borderWidth: 1,
    borderColor: "rgba(56,224,138,0.4)",
    marginBottom: 12,
  },
  enteredText: { fontFamily: fonts.bold, fontSize: 13, color: "#7ff0b4" },

  loadingBox: { height: 120, alignItems: "center", justifyContent: "center" },
  list: { maxHeight: 360 },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: C.mutedForeground,
    marginBottom: 8,
  },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "center",
    paddingVertical: 18,
  },

  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  entryRank: {
    width: 24,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 13,
    color: C.mutedForeground,
  },
  avatarChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  avatarChipText: { fontFamily: fonts.heading, fontSize: 16 },
  entryName: { fontFamily: fonts.semibold, fontSize: 13.5, color: "#fff" },
  entryMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: C.mutedForeground,
    marginTop: 1,
  },

  voteBtn: {
    minWidth: 62,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  voteBtnBusy: { opacity: 0.7 },
  voteBtnDisabled: { backgroundColor: "rgba(255,255,255,0.06)" },
  voteBtnVoted: {
    backgroundColor: "rgba(56,224,138,0.16)",
    borderWidth: 1,
    borderColor: "rgba(56,224,138,0.4)",
  },
  voteBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: "#fff",
  },
  voteBtnTextMuted: { fontFamily: fonts.bold, fontSize: 12, color: C.mutedForeground },
  voteBtnTextVoted: { fontFamily: fonts.bold, fontSize: 11, color: "#7ff0b4" },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  resultMedal: { width: 24, textAlign: "center", fontSize: 16 },
  resultName: { fontFamily: fonts.semibold, fontSize: 13, color: "#fff" },
  resultMeta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: C.mutedForeground,
    marginTop: 1,
  },
  resultReward: { fontFamily: fonts.bold, fontSize: 11.5, color: "#f5d16a" },
});
