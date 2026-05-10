import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: "#D1D5DB", opacity }, style]}
    />
  );
}

export function ServiceCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardBody}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={70} height={20} borderRadius={20} />
          <Skeleton width="85%" height={17} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Skeleton width={80} height={13} />
            <Skeleton width={60} height={13} />
          </View>
        </View>
        <View style={{ gap: 10, alignItems: "flex-end" }}>
          <Skeleton width={56} height={22} />
          <Skeleton width={64} height={34} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function CategoryCardSkeleton() {
  return (
    <View style={styles.categoryCard}>
      <Skeleton width={60} height={60} borderRadius={16} />
      <Skeleton width={56} height={13} borderRadius={6} />
    </View>
  );
}

export function ProviderCardSkeleton() {
  return (
    <View style={styles.providerCard}>
      <Skeleton width={58} height={58} borderRadius={29} style={{ marginBottom: 8 }} />
      <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
      <Skeleton width={80} height={12} style={{ marginBottom: 4 }} />
      <Skeleton width={70} height={12} />
    </View>
  );
}

export function BookingCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ gap: 6 }}>
          <Skeleton width={160} height={16} />
          <Skeleton width={90} height={13} />
        </View>
        <Skeleton width={80} height={26} borderRadius={20} />
      </View>
      <Skeleton height={1} style={{ marginBottom: 12 }} />
      <View style={{ gap: 8 }}>
        <Skeleton width="75%" height={13} />
        <Skeleton width="60%" height={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  categoryCard: {
    width: 76,
    alignItems: "center",
    gap: 8,
  },
  providerCard: {
    width: 160,
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
  },
  bookingCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
  },
});
