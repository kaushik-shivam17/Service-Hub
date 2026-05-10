import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress: () => void; danger?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#FEF2F2" : colors.secondary }]}>
        <Feather name={icon as never} size={18} color={danger ? "#DC2626" : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: danger ? "#DC2626" : colors.text, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
        {value ? (
          <Text style={[styles.menuValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {value}
          </Text>
        ) : null}
      </View>
      {!danger && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut, updateProfile } = useAuth();
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone.trim() || undefined });
      setEditVisible(false);
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 20 }]}>
        <View style={styles.avatarCircle}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { fontFamily: "Inter_700Bold" }]}>{user?.name ?? "User"}</Text>
        <Text style={[styles.userEmail, { fontFamily: "Inter_400Regular" }]}>{user?.email ?? ""}</Text>
        {user?.phone && (
          <Text style={[styles.userPhone, { fontFamily: "Inter_400Regular" }]}>{user.phone}</Text>
        )}
        <Pressable style={styles.editProfileBtn} onPress={() => { setEditName(user?.name ?? ""); setEditPhone(user?.phone ?? ""); setEditVisible(true); }}>
          <Feather name="edit-2" size={14} color="#FFFFFF" />
          <Text style={[styles.editProfileText, { fontFamily: "Inter_500Medium" }]}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>ACCOUNT</Text>
        <MenuItem icon="map-pin" label="Saved Addresses" onPress={() => {}} />
        <MenuItem icon="credit-card" label="Payment Methods" onPress={() => {}} />
        <MenuItem icon="gift" label="Offers & Referrals" onPress={() => {}} />
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>PREFERENCES</Text>
        <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
        <MenuItem icon="globe" label="Language" value="English" onPress={() => {}} />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>SUPPORT</Text>
        <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
        <MenuItem icon="star" label="Rate the App" onPress={() => {}} />
        <MenuItem icon="file-text" label="Terms & Privacy Policy" onPress={() => {}} />
        <MenuItem icon="info" label="About UrbanServe" onPress={() => {}} />
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, { marginBottom: 0 }]}>
        <MenuItem icon="log-out" label="Sign Out" onPress={handleSignOut} danger />
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        UrbanServe v1.0.0
      </Text>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Edit Profile</Text>
              <Pressable onPress={() => setEditVisible(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.modalFields}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Full Name</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontFamily: "Inter_400Regular" }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Phone Number</Text>
                <TextInput
                  style={[styles.fieldInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text, fontFamily: "Inter_400Regular" }]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.85 : 1 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_700Bold" }]}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 28, paddingHorizontal: 24, gap: 4 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  avatarText: { fontSize: 28, color: "#FFFFFF" },
  userName: { fontSize: 20, color: "#FFFFFF" },
  userEmail: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  userPhone: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 10 },
  editProfileText: { color: "#FFFFFF", fontSize: 13 },
  section: { marginTop: 24, marginHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4, marginLeft: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15 },
  menuValue: { fontSize: 12, marginTop: 1 },
  version: { textAlign: "center", marginTop: 32, marginBottom: 8, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18 },
  modalFields: { gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13 },
  fieldInput: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontSize: 16 },
});
