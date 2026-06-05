import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api, Property } from "@/src/api";
import { colors, font, radius, spacing, shadow, STATUS_META, FALLBACK_IMAGES } from "@/src/theme";
import StatusBadge from "@/src/components/StatusBadge";
import StarRating from "@/src/components/StarRating";
import { formatPrice, formatDate } from "@/src/utils/format";

const { width } = Dimensions.get("window");
const COL_W = (width - spacing.md * 2 - spacing.sm) / 2;

type Segment = "buy" | "rent";

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>("buy");
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.list(segment);
      setItems(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Prioritise shortlisted, then liked — the favourites worth comparing
  const favourites = useMemo(() => {
    const shortlisted = items.filter((i) => i.status === "shortlisted");
    const liked = items.filter((i) => i.status === "liked");
    return [...shortlisted, ...liked];
  }, [items]);

  const rows: { label: string; render: (p: Property) => React.ReactNode }[] = [
    { label: "Status", render: (p) => <StatusBadge status={p.status} small /> },
    {
      label: "Price",
      render: (p) => <Text style={styles.cellStrong}>{formatPrice(p.price, p.price_period)}</Text>,
    },
    { label: "Address", render: (p) => <Text style={styles.cell}>{p.address || "—"}</Text> },
    { label: "Rooms", render: (p) => <Text style={styles.cell}>{p.rooms || "—"}</Text> },
    { label: "Size", render: (p) => <Text style={styles.cell}>{p.size || "—"}</Text> },
    {
      label: "Rating",
      render: (p) =>
        p.rating > 0 ? <StarRating value={p.rating} size={13} /> : <Text style={styles.cell}>—</Text>,
    },
    { label: "Broker", render: (p) => <Text style={styles.cell}>{p.broker_name || "—"}</Text> },
    {
      label: "Viewing",
      render: (p) => <Text style={styles.cell}>{p.viewing_date ? formatDate(p.viewing_date) : "—"}</Text>,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.eyebrow}>DECIDE</Text>
        <Text style={styles.title}>Compare</Text>
        <View style={styles.segment}>
          {(["buy", "rent"] as Segment[]).map((s) => (
            <TouchableOpacity
              key={s}
              testID={`compare-segment-${s}`}
              style={[styles.segmentItem, segment === s && styles.segmentItemActive]}
              activeOpacity={0.9}
              onPress={() => {
                if (s !== segment) {
                  setSegment(s);
                  setLoading(true);
                }
              }}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
                {s === "buy" ? "Buy" : "Rent"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textTertiary} />
        </View>
      ) : favourites.length < 2 ? (
        <View style={styles.empty} testID="compare-empty">
          <View style={styles.emptyIcon}>
            <Ionicons name="swap-horizontal" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Shortlist to compare</Text>
          <Text style={styles.emptySub}>
            Mark at least 2 {segment === "buy" ? "homes" : "rentals"} as{" "}
            <Text style={{ color: STATUS_META.shortlisted.text, fontWeight: "600" }}>Shortlisted</Text> or{" "}
            <Text style={{ color: STATUS_META.liked.text, fontWeight: "600" }}>Liked</Text> to see them side by side.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <Text style={styles.hint}>
            {favourites.length} favourites · swipe to see more
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
            snapToInterval={COL_W + spacing.sm}
            decelerationRate="fast"
          >
            {favourites.map((p) => (
              <TouchableOpacity
                key={p.id}
                testID={`compare-col-${p.id}`}
                style={styles.col}
                activeOpacity={0.9}
                onPress={() => router.push(`/property/${p.id}`)}
              >
                <Image
                  source={{ uri: p.photos[0] || FALLBACK_IMAGES[p.type] }}
                  style={styles.colImg}
                  contentFit="cover"
                />
                <Text style={styles.colTitle} numberOfLines={1}>
                  {p.title || p.address || "Untitled"}
                </Text>
                {rows.map((r, idx) => (
                  <View
                    key={r.label}
                    style={[styles.rowCell, idx % 2 === 0 && styles.rowCellAlt]}
                  >
                    <Text style={styles.rowLabel}>{r.label}</Text>
                    <View style={styles.rowValue}>{r.render(p)}</View>
                  </View>
                ))}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBg },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  eyebrow: { ...font.caption, color: colors.textTertiary, letterSpacing: 1.2, marginBottom: 2 },
  title: { ...font.largeTitle, color: colors.textPrimary },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E3E3E8",
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.md,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radius.md - 3,
  },
  segmentItemActive: { backgroundColor: colors.surface, ...shadow.card },
  segmentText: { ...font.subhead, color: colors.textTertiary, fontWeight: "600" },
  segmentTextActive: { color: colors.textPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hint: {
    ...font.footnote,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  hScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  col: {
    width: COL_W,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.card,
  },
  colImg: { width: "100%", height: 110, backgroundColor: colors.appBg },
  colTitle: {
    ...font.subhead,
    fontWeight: "700",
    color: colors.textPrimary,
    padding: spacing.sm + 2,
  },
  rowCell: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  rowCellAlt: { backgroundColor: "#FAFAFB" },
  rowLabel: { ...font.caption, color: colors.textTertiary, marginBottom: 4 },
  rowValue: { minHeight: 20, justifyContent: "center" },
  cell: { ...font.footnote, color: colors.textSecondary },
  cellStrong: { ...font.subhead, fontWeight: "700", color: colors.textPrimary },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  emptyTitle: { ...font.title3, color: colors.textPrimary, marginBottom: 6 },
  emptySub: { ...font.subhead, color: colors.textTertiary, textAlign: "center", lineHeight: 22 },
});
