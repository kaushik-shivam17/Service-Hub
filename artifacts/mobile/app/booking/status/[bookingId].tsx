import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useBooking, useBookings } from "@/hooks/useBookings";
import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";

const STAGES = [
  { key: "confirmed", label: "Booking Confirmed", icon: "check-circle", desc: "Your booking has been received" },
  { key: "assigned", label: "Professional Assigned", icon: "user-check", desc: "A verified expert has been assigned" },
  { key: "enroute", label: "Professional En Route", icon: "navigation", desc: "Your professional is on the way" },
  { key: "inprogress", label: "Service In Progress", icon: "tool", desc: "Work is underway at your address" },
  { key: "completed", label: "Service Completed", icon: "star", desc: "Your service has been completed" },
] as const;

function getStageIndex(status: Booking["status"]): number {
  switch (status) {
    case "upcoming": return 2;
    case "in_progress": return 3;
    case "completed": return 4;
    case "cancelled": return -1;
    default: return 1;
  }
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, transform: [{ scale }] }} />;
}

export default function BookingStatusScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: booking, isLoading, error } = useBooking(bookingId);
  const { cancelBooking } = useBookings(user?.id);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Booking not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.goBack, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const activeStage = getStageIndex(booking.status);
  const isCancelled = booking.status === "cancelled";
  const providerInitials = booking.providerName
    ? booking.providerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "PR";

  const STATUS_LABEL: Record<Booking["status"], string> = {
    upcoming: "En Route", in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
  };
  const STATUS_GRADIENT: Record<Booking["status"], readonly [string, string]> = {
    upcoming: ["#1241AB", "#1A56DB"],
    in_progress: ["#065F46", "#059669"],
    completed: ["#065F46", "#16A34A"],
    cancelled: ["#7F1D1D", "#DC2626"],
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={STATUS_GRADIENT[booking.status]} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroNav}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.heroTitle, { fontFamily: "Inter_600SemiBold" }]}>Track Booking</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={[styles.bookingId, { fontFamily: "Inter_400Regular" }]}>#{booking.id.slice(0, 10).toUpperCase()}</Text>
        <Text style={[styles.serviceName, { fontFamily: "Inter_700Bold" }]} numberOfLines={2}>{booking.serviceName}</Text>
        <View style={styles.statusBadge}>
          {!isCancelled && <PulsingDot color="#FFFFFF" />}
          <Text style={[styles.statusLabel, { fontFamily: "Inter_600SemiBold" }]}>{STATUS_LABEL[booking.status]}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {(booking.status === "upcoming" || booking.status === "in_progress") && (
          <View style={[styles.etaCard, {
            backgroundColor: booking.status === "in_progress" ? "#ECFDF5" : colors.secondary,
            borderColor: booking.status === "in_progress" ? "#059669" : colors.primary,
          }]}>
            <Feather name={booking.status === "in_progress" ? "tool" : "clock"} size={20}
              color={booking.status === "in_progress" ? "#059669" : colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.etaLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {booking.status === "in_progress" ? "Service is underway" : "Updates every 15 seconds"}
              </Text>
              <Text style={[styles.etaValue, {
                color: booking.status === "in_progress" ? "#059669" : colors.primary,
                fontFamily: "Inter_700Bold",
              }]}>
                {booking.status === "in_progress" ? "In Progress" : "Awaiting Professional"}
              </Text>
            </View>
            <View style={[styles.liveTag, { backgroundColor: booking.status === "in_progress" ? "#059669" : colors.primary }]}>
              <Text style={[styles.liveTagText, { fontFamily: "Inter_700Bold" }]}>LIVE</Text>
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.cancelledBanner, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
            <Feather name="x-circle" size={18} color="#DC2626" />
            <Text style={[styles.cancelledText, { color: "#DC2626", fontFamily: "Inter_500Medium" }]}>This booking has been cancelled</Text>
          </View>
        )}

        <View style={styles.timelineSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Booking Progress</Text>
          {STAGES.map((stage, i) => {
            const isDone = !isCancelled && i <= activeStage;
            const isActive = !isCancelled && i === activeStage;
            const isLast = i === STAGES.length - 1;
            return (
              <View key={stage.key} style={styles.stageRow}>
                <View style={styles.stageLeft}>
                  <View style={[styles.stageDot, {
                    backgroundColor: isCancelled ? colors.muted : isDone ? colors.primary : colors.muted,
                    borderColor: isCancelled ? colors.border : isDone ? colors.primary : colors.border,
                  }]}>
                    {isDone
                      ? <Feather name="check" size={12} color="#FFFFFF" />
                      : <Text style={[styles.stageDotNum, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{i + 1}</Text>}
                  </View>
                  {!isLast && <View style={[styles.stageLine, { backgroundColor: !isCancelled && i < activeStage ? colors.primary : colors.border }]} />}
                </View>
                <View style={[styles.stageContent, { opacity: isCancelled || i > activeStage ? 0.4 : 1 }]}>
                  <View style={[styles.stageIconWrap, { backgroundColor: isDone && !isCancelled ? colors.secondary : colors.muted }]}>
                    <Feather name={stage.icon as any} size={16} color={isDone && !isCancelled ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.stageLabelRow}>
                      <Text style={[styles.stageLabel, { color: isDone && !isCancelled ? colors.text : colors.mutedForeground, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_500Medium" }]}>
                        {stage.label}
                      </Text>
                      {isActive && !isCancelled && (
                        <View style={[styles.activeTag, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.activeTagText, { fontFamily: "Inter_600SemiBold" }]}>NOW</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.stageDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{stage.desc}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {booking.providerName && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>Your Professional</Text>
            <View style={styles.providerRow}>
              <View style={[styles.providerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.providerInitials, { fontFamily: "Inter_700Bold" }]}>{providerInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.providerName, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>{booking.providerName}</Text>
                <View style={styles.verifiedRow}>
                  <Feather name="check-circle" size={12} color={colors.primary} />
                  <Text style={[styles.verifiedText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Verified Professional</Text>
                </View>
              </View>
              <View style={[styles.callBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Feather name="phone" size={18} color={colors.primary} />
              </View>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginBottom: 12 }]}>Booking Details</Text>
          {[
            { icon: "calendar", label: "Date", value: booking.date },
            { icon: "clock", label: "Time", value: booking.time },
            { icon: "map-pin", label: "Address", value: booking.address },
            { icon: "tag", label: "Total", value: `₹${booking.totalPrice}` },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: idx < arr.length - 1 ? 1 : 0 }]}>
              <View style={[styles.detailIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={row.icon as any} size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{row.label}</Text>
                <Text style={[styles.detailValue, { color: colors.text, fontFamily: "Inter_500Medium" }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {(booking.status === "upcoming" || booking.status === "completed") && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          {booking.status === "upcoming" && (
            <Pressable
              style={({ pressed }) => [styles.footerBtn, styles.cancelFooterBtn, { borderColor: colors.destructive, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => cancelBooking.mutate(booking.id, { onSuccess: () => router.back() })}
            >
              <Feather name="x-circle" size={16} color={colors.destructive} />
              <Text style={[styles.footerBtnText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>Cancel Booking</Text>
            </Pressable>
          )}
          {booking.status === "completed" && (
            <Pressable style={({ pressed }) => [styles.footerBtn, styles.rateFooterBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Feather name="star" size={16} color="#FFFFFF" />
              <Text style={[styles.footerBtnText, { color: "#FFFFFF", fontFamily: "Inter_600SemiBold" }]}>Rate Service</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, marginTop: 8 },
  goBack: { fontSize: 15, marginTop: 4 },
  hero: { paddingHorizontal: 16, paddingBottom: 24, gap: 6 },
  heroNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  heroTitle: { color: "#FFFFFF", fontSize: 17 },
  bookingId: { color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: 0.5 },
  serviceName: { color: "#FFFFFF", fontSize: 22, lineHeight: 28 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  statusLabel: { color: "#FFFFFF", fontSize: 14 },
  etaCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 12 },
  etaLabel: { fontSize: 12, marginBottom: 2 },
  etaValue: { fontSize: 16 },
  liveTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveTagText: { color: "#FFFFFF", fontSize: 10, letterSpacing: 1 },
  cancelledBanner: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  cancelledText: { fontSize: 14 },
  timelineSection: { padding: 16, gap: 0 },
  sectionTitle: { fontSize: 17, marginBottom: 0 },
  stageRow: { flexDirection: "row", gap: 12, minHeight: 72 },
  stageLeft: { alignItems: "center", width: 32 },
  stageDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stageDotNum: { fontSize: 12 },
  stageLine: { flex: 1, width: 2, marginVertical: 4 },
  stageContent: { flex: 1, flexDirection: "row", gap: 10, paddingBottom: 16, paddingTop: 4 },
  stageIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stageLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  stageLabel: { fontSize: 14 },
  activeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  activeTagText: { color: "#FFFFFF", fontSize: 9, letterSpacing: 0.5 },
  stageDesc: { fontSize: 12, lineHeight: 17 },
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  providerAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  providerInitials: { color: "#FFFFFF", fontSize: 18 },
  providerName: { fontSize: 15, marginBottom: 3 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontSize: 12 },
  callBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 12 },
  detailIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  detailLabel: { fontSize: 11, marginBottom: 2 },
  detailValue: { fontSize: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  cancelFooterBtn: { borderWidth: 1.5 },
  rateFooterBtn: {},
  footerBtnText: { fontSize: 15 },
});
