import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { STATUS_META, StatusKey, radius } from "../theme";

export default function StatusBadge({
  status,
  small,
}: {
  status: StatusKey;
  small?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <View
      testID={`status-badge-${status}`}
      style={[
        styles.badge,
        { backgroundColor: meta.bg },
        small && styles.badgeSmall,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: meta.dot }]} />
      <Text style={[styles.text, { color: meta.text }, small && styles.textSmall]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  textSmall: {
    fontSize: 11,
  },
});
