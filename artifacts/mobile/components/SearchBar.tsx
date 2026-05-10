import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  editable?: boolean;
}

export function SearchBar({ value, onChangeText, onPress, placeholder = "Search for services...", editable = true }: Props) {
  const colors = useColors();

  const content = (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={18} color={colors.mutedForeground} />
      {editable ? (
        <TextInput
          style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
        />
      ) : (
        <Text style={[styles.placeholder, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {placeholder}
        </Text>
      )}
    </View>
  );

  if (!editable && onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  input: { flex: 1, fontSize: 14, padding: 0 },
  placeholder: { flex: 1, fontSize: 14 },
});
