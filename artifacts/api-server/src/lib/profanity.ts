/**
 * Server-side profanity masking for city chat. Covers a curated list of
 * common English and Bangla (both Bangla script and romanized) slurs and
 * swears. Matching is case-insensitive and tolerant of simple leetspeak
 * substitutions (a→@/4, i→1/!, o→0, e→3, s→$/5, u→v) and repeated letters
 * ("fuuuck"). Matched words are replaced with asterisks of the same length,
 * so the rest of the sentence survives intact.
 *
 * This is intentionally a wordlist filter, not an AI moderator: it must run
 * synchronously in the hot chat path with zero external calls.
 */

/** English wordlist (stems cover common suffixes via the regex builder). */
const ENGLISH_WORDS = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "bitches",
  "asshole",
  "arsehole",
  "bastard",
  "cunt",
  "dick",
  "dickhead",
  "cock",
  "pussy",
  "slut",
  "whore",
  "faggot",
  "fag",
  "nigger",
  "nigga",
  "retard",
  "retarded",
  "wanker",
  "twat",
  "prick",
  "douchebag",
  "jackass",
  "dumbass",
];

/** Romanized Bangla swears (common spellings + variants). */
const BANGLA_ROMAN_WORDS = [
  "magi",
  "magir",
  "khanki",
  "khankir",
  "khanky",
  "chuda",
  "chudi",
  "chudir",
  "chod",
  "choda",
  "chodna",
  "gud",
  "gudmara",
  "bal",
  "baal",
  "shala",
  "shalar",
  "sala",
  "salar",
  "haramjada",
  "haramzada",
  "haramkhor",
  "kuttar baccha",
  "kuttarbaccha",
  "madarchod",
  "banchod",
  "bokachoda",
  "boka choda",
  "voda",
  "bhoda",
  "dhon",
  "khanki magi",
];

/** Bangla-script swears. */
const BANGLA_SCRIPT_WORDS = [
  "মাগী",
  "মাগি",
  "খানকি",
  "খানকির",
  "চুদা",
  "চুদি",
  "চোদ",
  "চোদা",
  "চোদনা",
  "গুদ",
  "বাল",
  "শালা",
  "শালার",
  "হারামজাদা",
  "হারামখোর",
  "কুত্তার বাচ্চা",
  "মাদারচোদ",
  "বাঞ্চোদ",
  "বোকাচোদা",
  "ভোদা",
  "ধোন",
];

/** Per-letter leet/lookalike alternates for latin-script matching. */
const LEET: Record<string, string> = {
  a: "a@4",
  b: "b8",
  e: "e3",
  i: "i1!",
  o: "o0",
  s: "s$5",
  t: "t7+",
  u: "uv",
  g: "g9",
  l: "l1",
};

/** Build a regex fragment for one latin word with leet + letter-repeat tolerance. */
function latinWordPattern(word: string): string {
  let out = "";
  for (const ch of word) {
    if (ch === " ") {
      out += "[\\s._-]+";
      continue;
    }
    const alts = LEET[ch];
    const cls = alts ? `[${alts.replace(/[[\]\\^-]/g, "\\$&")}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out += `${cls}+`; // tolerate repeats: "fuuuck"
  }
  return out;
}

function buildLatinRegex(words: string[]): RegExp {
  const body = words
    .sort((a, b) => b.length - a.length)
    .map(latinWordPattern)
    .join("|");
  // \b doesn't work across scripts; bound by non-letter/digit lookarounds.
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, "giu");
}

function buildScriptRegex(words: string[]): RegExp {
  const body = words
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s._-]+"))
    .join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, "giu");
}

const LATIN_RE = buildLatinRegex([...ENGLISH_WORDS, ...BANGLA_ROMAN_WORDS]);
const BANGLA_RE = buildScriptRegex(BANGLA_SCRIPT_WORDS);

export interface FilterResult {
  /** The text with profane words replaced by asterisks. */
  text: string;
  /** True when at least one word was masked. */
  hadProfanity: boolean;
}

/** Mask profanity in a chat message. */
export function filterProfanity(input: string): FilterResult {
  let hadProfanity = false;
  const mask = (m: string) => {
    hadProfanity = true;
    return "*".repeat(m.length);
  };
  let text = input.replace(LATIN_RE, mask);
  text = text.replace(BANGLA_RE, mask);
  return { text, hadProfanity };
}
