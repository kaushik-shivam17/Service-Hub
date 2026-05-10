import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Provider } from "@/types";

interface Props {
  provider: Provider;
  onPress?: (provider: Provider) => void;
  compact?: boolean;
}

export function ProviderCard({ provider, onPress, compact }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(provider);
  };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactCard,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.compactAvatar, { backgroundColor: provider.color }]}>
          <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>{provider.initials}</Text>
        </View>
        <View style={styles.compactInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.compactName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
              {provider.name}
            </Text>
            {provider.verified && (
              <Feather name="check-circle" size={14} color={colors.primary} />
            )}
          </View>
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color={colors.rating} />
            <Text style={[styles.rating, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {provider.rating} · {provider.experienceYears}y exp
            </Text>
          </View>
        </View>
        <Text style={[styles.compactPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          ₹{provider.pricePerHour}/hr
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.avatar, { backgroundColor: provider.color }]}>
        <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold", fontSize: 20 }]}>{provider.initials}</Text>
      </View>
      <Text style={[styles.name, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
        {provider.name}
      </Text>
      <View style={styles.ratingRow}>
        <Feather name="star" size={13} color={colors.rating} />
        <Text style={[styles.rating, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {provider.rating} ({provider.reviewCount})
        </Text>
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {provider.experienceYears} yrs · {provider.completedJobs} jobs
      </Text>
      {provider.verified && (
        <View style={[styles.verifiedBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="check-circle" size={11} color={colors.primary} />
          <Text style={[styles.verifiedText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Verified</Text>
        </View>
      )}
      <Text style={[styles.price, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
        ₹{provider.pricePerHour}/hr
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
    gap: 5,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { color: "#FFFFFF", fontSize: 20 },
  name: { fontSize: 14, textAlign: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: { fontSize: 12 },
  meta: { fontSize: 11 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedText: { fontSize: 11 },
  price: { fontSize: 15, marginTop: 4 },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  compactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  compactName: { fontSize: 14, flex: 1 },
  compactPrice: { fontSize: 13 },
});
