import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProviderCard } from "@/components/ProviderCard";
import { StarRating } from "@/components/StarRating";
import { useProviders, useService } from "@/hooks/useAppData";
import { useColors } from "@/hooks/useColors";

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: service, isLoading, error } = useService(id);
  const { data: allProviders = [] } = useProviders(service?.categoryName);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          Service not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.goBack, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const displayProviders = allProviders.slice(0, 4);
  const durationLabel =
    service.duration >= 60 ? `${(service.duration / 60).toFixed(1).replace(".0", "")}h` : `${service.duration}m`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <LinearGradient colors={["#1241AB", "#1A56DB", "#3B82F6"]} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroContent}>
            <Text style={[styles.category, { fontFamily: "Inter_500Medium" }]}>{service.categoryName}</Text>
            <Text style={[styles.serviceName, { fontFamily: "Inter_700Bold" }]}>{service.name}</Text>
            <StarRating rating={service.rating} reviewCount={service.reviewCount} size={14} />
          </View>
        </LinearGradient>

        {/* Price Bar */}
        <View style={[styles.priceBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Starting from", value: `₹${service.price}`, accent: true },
            { label: "Duration", value: durationLabel, accent: false },
            { label: "Reviews", value: service.reviewCount.toLocaleString(), accent: false },
          ].map((item, i) => (
            <View key={i} style={styles.priceBarItem}>
              {i > 0 && <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.label}</Text>
                <Text style={[styles.priceValue, { color: item.accent ? colors.primary : colors.text, fontFamily: "Inter_700Bold" }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>About this service</Text>
          <Text style={[styles.description, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{service.description}</Text>
        </View>

        {/* Includes */}
        {service.includes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>What's included</Text>
            <View style={styles.includesList}>
              {service.includes.map((item, i) => (
                <View key={i} style={styles.includeItem}>
                  <View style={[styles.includeDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.includeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Providers */}
        {displayProviders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Available Professionals</Text>
            {displayProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} compact />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <View>
          <Text style={[styles.footerLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Total</Text>
          <Text style={[styles.footerPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>₹{service.price}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push(`/booking/${service.id}`)}
          accessibilityLabel="Book Now"
        >
          <Text style={[styles.bookBtnText, { fontFamily: "Inter_700Bold" }]}>Book Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 18 },
  goBack: { fontSize: 15 },
  hero: { paddingHorizontal: 16, paddingBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heroContent: { gap: 8 },
  category: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  serviceName: { color: "#FFFFFF", fontSize: 24, lineHeight: 30 },
  priceBar: { flexDirection: "row", marginHorizontal: 16, borderRadius: 14, borderWidth: 1, marginTop: -18, overflow: "hidden" },
  priceBarItem: { flex: 1, flexDirection: "row" },
  priceDivider: { width: 1, marginVertical: 10 },
  priceItem: { flex: 1, alignItems: "center", padding: 14, gap: 4 },
  priceLabel: { fontSize: 11 },
  priceValue: { fontSize: 16 },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 17 },
  description: { fontSize: 14, lineHeight: 22 },
  includesList: { gap: 8 },
  includeItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  includeDot: { width: 7, height: 7, borderRadius: 4 },
  includeText: { fontSize: 14, flex: 1 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  footerLabel: { fontSize: 12 },
  footerPrice: { fontSize: 22 },
  bookBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  bookBtnText: { color: "#FFFFFF", fontSize: 16 },
});
