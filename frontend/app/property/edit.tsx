import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import { api, Property, PropertyInput } from "@/src/api";
import { colors, font, radius, spacing, shadow, STATUS_ORDER, STATUS_META, StatusKey } from "@/src/theme";
import { FormGroup, Field } from "@/src/components/Form";
import StarRating from "@/src/components/StarRating";
import { formatDateTime } from "@/src/utils/format";

type Form = {
  type: "buy" | "rent";
  title: string;
  address: string;
  price: string;
  price_period: "total" | "month";
  rooms: string;
  size: string;
  broker_name: string;
  broker_phone: string;
  broker_email: string;
  listing_url: string;
  photos: string[];
  rating: number;
  notes: string;
  viewing_date: string | null;
  status: StatusKey;
};

const emptyForm = (type: "buy" | "rent"): Form => ({
  type,
  title: "",
  address: "",
  price: "",
  price_period: type === "rent" ? "month" : "total",
  rooms: "",
  size: "",
  broker_name: "",
  broker_phone: "",
  broker_email: "",
  listing_url: "",
  photos: [],
  rating: 0,
  notes: "",
  viewing_date: null,
  status: "to_view",
});

export default function EditProperty() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<Form>(emptyForm((type as "buy" | "rent") || "buy"));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const p = await api.get(id!);
        setForm({
          type: p.type,
          title: p.title,
          address: p.address,
          price: p.price !== null ? String(p.price) : "",
          price_period: p.price_period,
          rooms: p.rooms || "",
          size: p.size || "",
          broker_name: p.broker_name,
          broker_phone: p.broker_phone,
          broker_email: p.broker_email,
          listing_url: p.listing_url,
          photos: p.photos,
          rating: p.rating,
          notes: p.notes,
          viewing_date: p.viewing_date,
          status: p.status,
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ---- Photo picking with permission handling ----
  const addPhoto = () => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.getCameraPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      if (!perm.canAskAgain) return openSettings("camera");
      const req = await ImagePicker.requestCameraPermissionsAsync();
      status = req.status;
      if (status !== "granted") {
        if (!req.canAskAgain) return openSettings("camera");
        return;
      }
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
    });
    handleResult(res);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      if (!perm.canAskAgain) return openSettings("photo library");
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      if (status !== "granted") {
        if (!req.canAskAgain) return openSettings("photo library");
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });
    handleResult(res);
  };

  const handleResult = (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled) return;
    const newPhotos = res.assets
      .filter((a) => a.base64)
      .map((a) => `data:image/jpeg;base64,${a.base64}`);
    set("photos", [...form.photos, ...newPhotos]);
  };

  const openSettings = (what: string) => {
    Alert.alert(
      "Permission needed",
      `Please enable ${what} access in Settings to add photos.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };

  const removePhoto = (idx: number) =>
    set("photos", form.photos.filter((_, i) => i !== idx));

  // ---- Save ----
  const save = async () => {
    if (!form.title.trim() && !form.address.trim()) {
      Alert.alert("Add a name", "Give this property a title or address first.");
      return;
    }
    setSaving(true);
    const payload: PropertyInput = {
      type: form.type,
      title: form.title.trim(),
      address: form.address.trim(),
      price: form.price ? parseFloat(form.price.replace(/[^0-9.]/g, "")) : null,
      price_period: form.price_period,
      rooms: form.rooms.trim(),
      size: form.size.trim(),
      broker_name: form.broker_name.trim(),
      broker_phone: form.broker_phone.trim(),
      broker_email: form.broker_email.trim(),
      listing_url: form.listing_url.trim(),
      photos: form.photos,
      rating: form.rating,
      notes: form.notes.trim(),
      viewing_date: form.viewing_date,
      status: form.status,
    };
    try {
      if (isEdit) await api.update(id!, payload);
      else await api.create(payload);
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert("Couldn't save", "Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity testID="cancel-button" onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? "Edit" : "New Property"}</Text>
        <View style={{ width: 54 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={styles.typeToggle}>
          {(["buy", "rent"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              testID={`type-${t}`}
              style={[styles.typeItem, form.type === t && styles.typeItemActive]}
              activeOpacity={0.9}
              onPress={() => {
                set("type", t);
                if (t === "rent" && form.price_period === "total") set("price_period", "month");
                if (t === "buy" && form.price_period === "month") set("price_period", "total");
              }}
            >
              <Ionicons
                name={t === "buy" ? "home" : "bed"}
                size={15}
                color={form.type === t ? "#fff" : colors.textSecondary}
              />
              <Text style={[styles.typeText, form.type === t && styles.typeTextActive]}>
                {t === "buy" ? "To Buy" : "To Rent"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photos */}
        <Text style={styles.groupTitle}>PHOTOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          <TouchableOpacity testID="add-photo-button" style={styles.addPhoto} activeOpacity={0.7} onPress={addPhoto}>
            <Ionicons name="camera-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.addPhotoText}>Add</Text>
          </TouchableOpacity>
          {form.photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Image source={{ uri: p }} style={styles.photo} contentFit="cover" />
              <TouchableOpacity
                testID={`remove-photo-${i}`}
                style={styles.removePhoto}
                onPress={() => removePhoto(i)}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Core details */}
        <View style={{ marginTop: spacing.lg }}>
          <FormGroup title="Details">
            <Field
              label="Title / nickname"
              testID="input-title"
              placeholder="e.g. Sunny loft in Mitte"
              value={form.title}
              onChangeText={(v) => set("title", v)}
            />
            <Field
              label="Address"
              testID="input-address"
              placeholder="Street, city"
              value={form.address}
              onChangeText={(v) => set("address", v)}
            />
            <View style={[styles.fieldRow]}>
              <View style={styles.priceField}>
                <Field
                  label={form.price_period === "month" ? "Price / month" : "Price"}
                  testID="input-price"
                  placeholder="0"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(v) => set("price", v)}
                  last
                />
              </View>
              <View style={styles.periodToggle}>
                {(["total", "month"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    testID={`period-${p}`}
                    style={[styles.periodItem, form.price_period === p && styles.periodItemActive]}
                    onPress={() => set("price_period", p)}
                  >
                    <Text style={[styles.periodText, form.price_period === p && styles.periodTextActive]}>
                      {p === "total" ? "Total" : "/mo"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Field
              label="Rooms"
              testID="input-rooms"
              placeholder="e.g. 3 bed · 2 bath"
              value={form.rooms}
              onChangeText={(v) => set("rooms", v)}
            />
            <Field
              label="Size"
              testID="input-size"
              placeholder="e.g. 95 m²"
              value={form.size}
              onChangeText={(v) => set("size", v)}
              last
            />
          </FormGroup>

          {/* Listing link */}
          <FormGroup title="Listing">
            <Field
              label="Online link"
              testID="input-url"
              placeholder="https://..."
              autoCapitalize="none"
              keyboardType="url"
              value={form.listing_url}
              onChangeText={(v) => set("listing_url", v)}
              last
            />
          </FormGroup>

          {/* Broker */}
          <FormGroup title="Broker">
            <Field
              label="Name"
              testID="input-broker-name"
              placeholder="Broker / agent name"
              value={form.broker_name}
              onChangeText={(v) => set("broker_name", v)}
            />
            <Field
              label="Phone"
              testID="input-broker-phone"
              placeholder="Phone number"
              keyboardType="phone-pad"
              value={form.broker_phone}
              onChangeText={(v) => set("broker_phone", v)}
            />
            <Field
              label="Email"
              testID="input-broker-email"
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.broker_email}
              onChangeText={(v) => set("broker_email", v)}
              last
            />
          </FormGroup>

          {/* Status & rating */}
          <Text style={styles.groupTitle}>STATUS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusRow}
          >
            {STATUS_ORDER.map((s) => {
              const active = form.status === s;
              const meta = STATUS_META[s];
              return (
                <TouchableOpacity
                  key={s}
                  testID={`form-status-${s}`}
                  style={[
                    styles.statusChip,
                    { backgroundColor: active ? meta.text : colors.surface },
                    !active && styles.statusChipInactive,
                  ]}
                  onPress={() => set("status", s)}
                >
                  <Text style={[styles.statusText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>Rating</Text>
            <StarRating value={form.rating} editable onChange={(v) => set("rating", v)} size={26} />
          </View>

          {/* Viewing date */}
          <TouchableOpacity
            testID="viewing-date-button"
            style={styles.dateRow}
            activeOpacity={0.7}
            onPress={() => setShowPicker(true)}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.orange} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.dateTitle}>Viewing date</Text>
              <Text style={styles.dateValue}>
                {form.viewing_date ? formatDateTime(form.viewing_date) : "Not scheduled"}
              </Text>
            </View>
            {form.viewing_date ? (
              <TouchableOpacity testID="clear-date" onPress={() => set("viewing_date", null)} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            )}
          </TouchableOpacity>

          {showPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                testID="datetime-picker"
                value={form.viewing_date ? new Date(form.viewing_date) : new Date()}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, date) => {
                  if (Platform.OS !== "ios") setShowPicker(false);
                  if (event.type === "set" && date) set("viewing_date", date.toISOString());
                }}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(false)}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={{ marginTop: spacing.lg }}>
            <FormGroup title="Notes">
              <Field
                label="Personal notes"
                testID="input-notes"
                placeholder="What did you like or dislike?"
                multiline
                value={form.notes}
                onChangeText={(v) => set("notes", v)}
                last
              />
            </FormGroup>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky save */}
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            testID="save-button"
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={save}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>{isEdit ? "Save Changes" : "Add Property"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBg },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.appBg,
  },
  cancel: { ...font.body, color: colors.blue, width: 54 },
  headerTitle: { ...font.headline, color: colors.textPrimary },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 40 },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: "#E3E3E8",
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  typeItem: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radius.md - 3,
  },
  typeItemActive: { backgroundColor: colors.brand },
  typeText: { ...font.subhead, fontWeight: "600", color: colors.textSecondary },
  typeTextActive: { color: "#fff" },
  groupTitle: {
    ...font.caption,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  photoRow: { gap: 10, paddingVertical: 2, paddingRight: spacing.md },
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: { ...font.caption, color: colors.textTertiary, marginTop: 4 },
  photoWrap: { width: 88, height: 88 },
  photo: { width: 88, height: 88, borderRadius: radius.lg, backgroundColor: colors.appBg },
  removePhoto: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  priceField: { flex: 1 },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "#E3E3E8",
    borderRadius: radius.sm,
    padding: 2,
    marginBottom: spacing.sm + 4,
  },
  periodItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm - 2 },
  periodItemActive: { backgroundColor: colors.surface, ...shadow.card },
  periodText: { ...font.caption, color: colors.textSecondary, fontWeight: "600" },
  periodTextActive: { color: colors.textPrimary },
  statusRow: { gap: 8, paddingVertical: 2, paddingRight: spacing.md, marginBottom: spacing.lg },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  statusChipInactive: { borderWidth: 0.5, borderColor: colors.border },
  statusText: { ...font.subhead, fontWeight: "600" },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
  },
  ratingLabel: { ...font.headline, color: colors.textPrimary },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTitle: { ...font.subhead, color: colors.textPrimary, fontWeight: "600" },
  dateValue: { ...font.footnote, color: colors.textTertiary, marginTop: 1 },
  pickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  doneBtn: { alignSelf: "flex-end", paddingHorizontal: spacing.md, paddingVertical: 8 },
  doneText: { ...font.headline, color: colors.blue },
  saveBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.glass,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { ...font.headline, color: "#fff" },
});
