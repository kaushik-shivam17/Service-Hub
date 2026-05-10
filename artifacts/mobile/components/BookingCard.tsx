import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";

interface Props {
  booking: Booking;
  onCancel?: (id: string) => void;
  onRebook?: (booking: Booking) => void;
}

const STATUS_COLORS = {
  upcoming: { bg: "#EFF6FF", text: "#1A56DB", label: "Upcoming" },
  in_progress: { bg: "#ECFDF5", text: "#059669", label: "In Progress" },
  completed: { bg: "#F0FDF4", text: "#16A34A", label: "Completed" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626", label: "Cancelled" },
};

const STATUS_BORDER = {
  upcoming: "#1A56DB",
  in_progress: "#059669",
  completed: "#16A34A",
  cancelled: "#DC2626",
};

export function BookingCard({ booking, onCancel, onRebook }: Props) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[booking.status];
  const borderColor = STATUS_BORDER[booking.status];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: borderColor },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.serviceName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {booking.serviceName}
          </Text>
          <Text style={[styles.category, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {booking.categoryName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text, fontFamily: "Inter_600SemiBold" }]}>
            {statusColor.label}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {booking.date} · {booking.time}
          </Text>
        </View>
        {booking.providerName && (
          <View style={styles.detailRow}>
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {booking.providerName}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {booking.address}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          ₹{booking.totalPrice}
        </Text>
        <View style={styles.actions}>
          {booking.status === "upcoming" && onCancel && (
            <Pressable
              style={[styles.actionBtn, { borderColor: colors.destructive }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onCancel(booking.id);
              }}
            >
              <Text style={[styles.actionBtnText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
                Cancel
              </Text>
            </Pressable>
          )}
          {booking.status === "completed" && onRebook && (
            <Pressable
              style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRebook(booking);
              }}
            >
              <Text style={[styles.actionBtnText, { color: "#FFF", fontFamily: "Inter_500Medium" }]}>
                Book Again
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerLeft: { flex: 1, gap: 2 },
  serviceName: { fontSize: 15 },
  category: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11 },
  divider: { height: 1 },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  detailText: { fontSize: 13, flex: 1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 17 },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  actionBtnText: { fontSize: 13 },
});
