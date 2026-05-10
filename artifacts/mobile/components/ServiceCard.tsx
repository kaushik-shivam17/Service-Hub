import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Service } from "@/types";

interface Props {
  service: Service;
  onPress: (service: Service) => void;
  horizontal?: boolean;
}

export function ServiceCard({ service, onPress, horizontal }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(service);
  };

  if (horizontal) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.horizontalCard,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={handlePress}
      >
        <View style={[styles.horizontalIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="star" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.horizontalName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
          {service.name}
        </Text>
        <View style={styles.horizontalMeta}>
          <Feather name="star" size={12} color={colors.rating} />
          <Text style={[styles.ratingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {service.rating}
          </Text>
        </View>
        <Text style={[styles.horizontalPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
          ₹{service.price}
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
      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={[styles.categoryTag, { color: colors.primary, fontFamily: "Inter_500Medium", backgroundColor: colors.secondary }]}>
            {service.categoryName}
          </Text>
          <Text style={[styles.name, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="star" size={13} color={colors.rating} />
            <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {service.rating} ({service.reviewCount})
            </Text>
            <Text style={[styles.dot, { color: colors.border }]}>•</Text>
            <Feather name="clock" size={13} color={colors.mutedForeground} />
            <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {service.duration} min
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.price, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            ₹{service.price}
          </Text>
          <Pressable
            style={[styles.bookBtn, { backgroundColor: colors.primary }]}
            onPress={handlePress}
          >
            <Text style={[styles.bookBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Book
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  cardInfo: { flex: 1, gap: 4 },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    fontSize: 11,
    overflow: "hidden",
  },
  name: { fontSize: 15, lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 12 },
  dot: { fontSize: 12 },
  cardRight: { alignItems: "flex-end", gap: 8 },
  price: { fontSize: 18 },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookBtnText: { fontSize: 13 },
  horizontalCard: {
    width: 150,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginRight: 12,
    gap: 6,
  },
  horizontalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  horizontalName: { fontSize: 13, lineHeight: 18 },
  horizontalMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12 },
  horizontalPrice: { fontSize: 16 },
});
