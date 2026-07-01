/**
 * Semantic design tokens for the mobile app.
 *
 * These mirror the sibling web artifact (xbrainpro-web/src/index.css) dark
 * theme, converted from HSL to hex, so both artifacts share one visual
 * identity. The app is always dark, so light === dark palette.
 */

const palette = {
  // Legacy aliases
  text: "#fafafa",
  tint: "#884dff",

  background: "#06060e",
  foreground: "#fafafa",

  card: "#0c0c17",
  cardForeground: "#fafafa",
  cardBorder: "#181825",

  primary: "#884dff",
  primaryForeground: "#fafafa",
  primaryBorder: "#661aff",

  secondary: "#1f1f2e",
  secondaryForeground: "#fafafa",

  muted: "#181825",
  mutedForeground: "#9d9daf",

  accent: "#884dff",
  accentForeground: "#fafafa",

  destructive: "#ef4343",
  destructiveForeground: "#fafafa",

  border: "#1f1f2e",
  input: "#1f1f2e",
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
