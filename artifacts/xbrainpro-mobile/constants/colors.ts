/**
 * Neura City design tokens — dusk / neon-lit low-poly city palette.
 * Matches the approved canvas mockups (glassy HUD, pink→purple accents).
 */

const palette = {
  text: "#fafafa",
  tint: "#ff5c8a",

  background: "#10142a",
  foreground: "#fafafa",

  card: "#181d38",
  cardForeground: "#fafafa",
  cardBorder: "#262c4d",

  primary: "#ff5c8a",
  primaryForeground: "#fafafa",
  primaryBorder: "#e84876",

  secondary: "#232946",
  secondaryForeground: "#fafafa",

  muted: "#1c2140",
  mutedForeground: "#9aa0c3",

  accent: "#8b5cf6",
  accentForeground: "#fafafa",

  destructive: "#ef4343",
  destructiveForeground: "#fafafa",

  border: "#262c4d",
  input: "#232946",
};

const colors = {
  light: palette,
  dark: palette,
  radius: 16,
};

export default colors;

/** Font families loaded in app/_layout.tsx (Outfit for headings, Plus Jakarta Sans for body). */
export const fonts = {
  heading: "Outfit_700Bold",
  headingSemi: "Outfit_600SemiBold",
  body: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};
