import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../../components/PrimaryButton";
import { TrendBarChart, TrendBarDatum } from "../../components/TrendBarChart";
import {
  Colors,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import {
  getHealthMeasurements,
  getHealthProfile,
  getRecentNutritionDays,
  saveHealthProfile,
} from "../../database/healthRepository";
import { getSetting, setSetting } from "../../database/settingsRepository";
import {
  ActivityLevel,
  EnergySexParameter,
  HealthMeasurement,
  HealthProfile,
  HealthProfileInput,
  NutritionDay,
} from "../../types/health";
import {
  calculateBmi,
  estimateDailyEnergyNeeds,
  formatHeight,
  formatUpdatedDate,
  formatWeight,
  getAdultBmiCategory,
  heightFromCentimeters,
  heightToCentimeters,
  weightFromKilograms,
  weightToKilograms,
} from "../../utils/health";

type UnitSystem = "metric" | "imperial";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly active" },
  { value: "moderate", label: "Moderately active" },
  { value: "high", label: "Very active" },
  { value: "very_high", label: "Extra active" },
];

const ACTIVITY_LABELS = Object.fromEntries(
  ACTIVITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ActivityLevel, string>;

interface SectionCardProps {
  title: string;
  detail?: string;
  children: React.ReactNode;
}

function SectionCard({ title, detail, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeading}>
        <Text style={styles.cardTitle}>{title}</Text>
        {detail ? <Text style={styles.cardDetail}>{detail}</Text> : null}
      </View>
      {children}
    </View>
  );
}

interface ProfileStatProps {
  label: string;
  value: string;
}

function ProfileStat({ label, value }: ProfileStatProps) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface ChoiceProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function Choice({ label, selected, onPress }: ChoiceProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
  });
}

function getMeasurementLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toHealthProfileInput(
  ageText: string,
  heightText: string,
  weightText: string,
  units: UnitSystem,
  sexParameter: EnergySexParameter | null,
  activityLevel: ActivityLevel | null,
): HealthProfileInput | null {
  const age = parseOptionalNumber(ageText);
  const enteredHeight = parseOptionalNumber(heightText);
  const enteredWeight = parseOptionalNumber(weightText);

  if (
    ageText.trim() &&
    (age === null || !Number.isInteger(age) || age < 1 || age > 120)
  ) {
    Alert.alert("Check age", "Enter an age from 1 to 120, or leave it blank.");
    return null;
  }
  if (heightText.trim() && (enteredHeight === null || enteredHeight <= 0)) {
    Alert.alert("Check height", "Enter a positive height, or leave it blank.");
    return null;
  }
  if (weightText.trim() && (enteredWeight === null || enteredWeight <= 0)) {
    Alert.alert("Check weight", "Enter a positive weight, or leave it blank.");
    return null;
  }

  return {
    age,
    height_cm:
      enteredHeight === null ? null : heightToCentimeters(enteredHeight, units),
    weight_kg:
      enteredWeight === null ? null : weightToKilograms(enteredWeight, units),
    sex_parameter: sexParameter,
    activity_level: activityLevel,
  };
}

interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
}

function getMacroTotals(days: NutritionDay[]): MacroTotals {
  return days.reduce(
    (totals, day) => ({
      protein: totals.protein + day.protein,
      carbs: totals.carbs + day.carbs,
      fat: totals.fat + day.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );
}

export default function HealthScreen() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [nutritionDays, setNutritionDays] = useState<NutritionDay[]>([]);
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ageText, setAgeText] = useState("");
  const [heightText, setHeightText] = useState("");
  const [weightText, setWeightText] = useState("");
  const [sexParameter, setSexParameter] = useState<EnergySexParameter | null>(
    null,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    null,
  );

  const loadDashboard = useCallback(async () => {
    try {
      const [savedProfile, savedMeasurements, savedNutrition, savedUnits] =
        await Promise.all([
          getHealthProfile(),
          getHealthMeasurements(),
          getRecentNutritionDays(),
          getSetting("units", "metric"),
        ]);
      setProfile(savedProfile);
      setMeasurements(savedMeasurements);
      setNutritionDays(savedNutrition);
      setUnits(savedUnits === "imperial" ? "imperial" : "metric");
    } catch (error) {
      console.warn("Failed to load health dashboard:", error);
      Alert.alert(
        "Health data unavailable",
        "Could not load your saved health information.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const startEditing = () => {
    setAgeText(
      profile?.age === null || profile?.age === undefined
        ? ""
        : String(profile.age),
    );
    setHeightText(
      profile?.height_cm == null
        ? ""
        : heightFromCentimeters(profile.height_cm, units).toFixed(1),
    );
    setWeightText(
      profile?.weight_kg == null
        ? ""
        : weightFromKilograms(profile.weight_kg, units).toFixed(1),
    );
    setSexParameter(profile?.sex_parameter ?? null);
    setActivityLevel(profile?.activity_level ?? null);
    setIsEditing(true);
  };

  const handleUnitsChange = async (nextUnits: UnitSystem) => {
    if (nextUnits === units) return;
    try {
      await setSetting("units", nextUnits);
      if (isEditing) {
        const heightValue = parseOptionalNumber(heightText);
        const weightValue = parseOptionalNumber(weightText);
        setHeightText(
          heightValue === null
            ? heightText
            : heightFromCentimeters(
                heightToCentimeters(heightValue, units),
                nextUnits,
              ).toFixed(1),
        );
        setWeightText(
          weightValue === null
            ? weightText
            : weightFromKilograms(
                weightToKilograms(weightValue, units),
                nextUnits,
              ).toFixed(1),
        );
      }
      setUnits(nextUnits);
    } catch (error) {
      console.warn("Failed to save measurement units:", error);
      Alert.alert("Could not update units", "Please try again.");
    }
  };

  const handleSave = async () => {
    const input = toHealthProfileInput(
      ageText,
      heightText,
      weightText,
      units,
      sexParameter,
      activityLevel,
    );
    if (!input) return;

    setIsSaving(true);
    try {
      const savedProfile = await saveHealthProfile(input);
      const savedMeasurements = await getHealthMeasurements();
      setProfile(savedProfile);
      setMeasurements(savedMeasurements);
      setIsEditing(false);
    } catch (error) {
      console.warn("Failed to save health profile:", error);
      Alert.alert(
        "Save failed",
        "Your health profile could not be saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const bmi = calculateBmi(
    profile?.height_cm ?? null,
    profile?.weight_kg ?? null,
  );
  const bmiCategory =
    bmi === null ? null : getAdultBmiCategory(bmi, profile?.age ?? null);
  const energyEstimate = estimateDailyEnergyNeeds(
    profile?.age ?? null,
    profile?.height_cm ?? null,
    profile?.weight_kg ?? null,
    profile?.sex_parameter ?? null,
    profile?.activity_level ?? null,
  );
  const weightHistory = measurements
    .filter((measurement) => measurement.weight_kg > 0)
    .slice(-7);
  const weightChartData: TrendBarDatum[] = weightHistory.map((measurement) => ({
    id: String(measurement.id),
    label: getMeasurementLabel(measurement.recorded_at),
    value: weightFromKilograms(measurement.weight_kg, units),
  }));
  const calorieChartData: TrendBarDatum[] = nutritionDays.map((day) => ({
    id: day.date,
    label: getDateLabel(day.date),
    value: Math.round(day.calories),
  }));
  const macroTotals = getMacroTotals(nutritionDays);
  const macroTotal = macroTotals.protein + macroTotals.carbs + macroTotals.fat;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="heart-outline"
              size={22}
              color={Colors.light.primaryDark}
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Health</Text>
            <Text style={styles.subtitle}>
              Your measurements, stored on this device
            </Text>
          </View>
        </View>

        <SectionCard title="Health profile" detail="Recorded">
          <View style={styles.statsGrid}>
            <ProfileStat
              label="Height"
              value={
                profile?.height_cm == null
                  ? "Not recorded"
                  : formatHeight(profile.height_cm, units)
              }
            />
            <ProfileStat
              label="Weight"
              value={
                profile?.weight_kg == null
                  ? "Not recorded"
                  : formatWeight(profile.weight_kg, units)
              }
            />
            <ProfileStat
              label="Age"
              value={
                profile?.age == null ? "Not recorded" : `${profile.age} years`
              }
            />
            <ProfileStat
              label="Activity"
              value={
                profile?.activity_level
                  ? ACTIVITY_LABELS[profile.activity_level]
                  : "Not set"
              }
            />
          </View>
          {profile?.updated_at ? (
            <Text style={styles.updatedAt}>
              Last updated {formatUpdatedDate(profile.updated_at)}
            </Text>
          ) : (
            <Text style={styles.updatedAt}>No profile saved yet</Text>
          )}
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Ionicons
              name="create-outline"
              size={18}
              color={Colors.light.primaryDark}
            />
            <Text style={styles.editButtonText}>
              {profile ? "Edit health profile" : "Add health information"}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Measurement units">
          <View style={styles.unitChoices}>
            <Choice
              label="Metric (cm, kg)"
              selected={units === "metric"}
              onPress={() => void handleUnitsChange("metric")}
            />
            <Choice
              label="Imperial (in, lb)"
              selected={units === "imperial"}
              onPress={() => void handleUnitsChange("imperial")}
            />
          </View>
        </SectionCard>

        {isEditing && (
          <SectionCard
            title="Update measurements"
            detail="Optional fields can be left blank"
          >
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  accessibilityLabel="Age in years"
                  style={styles.input}
                  value={ageText}
                  onChangeText={setAgeText}
                  keyboardType="number-pad"
                  placeholder="Years"
                  placeholderTextColor={Colors.light.textMuted}
                  maxLength={3}
                />
              </View>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>
                  Height ({units === "metric" ? "cm" : "in"})
                </Text>
                <TextInput
                  accessibilityLabel={`Height in ${units === "metric" ? "centimeters" : "inches"}`}
                  style={styles.input}
                  value={heightText}
                  onChangeText={setHeightText}
                  keyboardType="decimal-pad"
                  placeholder={units === "metric" ? "e.g. 175" : "e.g. 69"}
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
                <Text style={styles.inputLabel}>
                  Weight ({units === "metric" ? "kg" : "lb"})
                </Text>
                <TextInput
                  accessibilityLabel={`Weight in ${units === "metric" ? "kilograms" : "pounds"}`}
                  style={styles.input}
                  value={weightText}
                  onChangeText={setWeightText}
                  keyboardType="decimal-pad"
                  placeholder={units === "metric" ? "e.g. 65" : "e.g. 143"}
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
              <View style={styles.inputColumn} />
            </View>

            <Text style={styles.inputLabel}>
              Sex parameter for energy estimate
            </Text>
            <Text style={styles.helperText}>
              Optional. Used only by the estimation formula.
            </Text>
            <View style={styles.unitChoices}>
              <Choice
                label="Female"
                selected={sexParameter === "female"}
                onPress={() => setSexParameter("female")}
              />
              <Choice
                label="Male"
                selected={sexParameter === "male"}
                onPress={() => setSexParameter("male")}
              />
              <Choice
                label="Not set"
                selected={sexParameter === null}
                onPress={() => setSexParameter(null)}
              />
            </View>

            <Text style={[styles.inputLabel, styles.activityHeading]}>
              Activity level
            </Text>
            <View style={styles.activityOptions}>
              <Choice
                label="Not set"
                selected={activityLevel === null}
                onPress={() => setActivityLevel(null)}
              />
              {ACTIVITY_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  selected={activityLevel === option.value}
                  onPress={() => setActivityLevel(option.value)}
                />
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <PrimaryButton
                title="Save profile"
                onPress={handleSave}
                loading={isSaving}
                icon="checkmark"
                style={styles.saveButton}
              />
            </View>
          </SectionCard>
        )}

        <SectionCard title="BMI" detail="Calculated">
          {bmi === null ? (
            <Text style={styles.emptyText}>
              Add your height and weight to calculate BMI.
            </Text>
          ) : (
            <>
              <Text style={styles.primaryMetric}>{bmi.toFixed(1)}</Text>
              {bmiCategory ? (
                <Text style={styles.metricCaption}>
                  {bmiCategory} (adult range)
                </Text>
              ) : (
                <Text style={styles.metricCaption}>
                  Standard BMI categories apply to adults age 20 and over.
                </Text>
              )}
            </>
          )}
          <Text style={styles.disclaimer}>
            BMI is a general screening measure, does not directly measure body
            composition, and is not a diagnosis.
          </Text>
        </SectionCard>

        <SectionCard title="Estimated daily energy needs" detail="ESTIMATE">
          {energyEstimate === null ? (
            <Text style={styles.emptyText}>
              {profile?.age != null && profile.age < 18
                ? "This estimate is intended for adults age 18 and over."
                : "Complete your health profile to estimate your daily energy needs."}
            </Text>
          ) : (
            <>
              <Text style={styles.primaryMetric}>
                ~{Math.round(energyEstimate).toLocaleString()} kcal/day
              </Text>
              <Text style={styles.metricCaption}>
                Based on your current profile and activity level.
              </Text>
            </>
          )}
          <Text style={styles.disclaimer}>
            This is an estimate, not a precise measurement or medical
            recommendation.
          </Text>
        </SectionCard>

        <SectionCard
          title="Weight trend"
          detail={units === "metric" ? "kg" : "lb"}
        >
          {weightChartData.length < 2 ? (
            <Text style={styles.emptyText}>
              Keep updating your measurements to build your health history.
            </Text>
          ) : (
            <TrendBarChart
              data={weightChartData}
              color={Colors.light.primary}
              formatValue={(value) => value.toFixed(1)}
              scaleFromMinimum
            />
          )}
        </SectionCard>

        <SectionCard title="Daily calorie intake" detail="Last 7 days">
          {nutritionDays.every((day) => day.entries === 0) ? (
            <Text style={styles.emptyText}>
              Log some meals to see your nutrition trends.
            </Text>
          ) : (
            <TrendBarChart
              data={calorieChartData}
              color={Colors.light.calories}
              formatValue={(value) => String(value)}
            />
          )}
        </SectionCard>

        <SectionCard title="Macronutrients" detail="Last 7 days - grams">
          {macroTotal === 0 ? (
            <Text style={styles.emptyText}>
              Log some meals to see your nutrition trends.
            </Text>
          ) : (
            <>
              <View style={styles.macroBar}>
                {macroTotals.protein > 0 && (
                  <View
                    style={[
                      styles.macroSegment,
                      {
                        flex: macroTotals.protein,
                        backgroundColor: Colors.light.protein,
                      },
                    ]}
                  />
                )}
                {macroTotals.carbs > 0 && (
                  <View
                    style={[
                      styles.macroSegment,
                      {
                        flex: macroTotals.carbs,
                        backgroundColor: Colors.light.carbs,
                      },
                    ]}
                  />
                )}
                {macroTotals.fat > 0 && (
                  <View
                    style={[
                      styles.macroSegment,
                      {
                        flex: macroTotals.fat,
                        backgroundColor: Colors.light.fat,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.macroLegend}>
                <Text style={styles.macroLegendText}>
                  <Text style={{ color: Colors.light.protein }}>● </Text>
                  Protein {Math.round(macroTotals.protein)}g
                </Text>
                <Text style={styles.macroLegendText}>
                  <Text style={{ color: Colors.light.carbs }}>● </Text>
                  Carbs {Math.round(macroTotals.carbs)}g
                </Text>
                <Text style={styles.macroLegendText}>
                  <Text style={{ color: Colors.light.fat }}>● </Text>
                  Fat {Math.round(macroTotals.fat)}g
                </Text>
              </View>
              <Text style={styles.metricCaption}>
                Totals from diary entries recorded in the last 7 days.
              </Text>
            </>
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primaryMuted,
    marginRight: Spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitle: {
    flex: 1,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  cardDetail: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginLeft: Spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing.md,
  },
  profileStat: {
    width: "50%",
    paddingRight: Spacing.sm,
  },
  statLabel: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    marginBottom: 3,
  },
  statValue: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  updatedAt: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.lg,
  },
  editButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  editButtonText: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  unitChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  choice: {
    minHeight: 42,
    flexGrow: 1,
    flexBasis: "30%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  choiceSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  choiceText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    textAlign: "center",
  },
  choiceTextSelected: {
    color: Colors.light.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surface,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
  },
  helperText: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  activityHeading: {
    marginTop: Spacing.lg,
  },
  activityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    minHeight: 48,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  saveButton: {
    flex: 1,
  },
  primaryMetric: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extrabold,
  },
  metricCaption: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  disclaimer: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 21,
  },
  macroBar: {
    height: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: Radii.full,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  macroSegment: {
    minWidth: 2,
  },
  macroLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  macroLegendText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
  },
});
