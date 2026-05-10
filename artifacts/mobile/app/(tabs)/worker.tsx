import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useWorkerBookings } from "@/hooks/useBookings";
import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  upcoming: { label: "Upcoming", bg: "#EFF6FF", text: "#1A56DB", border: "#1A56DB" },
  in_progress: { label: "In Progress", bg: "#ECFDF5", text: "#059669", border: "#059669" },
  completed: { label: "Completed", bg: "#F0FDF4", text: "#16A34A", border: "#16A34A" },
  cancelled: { label: "Cancelled", bg: "#FEF2F2", text: "#DC2626", border: "#DC2626" },
};

const NEXT_STATUS: Record<string, { label: string; next: string; icon: string; color: string } | null> = {
  upcoming: { label: "Start Job", next: "in_progress", icon: "play", color: "#059669" },
  in_progress: { label: "Mark Complete", next: "completed", icon: "check-circle", color: "#16A34A" },
  completed: null,
  cancelled: null,
};

function WorkerBookingCard({ booking, onUpdateStatus }: { booking: Booking; onUpdateStatus: (id: string, status: string) => void }) {
  const colors = useColors();
  const meta = STATUS_META[booking.status] ?? STATUS_META.upcoming;
  const nextAction = NEXT_STATUS[booking.status];

  const handleAction = () => {
    if (!nextAction) return;
    const confirmMsg = nextAction.next === "in_progress"
      ? `Start the job for ${booking.serviceName}?`
      : `Mark this job as completed?`;
    Alert.alert("Confirm", confirmMsg, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => onUpdateStatus(booking.id, nextAction.next) },
    ]);
  };

  return (
    <View style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: meta.border }]}>
      <View style={styles.jobHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.jobService, { color: colors.text, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {booking.serviceName}
          </Text>
          <Text style={[styles.jobCategory, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {booking.categoryName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.text, fontFamily: "Inter_600SemiBold" }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {booking.date} · {booking.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
            {booking.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="tag" size={13} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            ₹{booking.totalPrice}
          </Text>
        </View>
      </View>

      {nextAction && (
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: nextAction.color, opacity: pressed ? 0.85 : 1 }]}
          onPress={handleAction}
        >
          <Feather name={nextAction.icon as any} size={15} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { fontFamily: "Inter_600SemiBold" }]}>{nextAction.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

function WorkerDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { data: bookings = [], isLoading, error, refetch, updateStatus } = useWorkerBookings();

  const filters = ["all", "upcoming", "in_progress", "completed"];
  const filtered = activeFilter === "all" ? bookings : bookings.filter((b) => b.status === activeFilter);

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter((b) => b.status === "upcoming").length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1241AB", "#1A56DB"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { fontFamily: "Inter_400Regular" }]}>Welcome back,</Text>
            <Text style={[styles.workerName, { fontFamily: "Inter_700Bold" }]}>{user?.name ?? "Professional"}</Text>
          </View>
          <View style={styles.workerBadge}>
            <Feather name="briefcase" size={14} color="#1A56DB" />
            <Text style={[styles.workerBadgeText, { fontFamily: "Inter_600SemiBold" }]}>Worker</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Total", value: stats.total, icon: "list" },
            { label: "Upcoming", value: stats.upcoming, icon: "clock" },
            { label: "Active", value: stats.inProgress, icon: "zap" },
            { label: "Done", value: stats.completed, icon: "check-circle" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => {
            const isActive = activeFilter === f;
            const label = f === "all" ? "All Jobs" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1);
            return (
              <Pressable
                key={f}
                style={[styles.filterChip, isActive && { backgroundColor: colors.primary }]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, { color: isActive ? "#FFFFFF" : colors.mutedForeground, fontFamily: isActive ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Failed to load jobs</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.retryBtnText, { fontFamily: "Inter_600SemiBold" }]}>Retry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerState}>
          <Feather name="inbox" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>No jobs found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {activeFilter === "all" ? "You have no assigned jobs yet" : `No ${activeFilter.replace("_", " ")} jobs`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WorkerBookingCard booking={item} onUpdateStatus={handleUpdateStatus} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

function NotAWorker() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingTop: insets.top }]}>
      <View style={[styles.workerIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="briefcase" size={36} color={colors.primary} />
      </View>
      <Text style={[styles.notWorkerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Worker Portal</Text>
      <Text style={[styles.notWorkerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        This section is for service professionals. Log in with a worker account to view and manage your assigned jobs.
      </Text>
      <Pressable style={[styles.switchBtn, { backgroundColor: colors.primary }]} onPress={signOut}>
        <Feather name="log-out" size={15} color="#FFFFFF" />
        <Text style={[styles.switchBtnText, { fontFamily: "Inter_600SemiBold" }]}>Sign out & switch account</Text>
      </Pressable>
    </View>
  );
}

export default function WorkerScreen() {
  const { user } = useAuth();
  if (user?.role === "worker") return <WorkerDashboard />;
  return <NotAWorker />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  greeting: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  workerName: { color: "#FFFFFF", fontSize: 20 },
  workerBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  workerBadgeText: { color: "#1A56DB", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 22 },
  statLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 },
  filterBar: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "transparent", borderWidth: 1, borderColor: "transparent" },
  filterChipText: { fontSize: 13 },
  list: { paddingTop: 14, paddingHorizontal: 0 },
  jobCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginHorizontal: 16, marginBottom: 12, padding: 14, gap: 10 },
  jobHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  jobService: { fontSize: 15 },
  jobCategory: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11 },
  divider: { height: 1 },
  jobDetails: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  detailText: { fontSize: 13, flex: 1 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 10, paddingVertical: 11 },
  actionBtnText: { color: "#FFFFFF", fontSize: 14 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center" },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#FFFFFF", fontSize: 15 },
  workerIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  notWorkerTitle: { fontSize: 22, marginBottom: 8 },
  notWorkerText: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  switchBtnText: { color: "#FFFFFF", fontSize: 15 },
});
