import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { api, Property } from "@/src/api";
import {
  colors,
  font,
  radius,
  spacing,
  shadow,
  STATUS_ORDER,
  STATUS_META,
  StatusKey,
  FALLBACK_IMAGES,
} from "@/src/theme";
import StarRating from "@/src/components/StarRating";
import { formatPrice, formatDateTime } from "@/src/utils/format";

const { width } = Dimensions.get("window");

export default function PropertyDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.get(id);
      setProperty(data);
    } catch (e) {
      console.warn("detail load failed", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeStatus = async (status: StatusKey) => {
    if (!property || property.status === status) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setProperty({ ...property, status });
    try {
      await api.update(property.id, { status });
    } catch (e) {
      console.warn("status update failed", e);
      load();
    }
  };

  const changeRating = async (rating: number) => {
    if (!property) return;
    setProperty({ ...property, rating });
    try {
      await api.update(property.id, { rating });
    } catch (e) {
      console.warn(e);
    }
  };

  const confirmDelete = () => {
    if (!property) return;
    Alert.alert("Delete property", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.remove(property.id);
          router.back();
        },
      },
    ]);
  };

  if (loading || !property) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  const photos = property.photos.length
    ? property.photos
    : [FALLBACK_IMAGES[property.type]];

  const hasBroker =
    property.broker_name || property.broker_phone || property.broker_email;

  return (
    <View style={styles.container}>
      {/* Hero gallery */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setActivePhoto(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {photos.map((p, i) => (
              <Image
                key={i}
                source={{ uri: p }}
                style={styles.heroImg}
                contentFit="cover"
                transition={150}
              />
            ))}
          </ScrollView>
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activePhoto && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Floating top buttons */}
        <View style={[styles.topBar, { top: insets.top + 6 }]}>
          <TouchableOpacity
            testID="back-button"
            style={styles.circleBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity
              testID="edit-button"
              style={styles.circleBtn}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: "/property/edit", params: { id: property.id } })
              }
            >
              <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="delete-button"
              style={styles.circleBtn}
              activeOpacity={0.8}
              onPress={confirmDelete}
            >
              <Ionicons name="trash-outline" size={19} color={colors.red} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Price + title */}
          <Text style={styles.price}>
            {formatPrice(property.price, property.price_period)}
          </Text>
          <Text style={styles.titleText}>
            {property.title || property.address || "Untitled property"}
          </Text>
          {!!property.address && property.title ? (
            <View style={styles.addrRow}>
              <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
              <Text style={styles.address}>{property.address}</Text>
            </View>
          ) : null}

          {/* quick facts */}
          {(property.rooms || property.size) && (
            <View style={styles.facts}>
              {!!property.rooms && (
                <Fact icon="bed-outline" label="Rooms" value={property.rooms} />
              )}
              {!!property.size && (
                <Fact icon="resize-outline" label="Size" value={property.size} />
              )}
            </View>
          )}

          {/* Status pipeline */}
          <Text style={styles.sectionLabel}>STATUS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pipeline}
          >
            {STATUS_ORDER.map((s) => {
              const active = property.status === s;
              const meta = STATUS_META[s];
              return (
                <TouchableOpacity
                  key={s}
                  testID={`set-status-${s}`}
                  activeOpacity={0.8}
                  onPress={() => changeStatus(s)}
                  style={[
                    styles.pipeChip,
                    { backgroundColor: active ? meta.text : colors.surface },
                    !active && styles.pipeChipInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.pipeDot,
                      { backgroundColor: active ? "#fff" : meta.dot },
                    ]}
                  />
                  <Text
                    style={[
                      styles.pipeText,
                      { color: active ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rating */}
          <View style={styles.card}>
            <View style={styles.cardRowBetween}>
              <Text style={styles.cardTitle}>Your rating</Text>
              <StarRating value={property.rating} editable onChange={changeRating} size={24} />
            </View>
          </View>

          {/* Listing link */}
          {!!property.listing_url && (
            <TouchableOpacity
              testID="open-listing-button"
              style={styles.linkCard}
              activeOpacity={0.7}
              onPress={() => WebBrowser.openBrowserAsync(normalizeUrl(property.listing_url))}
            >
              <View style={[styles.iconCircle, { backgroundColor: "#E5F0FF" }]}>
                <Ionicons name="link-outline" size={20} color={colors.blue} />
              </View>
              <View style={styles.linkBody}>
                <Text style={styles.linkTitle}>Online listing</Text>
                <Text style={styles.linkSub} numberOfLines={1}>
                  {property.listing_url}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          {/* Viewing date */}
          {!!property.viewing_date && (
            <View style={styles.linkCard}>
              <View style={[styles.iconCircle, { backgroundColor: "#FFF4E5" }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.orange} />
              </View>
              <View style={styles.linkBody}>
                <Text style={styles.linkTitle}>Viewing</Text>
                <Text style={styles.linkSub}>{formatDateTime(property.viewing_date)}</Text>
              </View>
            </View>
          )}

          {/* Broker */}
          {hasBroker ? (
            <>
              <Text style={styles.sectionLabel}>BROKER</Text>
              <View style={styles.card}>
                {!!property.broker_name && (
                  <View style={styles.brokerHeader}>
                    <View style={styles.brokerAvatar}>
                      <Text style={styles.brokerInitials}>
                        {initials(property.broker_name)}
                      </Text>
                    </View>
                    <Text style={styles.brokerName}>{property.broker_name}</Text>
                  </View>
                )}
                <View style={styles.brokerActions}>
                  {!!property.broker_phone && (
                    <BrokerAction
                      testID="call-broker"
                      icon="call-outline"
                      label="Call"
                      onPress={() => Linking.openURL(`tel:${property.broker_phone}`)}
                    />
                  )}
                  {!!property.broker_phone && (
                    <BrokerAction
                      testID="sms-broker"
                      icon="chatbubble-outline"
                      label="Text"
                      onPress={() => Linking.openURL(`sms:${property.broker_phone}`)}
                    />
                  )}
                  {!!property.broker_email && (
                    <BrokerAction
                      testID="email-broker"
                      icon="mail-outline"
                      label="Email"
                      onPress={() => Linking.openURL(`mailto:${property.broker_email}`)}
                    />
                  )}
                </View>
              </View>
            </>
          ) : null}

          {/* Notes */}
          {!!property.notes && (
            <>
              <Text style={styles.sectionLabel}>NOTES</Text>
              <View style={styles.card}>
                <Text style={styles.notes}>{property.notes}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

function BrokerAction({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity testID={testID} style={styles.brokerBtn} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.blue} />
      <Text style={styles.brokerBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalizeUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBg },
  center: { alignItems: "center", justifyContent: "center" },
  hero: { height: 320, backgroundColor: colors.appBg },
  heroImg: { width, height: 320 },
  dots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },
  topBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topRight: { flexDirection: "row", gap: 10 },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  content: {
    backgroundColor: colors.appBg,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  price: { ...font.title1, color: colors.textPrimary },
  titleText: { ...font.title3, color: colors.textPrimary, marginTop: 4 },
  addrRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  address: { ...font.subhead, color: colors.textTertiary, flex: 1 },
  facts: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  fact: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadow.card,
  },
  factValue: { ...font.headline, color: colors.textPrimary, marginTop: 6 },
  factLabel: { ...font.caption, color: colors.textTertiary, marginTop: 2 },
  sectionLabel: {
    ...font.caption,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  pipeline: { gap: 8, paddingVertical: 2, paddingRight: spacing.md },
  pipeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 7,
  },
  pipeChipInactive: { borderWidth: 0.5, borderColor: colors.border, ...shadow.card },
  pipeDot: { width: 7, height: 7, borderRadius: 4 },
  pipeText: { ...font.subhead, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.card,
  },
  cardRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { ...font.headline, color: colors.textPrimary },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.sm + 4,
    ...shadow.card,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  linkBody: { flex: 1, marginLeft: spacing.sm + 4 },
  linkTitle: { ...font.subhead, color: colors.textPrimary, fontWeight: "600" },
  linkSub: { ...font.footnote, color: colors.textTertiary, marginTop: 1 },
  brokerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brokerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm + 4,
  },
  brokerInitials: { ...font.subhead, color: "#fff", fontWeight: "700" },
  brokerName: { ...font.headline, color: colors.textPrimary },
  brokerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  brokerBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    backgroundColor: "#F2F7FF",
    borderRadius: radius.md,
  },
  brokerBtnText: { ...font.caption, color: colors.blue, fontWeight: "600" },
  notes: { ...font.body, color: colors.textSecondary, lineHeight: 23 },
});
