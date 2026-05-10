import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { providers, timeSlots } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useService } from "@/hooks/useAppData";
import { useBookings } from "@/hooks/useBookings";
import { useColors } from "@/hooks/useColors";
import { Booking } from "@/types";

const STEPS = ["Date & Time", "Address", "Confirm"] as const;
type Step = 0 | 1 | 2;

function getNextDates() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
      value: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    };
  });
}

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: service, isLoading: serviceLoading } = useService(serviceId);
  const { createBooking } = useBookings(user?.id);

  const assignedProvider = providers[0];
  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const dates = getNextDates();

  const canProceed =
    step === 0 ? selectedDate !== "" && selectedTime !== ""
    : step === 1 ? address.trim().length > 5
    : true;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((step + 1) as Step);
  };

  const handleConfirm = async () => {
    if (!service || !user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newBooking: Booking = {
      id: "BK" + Date.now(),
      serviceId: service.id,
      serviceName: service.name,
      categoryName: service.categoryName,
      providerId: assignedProvider.id,
      providerName: assignedProvider.name,
      date: selectedDate,
      time: selectedTime,
      address: address.trim(),
      status: "upcoming",
      totalPrice: service.price,
      createdAt: new Date().toISOString(),
    };

    try {
      await createBooking.mutateAsync({ booking: newBooking, userId: user.id });
      Alert.alert(
        "Booking Confirmed!",
        `Your ${service.name} is booked for ${selectedDate} at ${selectedTime}.`,
        [{ text: "View Bookings", onPress: () => router.replace("/(tabs)/bookings") }]
      );
    } catch {
      Alert.alert("Error", "Failed to confirm booking. Please try again.");
    }
  };

  if (serviceLoading || !service) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => (step > 0 ? setStep((step - 1) as Step) : router.back())} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>Book Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      <View style={[styles.stepsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: i <= step ? colors.primary : colors.muted, borderColor: i <= step ? colors.primary : colors.border }]}>
              {i < step
                ? <Feather name="check" size={12} color="#FFFFFF" />
                : <Text style={[styles.stepNum, { color: i === step ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, { color: i <= step ? colors.primary : colors.mutedForeground, fontFamily: i === step ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
              {s}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {dates.map((d) => (
                <Pressable
                  key={d.value}
                  style={[styles.chip, { borderColor: selectedDate === d.value ? colors.primary : colors.border, backgroundColor: selectedDate === d.value ? colors.secondary : colors.card }]}
                  onPress={() => setSelectedDate(d.value)}
                >
                  <Text style={[styles.chipText, { color: selectedDate === d.value ? colors.primary : colors.text, fontFamily: selectedDate === d.value ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold", marginTop: 8 }]}>Select Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.timeChip, { borderColor: selectedTime === t ? colors.primary : colors.border, backgroundColor: selectedTime === t ? colors.primary : colors.card }]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[styles.timeChipText, { color: selectedTime === t ? "#FFF" : colors.text, fontFamily: "Inter_500Medium" }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Service Address</Text>
            <Text style={[styles.stepSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Where should the professional come?
            </Text>
            <TextInput
              style={[styles.addressInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Inter_400Regular" }]}
              placeholder="Flat no, building name, street, area, city..."
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>Booking Summary</Text>
            {[
              { icon: "package", label: "Service", value: service.name },
              { icon: "user", label: "Professional", value: assignedProvider.name },
              { icon: "calendar", label: "Date", value: selectedDate },
              { icon: "clock", label: "Time", value: selectedTime },
              { icon: "map-pin", label: "Address", value: address },
            ].map((row) => (
              <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={row.icon as never} size={16} color={colors.primary} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: colors.text, fontFamily: "Inter_500Medium" }]}>{row.value}</Text>
                </View>
              </View>
            ))}
            <View style={[styles.totalRow, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
              <Text style={[styles.totalLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Total Amount</Text>
              <Text style={[styles.totalValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>₹{service.price}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: canProceed ? colors.primary : colors.muted, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={step < 2 ? handleNext : handleConfirm}
          disabled={!canProceed || createBooking.isPending}
        >
          {createBooking.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={[styles.nextBtnText, { color: canProceed ? "#FFF" : colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                {step < 2 ? "Next" : "Confirm Booking"}
              </Text>
              <Feather name={step < 2 ? "arrow-right" : "check"} size={18} color={canProceed ? "#FFF" : colors.mutedForeground} />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, textAlign: "center" },
  headerSpacer: { width: 30 },
  stepsBar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, borderBottomWidth: 1 },
  stepItem: { alignItems: "center", gap: 5 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 12 },
  stepLabel: { fontSize: 11 },
  content: { padding: 16 },
  stepContent: { gap: 14 },
  stepTitle: { fontSize: 18 },
  stepSubtitle: { fontSize: 14, marginTop: -6 },
  row: { gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  chipText: { fontSize: 13 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  timeChipText: { fontSize: 13 },
  addressInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 120 },
  summaryRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryInfo: { flex: 1, gap: 2 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", padding: 16, marginTop: 8 },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 22 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: { borderRadius: 12, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontSize: 16 },
});
