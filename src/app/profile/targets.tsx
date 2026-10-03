import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SecondaryButton } from "../../components/SecondaryButton";
import {
  Colors,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import { getHealthProfile } from "../../database/healthRepository";
import {
  applyHealthEstimateAsTarget,
  getNutritionTargetMetadata,
  saveUserNutritionTargets,
} from "../../database/nutritionTargetRepository";
import { getTargets } from "../../database/settingsRepository";
import { NutritionGoal } from "../../types/food";
import { HealthProfile } from "../../types/health";
import { NutritionTargetMetadata } from "../../types/nutritionTarget";
import { estimateDailyEnergyNeeds } from "../../utils/health";

const GOAL_OPTIONS: {
  value: NutritionGoal;
  title: string;
  description: string;
}[] = [
  {
    value: "general",
    title: "Maintain / General Nutrition",
    description: "Use your target as a flexible daily reference.",
  },
  {
    value: "consistency",
    title: "Improve Nutrition Consistency",
    description: "Focus on regular logging and patterns over time.",
  },
  {
    value: "custom",
    title: "Custom Target",
    description: "Set calories and macros to your own preferences.",
  },
];

export default function EditTargetsScreen() {
  const [calories, setCalories] = useState("2000");
  const [protein, setProtein] = useState("120");
  const [carbs, setCarbs] = useState("220");
  const [fat, setFat] = useState("65");
  const [goal, setGoal] = useState<NutritionGoal>("general");
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(
    null,
  );
  const [targetMetadata, setTargetMetadata] =
    useState<NutritionTargetMetadata | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [targets, profile, metadata] = await Promise.all([
          getTargets(),
          getHealthProfile(),
          getNutritionTargetMetadata(),
        ]);
        setCalories(String(targets.calorie_target));
        setProtein(String(targets.protein_target));
        setCarbs(String(targets.carbs_target));
        setFat(String(targets.fat_target));
        setHealthProfile(profile);
        setTargetMetadata(metadata);
        setGoal(metadata.goal);
      } catch {
        Alert.alert("Error", "Could not load your nutrition targets.");
      }
    }
    load();
  }, []);

  const energyEstimate = healthProfile
    ? estimateDailyEnergyNeeds(
        healthProfile.age,
        healthProfile.height_cm,
        healthProfile.weight_kg,
        healthProfile.sex_parameter,
        healthProfile.activity_level,
      )
    : null;

  const macroKcal =
    (Number(protein) || 0) * 4 +
    (Number(carbs) || 0) * 4 +
    (Number(fat) || 0) * 9;

  const handleSave = async () => {
    const calNum = Number(calories);
    const pNum = Number(protein);
    const cNum = Number(carbs);
    const fNum = Number(fat);

    if (isNaN(calNum) || calNum <= 0) {
      Alert.alert(
        "Invalid Calorie Target",
        "Please enter a valid positive number for calories.",
      );
      return;
    }
    if (
      [pNum, cNum, fNum].some((value) => !Number.isFinite(value) || value < 0)
    ) {
      Alert.alert(
        "Invalid Macro Target",
        "Enter valid non-negative macro targets.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveUserNutritionTargets(
        {
          calorie_target: Math.round(calNum),
          protein_target: Math.round(pNum),
          carbs_target: Math.round(cNum),
          fat_target: Math.round(fNum),
        },
        goal,
      );
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update daily targets.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseHealthEstimate = async () => {
    if (energyEstimate === null) return;
    setIsSaving(true);
    try {
      await applyHealthEstimateAsTarget(energyEstimate);
      router.back();
    } catch {
      Alert.alert("Error", "Could not apply the Health estimate.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerDescription}>
          Set your daily nutritional goals. These will guide your progress ring
          and macro targets on the dashboard.
        </Text>

        {energyEstimate !== null &&
        healthProfile?.age != null &&
        healthProfile.age >= 18 ? (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateLabel}>
              Estimated daily energy needs
            </Text>
            <Text style={styles.estimateValue}>
              ~{Math.round(energyEstimate).toLocaleString()} kcal/day
            </Text>
            <Text style={styles.estimateDescription}>
              This is a suggested starting point, not a medical recommendation.
              Review it before applying.
            </Text>
            <PrimaryButton
              title="Use Health Estimate"
              onPress={handleUseHealthEstimate}
              disabled={
                isSaving ||
                (targetMetadata?.source === "suggested" &&
                  Math.round(energyEstimate) === Number(calories))
              }
              variant="dark"
              style={styles.estimateButton}
            />
          </View>
        ) : healthProfile?.age != null && healthProfile.age < 18 ? (
          <View style={styles.adolescentNotice}>
            <Text style={styles.adolescentNoticeText}>
              For users under 18, keep goals focused on general nutrition
              tracking. Discuss individualized needs with a parent or guardian
              and a qualified healthcare professional.
            </Text>
          </View>
        ) : (
          <Text style={styles.missingEstimateText}>
            Complete your health profile to estimate your daily energy needs.
          </Text>
        )}

        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Nutrition goal</Text>
          <Text style={styles.sectionDescription}>
            Your goal changes how progress is framed; it does not prescribe
            weight change.
          </Text>
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: goal === option.value }}
              onPress={() => setGoal(option.value)}
              style={[
                styles.goalOption,
                goal === option.value && styles.goalOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.goalTitle,
                  goal === option.value && styles.goalTitleSelected,
                ]}
              >
                {option.title}
              </Text>
              <Text style={styles.goalDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calories Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Daily Calorie Goal</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.largeInput}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              placeholder="2000"
            />
            <Text style={styles.inputUnit}>kcal</Text>
          </View>
        </View>

        {/* Macro Targets Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Macronutrient Breakdown</Text>
          <Text style={styles.macroDescription}>
            Suggested macros use a simple 20% protein, 50% carbohydrate, and 30%
            fat energy split. This is only a starting point; adjust it to your
            preferences.
          </Text>

          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View
                style={[
                  styles.macroDot,
                  { backgroundColor: Colors.light.protein },
                ]}
              />
              <Text style={styles.macroName}>Protein</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
                placeholder="120"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View
                style={[
                  styles.macroDot,
                  { backgroundColor: Colors.light.carbs },
                ]}
              />
              <Text style={styles.macroName}>Carbohydrates</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
                placeholder="220"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View
                style={[styles.macroDot, { backgroundColor: Colors.light.fat }]}
              />
              <Text style={styles.macroName}>Fat</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
                placeholder="65"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>
        </View>

        {/* Calculation Helper info */}
        <View style={styles.calcNotice}>
          <Text style={styles.calcNoticeText}>
            Combined macro energy:{" "}
            <Text style={{ fontWeight: "700" }}>{macroKcal} kcal</Text> (
            {Math.round(((Number(protein) * 4) / (macroKcal || 1)) * 100)}%
            Protein,{" "}
            {Math.round(((Number(carbs) * 4) / (macroKcal || 1)) * 100)}% Carbs,{" "}
            {Math.round(((Number(fat) * 9) / (macroKcal || 1)) * 100)}% Fat)
          </Text>
        </View>

        <PrimaryButton
          title="Save Targets"
          onPress={handleSave}
          loading={isSaving}
          icon="checkmark"
          style={styles.saveButton}
        />

        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  headerDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  estimateCard: {
    backgroundColor: Colors.light.primaryMuted,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.primaryLight,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  estimateLabel: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  estimateValue: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.xs,
  },
  estimateDescription: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  estimateButton: {
    marginTop: Spacing.md,
  },
  adolescentNotice: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  adolescentNoticeText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  missingEstimateText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  goalSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  goalOption: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: Colors.light.surface,
  },
  goalOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  goalTitle: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  goalTitleSelected: {
    color: Colors.light.primaryDark,
  },
  goalDescription: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: 3,
  },
  macroDescription: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  largeInput: {
    flex: 1,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  inputUnit: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textMuted,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  macroTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textPrimary,
  },
  smallInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    width: 90,
  },
  smallInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
    textAlign: "right",
    paddingRight: 4,
  },
  smallUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  calcNotice: {
    backgroundColor: Colors.light.primaryMuted,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.xl,
  },
  calcNoticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.primaryDark,
    lineHeight: 18,
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
  cancelButton: {},
});
