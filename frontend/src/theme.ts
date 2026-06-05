// Apple HIG inspired light theme tokens (see design_guidelines.json)

export const colors = {
  appBg: "#F2F2F7",
  surface: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.8)",

  textPrimary: "#000000",
  textSecondary: "#3C3C43",
  textTertiary: "#8E8E93",
  textPlaceholder: "rgba(60, 60, 67, 0.3)",

  brand: "#000000",
  blue: "#007AFF",
  pink: "#FF2D55",
  red: "#FF3B30",
  green: "#34C759",
  orange: "#FF9500",
  yellow: "#FFCC00",

  border: "rgba(60, 60, 67, 0.12)",
  separator: "rgba(60, 60, 67, 0.18)",

  tabInactive: "#999999",
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
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
  largeTitle: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.8 },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.6 },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.4 },
  title3: { fontSize: 20, fontWeight: "600" as const, letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: "600" as const, letterSpacing: -0.2 },
  body: { fontSize: 17, fontWeight: "400" as const, letterSpacing: -0.2 },
  callout: { fontSize: 16, fontWeight: "400" as const, letterSpacing: -0.2 },
  subhead: { fontSize: 15, fontWeight: "400" as const, letterSpacing: -0.1 },
  footnote: { fontSize: 13, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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

export const STATUS_META: Record<
  StatusKey,
  { label: string; bg: string; text: string; dot: string }
> = {
  to_view: { label: "To View", bg: "#F2F2F7", text: "#8E8E93", dot: "#8E8E93" },
  viewed: { label: "Viewed", bg: "#E5F0FF", text: "#007AFF", dot: "#007AFF" },
  liked: { label: "Liked", bg: "#FFE5EB", text: "#FF2D55", dot: "#FF2D55" },
  shortlisted: {
    label: "Shortlisted",
    bg: "#E8F8EE",
    text: "#34C759",
    dot: "#34C759",
  },
  rejected: { label: "Rejected", bg: "#E5E5EA", text: "#8E8E93", dot: "#C7C7CC" },
};

// Default fallback images when a property has no photos yet
export const FALLBACK_IMAGES = {
  buy: "https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBsdXh1cnklMjBob3VzZSUyMGV4dGVyaW9yfGVufDB8fHx8MTc4MDY2MjI4Mnww&ixlib=rb-4.1.0&q=85",
  rent: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBtaW5pbWFsJTIwYXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHx8fHwxNzgwNjYyMjgyfDA&ixlib=rb-4.1.0&q=85",
};
