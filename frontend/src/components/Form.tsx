import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, font, radius, spacing } from "../theme";

export function FormGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Field({
  label,
  testID,
  last,
  ...inputProps
}: {
  label: string;
  testID?: string;
  last?: boolean;
} & TextInputProps) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        placeholderTextColor={colors.textPlaceholder}
        style={[styles.input, inputProps.multiline && styles.inputMultiline]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: spacing.lg },
  groupTitle: {
    ...font.caption,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
  field: { paddingVertical: spacing.sm + 4 },
  fieldBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  label: { ...font.caption, color: colors.textTertiary, marginBottom: 4 },
  input: { ...font.body, color: colors.textPrimary, padding: 0 },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
});
