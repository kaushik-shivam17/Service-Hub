import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBar } from "@/components/SearchBar";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceCardSkeleton } from "@/components/Skeleton";
import { useCategories, useServices } from "@/hooks/useAppData";
import { useColors } from "@/hooks/useColors";
import { Service } from "@/types";

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<string>(params.category ?? "all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (params.category) setSelectedCategory(params.category);
  }, [params.category]);

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: services = [], isLoading: svcsLoading, error, refetch } = useServices(
    selectedCategory === "all" ? undefined : selectedCategory,
    search
  );

  const handleServicePress = (service: Service) => router.push(`/service/${service.id}`);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Services</Text>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        {!catsLoading && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Pressable
              style={[styles.chip, { backgroundColor: selectedCategory === "all" ? colors.primary : colors.muted, borderColor: selectedCategory === "all" ? colors.primary : colors.border }]}
              onPress={() => setSelectedCategory("all")}
            >
              <Text style={[styles.chipText, { color: selectedCategory === "all" ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>All</Text>
            </Pressable>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.chip, { backgroundColor: active ? colors.primary : colors.muted, borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipText, { color: active ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {error ? (
        <View style={styles.errorState}>
          <Text style={[styles.errorTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Something went wrong</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Failed to load services</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.retryBtnText, { fontFamily: "Inter_600SemiBold" }]}>Retry</Text>
          </Pressable>
        </View>
      ) : svcsLoading ? (
        <FlatList
          data={Array.from({ length: 6 })}
          keyExtractor={(_, i) => String(i)}
          renderItem={() => <ServiceCardSkeleton />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ServiceCard service={item} onPress={handleServicePress} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          onRefresh={refetch}
          refreshing={svcsLoading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>No services found</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Try a different search or category
              </Text>
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
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  list: { paddingTop: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14 },
  errorState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  errorTitle: { fontSize: 17 },
  errorText: { fontSize: 14, textAlign: "center" },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: "#FFFFFF", fontSize: 15 },
});
