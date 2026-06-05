import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export default function StarRating({
  value,
  size = 18,
  editable = false,
  onChange,
}: {
  value: number;
  size?: number;
  editable?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= value;
        const star = (
          <Ionicons
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? colors.orange : colors.textTertiary}
          />
        );
        if (!editable) {
          return (
            <View key={i} style={styles.star}>
              {star}
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={i}
            testID={`star-${i}`}
            style={styles.star}
            activeOpacity={0.6}
            onPress={() => onChange?.(i === value ? 0 : i)}
          >
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  star: { marginRight: 3 },
});
