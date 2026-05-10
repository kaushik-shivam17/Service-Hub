import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
}

export function StarRating({ rating, reviewCount, size = 14, showCount = true }: Props) {
  const colors = useColors();
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Feather
          key={star}
          name="star"
          size={size}
          color={star <= Math.round(rating) ? colors.rating : colors.border}
        />
      ))}
      <Text style={[styles.rating, { color: colors.text, fontFamily: "Inter_600SemiBold", fontSize: size }]}>
        {rating.toFixed(1)}
      </Text>
      {showCount && reviewCount !== undefined && (
        <Text style={[styles.count, { color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: size - 1 }]}>
          ({reviewCount.toLocaleString()})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 3 },
  rating: {},
  count: {},
});
