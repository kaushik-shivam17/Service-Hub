import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, danger }: MenuItemProps) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#FEF2F2" : colors.secondary }]}>
        <Feather name={icon as any} size={18} color={danger ? "#DC2626" : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? "#DC2626" : colors.text, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      {!danger && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatarCircle, { marginTop: insets.top + 16 }]}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { fontFamily: "Inter_700Bold" }]}>{user?.name ?? "User"}</Text>
        <Text style={[styles.userEmail, { fontFamily: "Inter_400Regular" }]}>{user?.email ?? ""}</Text>
        {user?.phone && (
          <Text style={[styles.userPhone, { fontFamily: "Inter_400Regular" }]}>{user.phone}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          ACCOUNT
        </Text>
        <MenuItem icon="user" label="Edit Profile" onPress={() => {}} />
        <MenuItem icon="map-pin" label="Saved Addresses" onPress={() => {}} />
        <MenuItem icon="credit-card" label="Payment Methods" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          PREFERENCES
        </Text>
        <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
        <MenuItem icon="globe" label="Language" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          SUPPORT
        </Text>
        <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
        <MenuItem icon="star" label="Rate the App" onPress={() => {}} />
        <MenuItem icon="file-text" label="Terms & Privacy" onPress={() => {}} />
      </View>

      <View style={[styles.section, { marginBottom: 0 }]}>
        <MenuItem icon="log-out" label="Sign Out" onPress={handleSignOut} danger />
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        UrbanServe v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    paddingHorizontal: 24,
    gap: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, color: "#FFFFFF" },
  userName: { fontSize: 20, color: "#FFFFFF" },
  userEmail: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  userPhone: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  section: { marginTop: 24, marginHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 11, letterSpacing: 0.8, marginBottom: 4, marginLeft: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15 },
  version: { textAlign: "center", marginTop: 32, marginBottom: 8, fontSize: 12 },
});
