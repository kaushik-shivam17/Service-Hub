import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookingCard } from "@/components/BookingCard";
import { BOOKINGS_KEY } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type TabType = (typeof TABS)[number];

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("Upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadBookings = useCallback(async () => {
    const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
    if (raw) setBookings(JSON.parse(raw));
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = bookings.filter((b) => {
    if (activeTab === "Upcoming") return b.status === "upcoming" || b.status === "in_progress";
    if (activeTab === "Completed") return b.status === "completed";
    return b.status === "cancelled";
  });

  const handleCancel = async (id: string) => {
    const updated = bookings.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b);
    setBookings(updated);
    await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  };

  const handleRebook = (booking: Booking) => {
    router.push(`/booking/${booking.serviceId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>My Bookings</Text>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.activeTab, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.primary : colors.mutedForeground },
                  { fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular" },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard booking={item} onCancel={handleCancel} onRebook={handleRebook} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        onRefresh={loadBookings}
        refreshing={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              No {activeTab.toLowerCase()} bookings
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {activeTab === "Upcoming" ? "Book a service to get started" : "Your booking history will appear here"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingTop: 16 },
  title: { fontSize: 22, paddingHorizontal: 16, paddingBottom: 12 },
  tabs: { flexDirection: "row" },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontSize: 14 },
  list: { paddingTop: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  exploreBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  exploreBtnText: { color: "#FFFFFF", fontSize: 15 },
});
