import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CategoryCardSkeleton,
  ProviderCardSkeleton,
  ServiceCardSkeleton,
} from "@/components/Skeleton";
import { CategoryCard } from "@/components/CategoryCard";
import { ProviderCard } from "@/components/ProviderCard";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { ServiceCard } from "@/components/ServiceCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, useProviders, useServices } from "@/hooks/useAppData";
import { useColors } from "@/hooks/useColors";
import { Category, Service } from "@/types";

const banners = [
  {
    id: "1",
    title: "Professional\nHome Cleaning",
    subtitle: "Starts at ₹499",
    bg: ["#1241AB", "#1A56DB"] as const,
    image: require("../../assets/images/banner1.png"),
  },
  {
    id: "2",
    title: "AC Service &\nRepair",
    subtitle: "Expert technicians at your door",
    bg: ["#065F46", "#059669"] as const,
    image: require("../../assets/images/banner2.png"),
  },
];

const BANNER_WIDTH = 300;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [bannerIndex, setBannerIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: allServices = [], isLoading: svcsLoading } = useServices();
  const { data: allProviders = [], isLoading: prosLoading } = useProviders();

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const popularServices = allServices.filter((s) => s.popular).slice(0, 6);

  const handleCategoryPress = (cat: Category) =>
    router.push({ pathname: "/(tabs)/services", params: { category: cat.id } });

  const handleServicePress = (service: Service) =>
    router.push(`/service/${service.id}`);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 16));
    setBannerIndex(index);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={["#1241AB", "#1A56DB"]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.locationRow}>
            <Feather name="map-pin" size={15} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.locationText, { fontFamily: "Inter_500Medium" }]}>Mumbai, Maharashtra</Text>
            <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable style={styles.notifBtn} accessibilityLabel="Notifications">
            <Feather name="bell" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={[styles.greeting, { fontFamily: "Inter_700Bold" }]}>Hello, {firstName}!</Text>
        <Text style={[styles.greetingSub, { fontFamily: "Inter_400Regular" }]}>
          What service do you need today?
        </Text>
        <View style={styles.searchWrap}>
          <SearchBar editable={false} onPress={() => router.push("/(tabs)/services")} />
        </View>
      </LinearGradient>

      {/* Banners */}
      <View style={styles.bannerSection}>
        <FlatList
          ref={flatRef}
          data={banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={BANNER_WIDTH + 16}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingRight: 16 }}
          renderItem={({ item }) => (
            <LinearGradient colors={item.bg} style={styles.banner}>
              <View style={styles.bannerContent}>
                <Text style={[styles.bannerTitle, { fontFamily: "Inter_700Bold" }]}>{item.title}</Text>
                <Text style={[styles.bannerSubtitle, { fontFamily: "Inter_400Regular" }]}>{item.subtitle}</Text>
                <Pressable style={styles.bannerBtn} onPress={() => router.push("/(tabs)/services")}>
                  <Text style={[styles.bannerBtnText, { fontFamily: "Inter_600SemiBold" }]}>Book Now</Text>
                </Pressable>
              </View>
              <Image source={item.image} style={styles.bannerImage} contentFit="cover" />
            </LinearGradient>
          )}
        />
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === bannerIndex ? colors.primary : colors.border }]} />
          ))}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeader title="Our Services" onSeeAll={() => router.push("/(tabs)/services")} />
        {catsLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onPress={handleCategoryPress} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Popular Services */}
      {popularServices.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Popular Services" onSeeAll={() => router.push("/(tabs)/services")} />
          {svcsLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={{ width: 150, borderRadius: 12, padding: 14, marginRight: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, gap: 8 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.muted }} />
                  <View style={{ width: 100, height: 14, backgroundColor: colors.muted, borderRadius: 6 }} />
                  <View style={{ width: 70, height: 12, backgroundColor: colors.muted, borderRadius: 6 }} />
                  <View style={{ width: 60, height: 18, backgroundColor: colors.muted, borderRadius: 6 }} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {popularServices.map((svc) => (
                <ServiceCard key={svc.id} service={svc} onPress={handleServicePress} horizontal />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* All Services teaser */}
      <View style={[styles.section, { paddingBottom: 0 }]}>
        <SectionHeader title="Browse Services" onSeeAll={() => router.push("/(tabs)/services")} />
        {svcsLoading
          ? Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : allServices.slice(0, 4).map((svc) => (
              <ServiceCard key={svc.id} service={svc} onPress={handleServicePress} />
            ))}
      </View>

      {/* Top Professionals */}
      <View style={styles.section}>
        <SectionHeader title="Top Professionals" onSeeAll={() => {}} />
        {prosLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {Array.from({ length: 4 }).map((_, i) => <ProviderCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {allProviders.map((pro) => (
              <ProviderCard key={pro.id} provider={pro} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Promo */}
      <View style={styles.promoBanner}>
        <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.promoBannerInner}>
          <Feather name="tag" size={22} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.promoTitle, { fontFamily: "Inter_700Bold" }]}>First booking offer!</Text>
            <Text style={[styles.promoText, { fontFamily: "Inter_400Regular" }]}>Get ₹100 off on your first service</Text>
          </View>
          <Pressable style={styles.promoBtn} onPress={() => router.push("/(tabs)/services")}>
            <Text style={[styles.promoBtnText, { fontFamily: "Inter_600SemiBold" }]}>Claim</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 24, gap: 6 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { color: "rgba(255,255,255,0.9)", fontSize: 14 },
  notifBtn: { padding: 4 },
  greeting: { color: "#FFFFFF", fontSize: 24 },
  greetingSub: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  searchWrap: { marginTop: 8 },
  bannerSection: { marginTop: 20, marginBottom: 8 },
  banner: { width: BANNER_WIDTH, height: 160, marginLeft: 16, borderRadius: 16, flexDirection: "row", overflow: "hidden", padding: 18 },
  bannerContent: { flex: 1, gap: 6, justifyContent: "center" },
  bannerTitle: { color: "#FFFFFF", fontSize: 18, lineHeight: 24 },
  bannerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  bannerBtn: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  bannerBtnText: { color: "#FFFFFF", fontSize: 12 },
  bannerImage: { width: 100, height: 130, borderRadius: 8 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  section: { marginTop: 24 },
  categoryRow: { paddingHorizontal: 16, gap: 16 },
  horizontalList: { paddingHorizontal: 16 },
  promoBanner: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, overflow: "hidden" },
  promoBannerInner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  promoTitle: { color: "#FFFFFF", fontSize: 15 },
  promoText: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  promoBtn: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  promoBtnText: { color: "#FFFFFF", fontSize: 13 },
});
