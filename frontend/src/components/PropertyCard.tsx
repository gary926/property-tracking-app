import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Property } from "../api";
import { colors, font, radius, spacing, shadow, FALLBACK_IMAGES } from "../theme";
import { formatPrice, formatDate } from "../utils/format";
import StatusBadge from "./StatusBadge";
import StarRating from "./StarRating";

export default function PropertyCard({
  property,
  onPress,
}: {
  property: Property;
  onPress: () => void;
}) {
  const thumb = property.photos[0] || FALLBACK_IMAGES[property.type];
  const meta: string[] = [];
  if (property.rooms) meta.push(property.rooms);
  if (property.size) meta.push(property.size);

  return (
    <TouchableOpacity
      testID={`property-card-${property.id}`}
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" transition={150} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.price} numberOfLines={1}>
            {formatPrice(property.price, property.price_period)}
          </Text>
          {property.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.orange} />
              <Text style={styles.ratingText}>{property.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {property.title || property.address || "Untitled property"}
        </Text>
        {!!property.address && property.title ? (
          <Text style={styles.address} numberOfLines={1}>
            {property.address}
          </Text>
        ) : null}
        {meta.length > 0 && (
          <Text style={styles.meta} numberOfLines={1}>
            {meta.join("  ·  ")}
          </Text>
        )}
        <View style={styles.bottomRow}>
          <StatusBadge status={property.status} small />
          {!!property.viewing_date && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.dateText}>{formatDate(property.viewing_date)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm + 4,
    ...shadow.card,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.appBg,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: { ...font.headline, color: colors.textPrimary, flex: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginLeft: 6 },
  ratingText: {
    ...font.caption,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  title: { ...font.subhead, color: colors.textPrimary, marginTop: 2, fontWeight: "500" },
  address: { ...font.footnote, color: colors.textTertiary, marginTop: 1 },
  meta: { ...font.footnote, color: colors.textSecondary, marginTop: 3 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  dateRow: { flexDirection: "row", alignItems: "center" },
  dateText: { ...font.caption, color: colors.textTertiary, marginLeft: 4 },
});
