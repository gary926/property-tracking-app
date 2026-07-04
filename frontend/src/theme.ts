// Blue-only, modern & classy design system (Apple HIG inspired)
// See /app/design_guidelines.json — strictly a blue monochromatic palette.

export const colors = {
  appBg: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceHighlight: "#F8FAFC",
  glass: "rgba(255, 255, 255, 0.85)",

  textPrimary: "#0A1423",
  textSecondary: "#5B6C82",
  textTertiary: "#8A9CB0",
  textPlaceholder: "rgba(138, 156, 176, 0.7)",

  // Blue accent scale
  brand: "#0F52BA", // primary royal blue
  brandHover: "#0B3D8A",
  brandDeep: "#041B3B", // deep premium navy
  accentSubtle: "#E8F0FE", // pale blue tint fill
  azure: "#2F6FE0", // brighter blue for highlights/stars
  priceColor: "#0F52BA",

  // Aliases kept for existing references — all repointed to blue hues
  blue: "#0F52BA",
  orange: "#2F6FE0",
  red: "#0F52BA",
  green: "#0F52BA",
  pink: "#0F52BA",
  yellow: "#2F6FE0",

  border: "#E2E8F0",
  borderMedium: "#CBD5E1",
  separator: "#E2E8F0",

  tabInactive: "#8A9CB0",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const font = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -1.0 },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.7 },
  title2: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.5 },
  title3: { fontSize: 20, fontWeight: "600" as const, letterSpacing: -0.4 },
  headline: { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.3 },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.2 },
  callout: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2 },
  subhead: { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.1 },
  footnote: { fontSize: 13, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.3 },
};

export const shadow = {
  card: {
    shadowColor: "#0A1423",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  float: {
    shadowColor: "#0F52BA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  deep: {
    shadowColor: "#041B3B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};

export type StatusKey =
  | "to_view"
  | "viewed"
  | "liked"
  | "shortlisted"
  | "rejected";

export const STATUS_ORDER: StatusKey[] = [
  "to_view",
  "viewed",
  "liked",
  "shortlisted",
  "rejected",
];

// Blue-only status system, differentiated by fill style + darkness.
// `accent` = representative solid blue used for active pipeline chips.
export const STATUS_META: Record<
  StatusKey,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
    accent: string;
  }
> = {
  to_view: {
    label: "To View",
    bg: "#FFFFFF",
    text: "#0F52BA",
    dot: "#0F52BA",
    border: "#0F52BA",
    accent: "#0F52BA",
  },
  viewed: {
    label: "Viewed",
    bg: "#E8F0FE",
    text: "#0F52BA",
    dot: "#0F52BA",
    border: "transparent",
    accent: "#0F52BA",
  },
  liked: {
    label: "Liked",
    bg: "#0F52BA",
    text: "#FFFFFF",
    dot: "#FFFFFF",
    border: "transparent",
    accent: "#0F52BA",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "#041B3B",
    text: "#FFFFFF",
    dot: "#7FA8E8",
    border: "transparent",
    accent: "#041B3B",
  },
  rejected: {
    label: "Rejected",
    bg: "#F4F7FB",
    text: "#8A9CB0",
    dot: "#CBD5E1",
    border: "#E2E8F0",
    accent: "#8A9CB0",
  },
};

// Default fallback images when a property has no photos yet (sourced from env)
export const FALLBACK_IMAGES = {
  buy: process.env.EXPO_PUBLIC_FALLBACK_IMAGE_BUY || "",
  rent: process.env.EXPO_PUBLIC_FALLBACK_IMAGE_RENT || "",
};
