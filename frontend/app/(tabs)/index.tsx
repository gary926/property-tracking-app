import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { api, Property } from "@/src/api";
import { colors, font, radius, spacing, shadow, STATUS_ORDER, STATUS_META, StatusKey } from "@/src/theme";
import PropertyCard from "@/src/components/PropertyCard";

type Segment = "buy" | "rent";
type Filter = "all" | StatusKey;

export default function PropertiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>("buy");
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.list(segment);
      setItems(data);
    } catch (e) {
      console.warn("load failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [segment]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const switchSegment = (s: Segment) => {
    if (s === segment) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setSegment(s);
    setFilter("all");
    setLoading(true);
  };

  const goPaste = () => {
    const url = pasteUrl.trim();
    if (!url) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPaste(false);
    setPasteUrl("");
    router.push({ pathname: "/property/edit", params: { prefillUrl: url } });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    STATUS_ORDER.forEach((s) => (c[s] = 0));
    items.forEach((it) => (c[it.status] = (c[it.status] || 0) + 1));
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  const filters: Filter[] = ["all", ...STATUS_ORDER];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>HOUSE HUNT</Text>
            <Text style={styles.title}>Properties</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              testID="paste-link-button"
              style={styles.pasteBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setShowPaste((v) => !v);
              }}
            >
              <Ionicons
                name={showPaste ? "close" : "link"}
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              testID="add-property-button"
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/property/edit", params: { type: segment } });
              }}
            >
              <Ionicons name="add" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Paste-a-link shortcut */}
        {showPaste && (
          <View style={styles.pasteCard} testID="paste-card">
            <Text style={styles.pasteHint}>
              Paste a listing link — we'll detect Buy/Rent and fill the details.
            </Text>
            <View style={styles.pasteRow}>
              <TextInput
                testID="paste-link-input"
                style={styles.pasteInput}
                placeholder="https://www.propertyfinder.ae/..."
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="none"
                keyboardType="url"
                autoFocus
                value={pasteUrl}
                onChangeText={setPasteUrl}
                onSubmitEditing={goPaste}
                returnKeyType="go"
              />
              <TouchableOpacity
                testID="paste-go-button"
                style={styles.pasteGo}
                activeOpacity={0.85}
                onPress={goPaste}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.pasteGoText}>Detect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Segmented control */}
        <View style={styles.segment}>
          {(["buy", "rent"] as Segment[]).map((s) => (
            <TouchableOpacity
              key={s}
              testID={`segment-${s}`}
              style={[styles.segmentItem, segment === s && styles.segmentItemActive]}
              activeOpacity={0.9}
              onPress={() => switchSegment(s)}
            >
              <Ionicons
                name={s === "buy" ? "home" : "bed"}
                size={15}
                color={segment === s ? colors.textPrimary : colors.textTertiary}
              />
              <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
                {s === "buy" ? "Buy" : "Rent · July"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status filter chips */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {filters.map((f) => {
            const active = filter === f;
            const label = f === "all" ? "All" : STATUS_META[f].label;
            const count = counts[f] || 0;
            return (
              <TouchableOpacity
                key={f}
                testID={`filter-${f}`}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {label} {count > 0 ? count : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textTertiary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textTertiary} />
          }
          renderItem={({ item }) => (
            <PropertyCard property={item} onPress={() => router.push(`/property/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              segment={segment}
              filter={filter}
              onAdd={() =>
                router.push({ pathname: "/property/edit", params: { type: segment } })
              }
            />
          }
        />
      )}
    </View>
  );
}

function EmptyState({
  segment,
  filter,
  onAdd,
}: {
  segment: Segment;
  filter: Filter;
  onAdd: () => void;
}) {
  const filtered = filter !== "all";
  return (
    <View style={styles.empty} testID="empty-state">
      <View style={styles.emptyIcon}>
        <Ionicons
          name={segment === "buy" ? "home-outline" : "bed-outline"}
          size={34}
          color={colors.textTertiary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {filtered ? "Nothing here yet" : `No ${segment === "buy" ? "homes to buy" : "rentals"} yet`}
      </Text>
      <Text style={styles.emptySub}>
        {filtered
          ? "Try another filter or add a new property."
          : "Start tracking the places you're viewing. Add photos, brokers, and notes all in one spot."}
      </Text>
      {!filtered && (
        <TouchableOpacity testID="empty-add-button" style={styles.emptyBtn} activeOpacity={0.85} onPress={onAdd}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.emptyBtnText}>Add a property</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBg },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.appBg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...font.caption,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: { ...font.largeTitle, color: colors.textPrimary },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  pasteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.border,
    ...shadow.card,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.float,
  },
  pasteCard: {
    backgroundColor: "#EAF2FF",
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 0.5,
    borderColor: "rgba(0,122,255,0.2)",
  },
  pasteHint: { ...font.footnote, color: colors.textSecondary, marginBottom: spacing.sm },
  pasteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pasteInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...font.subhead,
    color: colors.textPrimary,
  },
  pasteGo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  pasteGoText: { ...font.subhead, fontWeight: "700", color: "#fff" },
  segment: {
    flexDirection: "row",
    backgroundColor: "#E3E3E8",
    borderRadius: radius.md,
    padding: 3,
    marginTop: spacing.md,
  },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radius.md - 3,
    gap: 6,
  },
  segmentItemActive: {
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  segmentText: { ...font.subhead, color: colors.textTertiary, fontWeight: "600" },
  segmentTextActive: { color: colors.textPrimary },
  chipsWrap: { marginTop: spacing.xs },
  chips: { paddingHorizontal: spacing.md, gap: 8, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { ...font.footnote, color: colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: spacing.md, paddingTop: 6, paddingBottom: 120 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
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
  emptySub: {
    ...font.subhead,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  emptyBtnText: { ...font.headline, color: "#fff" },
});
