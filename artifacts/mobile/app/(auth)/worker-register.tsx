import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const SPECIALIZATIONS = [
  "Cleaning",
  "AC Service",
  "Plumbing",
  "Electrician",
  "Appliances",
  "Pest Control",
  "Painting",
  "Carpentry",
];

const EXPERIENCE_OPTIONS = [
  { label: "< 1 year", value: 0 },
  { label: "1–2 years", value: 1 },
  { label: "3–5 years", value: 3 },
  { label: "6–10 years", value: 6 },
  { label: "10+ years", value: 10 },
];

type Step = 1 | 2;

export default function WorkerRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUpAsWorker } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 fields
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState(1);
  const [pricePerHour, setPricePerHour] = useState("350");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const validateStep1 = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return "Full name must be at least 2 characters";
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords don't match";
    return null;
  };

  const handleNextStep = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleRegister = async () => {
    if (selectedSpecs.length === 0) {
      setError("Please select at least one specialization");
      return;
    }
    const price = parseInt(pricePerHour, 10);
    if (isNaN(price) || price < 50 || price > 10000) {
      setError("Price per hour must be between ₹50 and ₹10,000");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUpAsWorker({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        specializations: selectedSpecs,
        experienceYears,
        pricePerHour: price,
      });
      router.replace("/(tabs)/worker");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progressPct = step === 1 ? "50%" : "100%";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={["#064E3B", "#059669", "#10B981"]}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <Pressable style={styles.backBtn} onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.iconCircle}>
              <Feather name="briefcase" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>Join as a Professional</Text>
            <Text style={[styles.heroSubtitle, { fontFamily: "Inter_400Regular" }]}>
              {step === 1 ? "Create your professional account" : "Set up your service profile"}
            </Text>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressPct }]} />
            </View>
            <Text style={[styles.stepText, { fontFamily: "Inter_400Regular" }]}>
              Step {step} of 2
            </Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.card }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="alert-circle" size={14} color="#DC2626" />
              <Text style={[styles.errorText, { color: "#DC2626", fontFamily: "Inter_400Regular" }]}>{error}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <Step1Form
              colors={colors}
              name={name} setName={setName}
              email={email} setEmail={setEmail}
              phone={phone} setPhone={setPhone}
              password={password} setPassword={setPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
            />
          ) : (
            <Step2Form
              colors={colors}
              selectedSpecs={selectedSpecs}
              toggleSpec={toggleSpec}
              experienceYears={experienceYears}
              setExperienceYears={setExperienceYears}
              pricePerHour={pricePerHour}
              setPricePerHour={setPricePerHour}
            />
          )}

          {step === 1 ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: "#059669", opacity: pressed ? 0.85 : 1 }]}
              onPress={handleNextStep}
            >
              <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: "#059669", opacity: pressed || loading ? 0.85 : 1 },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={[styles.primaryBtnText, { fontFamily: "Inter_700Bold" }]}>Create Worker Account</Text>
                </>
              )}
            </Pressable>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={[styles.footerLink, { color: "#059669", fontFamily: "Inter_600SemiBold" }]}>Sign In</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingBottom: insets.bottom + 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  keyboard = "default",
  secure = false,
  rightEl,
  colors,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: "default" | "email-address" | "phone-pad" | "numeric";
  secure?: boolean;
  rightEl?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Feather name={icon as any} size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          autoCapitalize={keyboard === "default" ? "words" : "none"}
          secureTextEntry={secure}
        />
        {rightEl}
      </View>
    </View>
  );
}

function Step1Form({
  colors, name, setName, email, setEmail, phone, setPhone,
  password, setPassword, confirmPassword, setConfirmPassword,
  showPassword, setShowPassword,
}: {
  colors: ReturnType<typeof useColors>;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
}) {
  return (
    <View style={styles.fields}>
      <Field label="Full Name *" icon="user" value={name} onChange={setName} placeholder="Rajesh Kumar" colors={colors} />
      <Field label="Email *" icon="mail" value={email} onChange={setEmail} placeholder="you@example.com" keyboard="email-address" colors={colors} />
      <Field label="Phone" icon="phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" keyboard="phone-pad" colors={colors} />
      <Field
        label="Password *"
        icon="lock"
        value={password}
        onChange={setPassword}
        placeholder="Min. 6 characters"
        secure={!showPassword}
        colors={colors}
        rightEl={
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
          </Pressable>
        }
      />
      <Field
        label="Confirm Password *"
        icon="lock"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Repeat your password"
        secure={!showPassword}
        colors={colors}
      />
    </View>
  );
}

function Step2Form({
  colors, selectedSpecs, toggleSpec,
  experienceYears, setExperienceYears,
  pricePerHour, setPricePerHour,
}: {
  colors: ReturnType<typeof useColors>;
  selectedSpecs: string[];
  toggleSpec: (s: string) => void;
  experienceYears: number;
  setExperienceYears: (v: number) => void;
  pricePerHour: string;
  setPricePerHour: (v: string) => void;
}) {
  return (
    <View style={styles.fields}>
      {/* Specializations */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Specializations * <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>(select all that apply)</Text>
        </Text>
        <View style={styles.specGrid}>
          {SPECIALIZATIONS.map((spec) => {
            const selected = selectedSpecs.includes(spec);
            return (
              <Pressable
                key={spec}
                style={({ pressed }) => [
                  styles.specChip,
                  {
                    backgroundColor: selected ? "#059669" : colors.background,
                    borderColor: selected ? "#059669" : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => toggleSpec(spec)}
              >
                <Text
                  style={[
                    styles.specChipText,
                    { color: selected ? "#FFFFFF" : colors.text, fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular" },
                  ]}
                >
                  {spec}
                </Text>
                {selected && <Feather name="check" size={12} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Experience */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Years of Experience *</Text>
        <View style={styles.experienceRow}>
          {EXPERIENCE_OPTIONS.map((opt) => {
            const selected = experienceYears === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.expChip,
                  {
                    backgroundColor: selected ? "#059669" : colors.background,
                    borderColor: selected ? "#059669" : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => setExperienceYears(opt.value)}
              >
                <Text
                  style={[
                    styles.expChipText,
                    { color: selected ? "#FFFFFF" : colors.text, fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular" },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Price per hour */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Price per Hour (₹) *
        </Text>
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.rupeeSymbol, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>₹</Text>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: "Inter_400Regular" }]}
            placeholder="350"
            placeholderTextColor={colors.mutedForeground}
            value={pricePerHour}
            onChangeText={setPricePerHour}
            keyboardType="numeric"
          />
          <Text style={[styles.perHour, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>/hr</Text>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Min ₹50 · Max ₹10,000
        </Text>
      </View>

      {/* Preview card */}
      {selectedSpecs.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }]}>
          <View style={styles.previewHeader}>
            <Feather name="user-check" size={16} color="#059669" />
            <Text style={[styles.previewTitle, { color: "#065F46", fontFamily: "Inter_600SemiBold" }]}>Profile Preview</Text>
          </View>
          <Text style={[styles.previewSpec, { color: "#059669", fontFamily: "Inter_400Regular" }]}>
            {selectedSpecs.join(" · ")}
          </Text>
          <Text style={[styles.previewDetail, { color: "#065F46", fontFamily: "Inter_400Regular" }]}>
            {EXPERIENCE_OPTIONS.find(o => o.value === experienceYears)?.label ?? ""} experience · ₹{pricePerHour}/hr
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  heroContent: { alignItems: "center", gap: 8, marginBottom: 20 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontSize: 24, color: "#FFFFFF", textAlign: "center" },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  stepIndicator: { alignItems: "center", gap: 8 },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 2 },
  stepText: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  form: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
    gap: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13, flex: 1 },
  fields: { gap: 14 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  rupeeSymbol: { fontSize: 16 },
  perHour: { fontSize: 13 },
  hint: { fontSize: 11, marginTop: 2 },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  specChipText: { fontSize: 13 },
  experienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  expChipText: { fontSize: 13 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  previewTitle: { fontSize: 13 },
  previewSpec: { fontSize: 13 },
  previewDetail: { fontSize: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 4,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
});
