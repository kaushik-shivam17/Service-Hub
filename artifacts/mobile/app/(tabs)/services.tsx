import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBar } from "@/components/SearchBar";
import { ServiceCard } from "@/components/ServiceCard";
import { categories, services } from "@/data/mockData";
import { useColors } from "@/hooks/useColors";
import { Service } from "@/types";

export default function ServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = services.filter((s) => {
    const matchCategory = selectedCategory === "all" || s.categoryId === selectedCategory;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleServicePress = (service: Service) => {
    router.push(`/service/${service.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Services</Text>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            style={[
              styles.chip,
              { backgroundColor: selectedCategory === "all" ? colors.primary : colors.muted, borderColor: selectedCategory === "all" ? colors.primary : colors.border },
            ]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text style={[styles.chipText, { color: selectedCategory === "all" ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              All
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.chip,
                { backgroundColor: selectedCategory === cat.id ? colors.primary : colors.muted, borderColor: selectedCategory === cat.id ? colors.primary : colors.border },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.chipText, { color: selectedCategory === cat.id ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ServiceCard service={item} onPress={handleServicePress} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>No services found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingTop: 16, gap: 0 },
  title: { fontSize: 22, paddingHorizontal: 16, paddingBottom: 12 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  list: { paddingTop: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 14 },
});
