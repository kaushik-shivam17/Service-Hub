import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Category } from "@/types";

interface Props {
  category: Category;
  onPress: (category: Category) => void;
}

export function CategoryCard({ category, onPress }: Props) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(category);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.8 : 1 }]}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
        <Feather name={category.icon as any} size={26} color={category.color} />
      </View>
      <Text style={[styles.name, { color: colors.text, fontFamily: "Inter_500Medium" }]} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 76,
    gap: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
