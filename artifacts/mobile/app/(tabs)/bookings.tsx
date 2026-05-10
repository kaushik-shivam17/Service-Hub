import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookingCard } from "@/components/BookingCard";
import { BookingCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";
import { useState } from "react";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type TabType = (typeof TABS)[number];

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("Upcoming");

  const { data: bookings = [], isLoading, error, refetch, cancelBooking } = useBookings(user?.id);

  const filtered = bookings.filter((b) => {
    if (activeTab === "Upcoming") return b.status === "upcoming" || b.status === "in_progress";
    if (activeTab === "Completed") return b.status === "completed";
    return b.status === "cancelled";
  });

  const handleCancel = (id: string) => cancelBooking.mutate(id);
  const handleRebook = (booking: Booking) => router.push(`/booking/${booking.serviceId}`);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>My Bookings</Text>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }]]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }, { fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Failed to load bookings</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.retryBtnText, { fontFamily: "Inter_600SemiBold" }]}>Retry</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <FlatList
          data={Array.from({ length: 3 })}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <BookingCardSkeleton />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard booking={item} onCancel={handleCancel} onRebook={handleRebook} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={[styles.stateTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                No {activeTab.toLowerCase()} bookings
              </Text>
              <Text style={[styles.stateText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {activeTab === "Upcoming"
                  ? "Book a service to get started"
                  : "Your history will appear here"}
              </Text>
              {activeTab === "Upcoming" && (
                <Pressable
                  style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/(tabs)/services")}
                >
                  <Text style={[styles.exploreBtnText, { fontFamily: "Inter_600SemiBold" }]}>Explore Services</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingTop: 16 },
  title: { fontSize: 22, paddingHorizontal: 16, paddingBottom: 12 },
  tabs: { flexDirection: "row" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontSize: 14 },
  list: { paddingTop: 14 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10, paddingHorizontal: 40 },
  stateTitle: { fontSize: 17 },
  stateText: { fontSize: 14, textAlign: "center" },
  exploreBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  exploreBtnText: { color: "#FFFFFF", fontSize: 15 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#FFFFFF", fontSize: 15 },
});
