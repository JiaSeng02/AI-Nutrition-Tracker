import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
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
  syncHealthEnergyEstimate,
} from "../../database/nutritionTargetRepository";
import {
  clearAllData,
  exportAllData,
  getSetting,
  getTargets,
  setSetting,
} from "../../database/settingsRepository";
import { DailyTargets } from "../../types/food";
import { HealthProfile } from "../../types/health";
import { NutritionTargetMetadata } from "../../types/nutritionTarget";
import { estimateDailyEnergyNeeds } from "../../utils/health";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("User");
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(
    null,
  );
  const [targetMetadata, setTargetMetadata] =
    useState<NutritionTargetMetadata | null>(null);
  const [units, setUnits] = useState("metric");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const savedHealthProfile = await getHealthProfile();
      const healthEstimate = savedHealthProfile
        ? estimateDailyEnergyNeeds(
            savedHealthProfile.age,
            savedHealthProfile.height_cm,
            savedHealthProfile.weight_kg,
            savedHealthProfile.sex_parameter,
            savedHealthProfile.activity_level,
          )
        : null;
      await syncHealthEnergyEstimate(healthEstimate);
      const [currentTargets, name, unitSetting, currentMetadata] =
        await Promise.all([
          getTargets(),
          getSetting("user_name", "User"),
          getSetting("units", "metric"),
          getNutritionTargetMetadata(),
        ]);
      setTargets(currentTargets);
      setHealthProfile(savedHealthProfile);
      setTargetMetadata(currentMetadata);
      setUserName(name || "User");
      setUnits(unitSetting || "metric");
    } catch (err) {
      console.warn("Failed to load profile data:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    await setSetting("user_name", tempName.trim());
    setUserName(tempName.trim());
    setIsEditingName(false);
  };

  const handleToggleUnits = async (selectedUnit: "metric" | "imperial") => {
    setUnits(selectedUnit);
    await setSetting("units", selectedUnit);
  };

  const handleUseHealthEstimate = async () => {
    const estimatedCalories = healthProfile
      ? estimateDailyEnergyNeeds(
          healthProfile.age,
          healthProfile.height_cm,
          healthProfile.weight_kg,
          healthProfile.sex_parameter,
          healthProfile.activity_level,
        )
      : null;
    if (estimatedCalories === null) return;

    try {
      await applyHealthEstimateAsTarget(estimatedCalories);
      await loadProfile();
    } catch (error) {
      console.warn("Failed to use Health estimate:", error);
      Alert.alert("Could not update target", "Please try again.");
    }
  };

  const energyEstimate = healthProfile
    ? estimateDailyEnergyNeeds(
        healthProfile.age,
        healthProfile.height_cm,
        healthProfile.weight_kg,
        healthProfile.sex_parameter,
        healthProfile.activity_level,
      )
    : null;
  const nutritionGoalLabel = {
    general: "Maintain / General Nutrition",
    consistency: "Improve Nutrition Consistency",
    custom: "Custom Target",
  }[targetMetadata?.goal ?? "general"];

  const handleClearAllData = async () => {
    setShowClearConfirm(false);
    try {
      await clearAllData();
      await loadProfile();
      Alert.alert(
        "Data Cleared",
        "Food records, health information, and settings have been reset.",
      );
    } catch {
      Alert.alert("Error", "Failed to clear data.");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      setExportedJson(data);

      try {
        await Share.share({
          title: "Nutrition Tracker Data Backup",
          message: data,
        });
      } catch {
        // Fallback: the modal will display the exported JSON
      }
    } catch {
      Alert.alert("Export Failed", "Could not export database records.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {userName.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName}</Text>
              <TouchableOpacity
                onPress={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={Colors.light.primary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.badgeRow}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={Colors.light.primary}
              />
              <Text style={styles.badgeText}>Local On-Device Storage</Text>
            </View>
          </View>
        </View>

        {/* Nutrition Targets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Nutrition Targets</Text>
            <TouchableOpacity onPress={() => router.push("/profile/targets")}>
              <Text style={styles.editActionText}>Edit Targets</Text>
            </TouchableOpacity>
          </View>

          {targets && (
            <View style={styles.targetsCard}>
              <View style={styles.targetMainRow}>
                <View>
                  <Text style={styles.targetLabel}>Current target</Text>
                  <Text style={styles.targetValue}>
                    {targets.calorie_target.toLocaleString()}{" "}
                    <Text style={styles.targetUnit}>kcal</Text>
                  </Text>
                </View>
                <View style={styles.targetPill}>
                  <Ionicons
                    name="flame"
                    size={16}
                    color={Colors.light.calories}
                  />
                  <Text style={styles.targetPillText}>
                    {targetMetadata?.source === "custom"
                      ? "Custom target"
                      : targetMetadata?.source === "suggested"
                        ? "Health estimate"
                        : "Starting target"}
                  </Text>
                </View>
              </View>

              <Text style={styles.goalLabel}>{nutritionGoalLabel}</Text>

              {energyEstimate !== null &&
                healthProfile?.age != null &&
                healthProfile.age >= 18 && (
                  <View style={styles.estimatePanel}>
                    <Text style={styles.estimateLabel}>
                      Estimated daily energy needs
                    </Text>
                    <Text style={styles.estimateValue}>
                      ~{Math.round(energyEstimate).toLocaleString()} kcal/day
                    </Text>
                    <Text style={styles.targetLabel}>
                      Suggested starting point, not a medical recommendation.
                    </Text>
                    {targetMetadata?.suggestionPending && (
                      <Text style={styles.suggestionNotice}>
                        Your Health estimate changed. Review the suggested
                        target before applying it.
                      </Text>
                    )}
                    {(Math.round(energyEstimate) !== targets.calorie_target ||
                      targetMetadata?.suggestionPending) && (
                      <TouchableOpacity
                        style={styles.useEstimateButton}
                        onPress={() => void handleUseHealthEstimate()}
                      >
                        <Text style={styles.useEstimateText}>
                          Use Health Estimate
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

              <View style={styles.divider} />

              <View style={styles.targetMacrosRow}>
                <View style={styles.targetMacroCol}>
                  <Text
                    style={[
                      styles.targetMacroDot,
                      { color: Colors.light.protein },
                    ]}
                  >
                    ●
                  </Text>
                  <Text style={styles.targetMacroLabel}>Protein</Text>
                  <Text style={styles.targetMacroAmount}>
                    {targets.protein_target}g
                  </Text>
                </View>

                <View style={styles.targetMacroCol}>
                  <Text
                    style={[
                      styles.targetMacroDot,
                      { color: Colors.light.carbs },
                    ]}
                  >
                    ●
                  </Text>
                  <Text style={styles.targetMacroLabel}>Carbs</Text>
                  <Text style={styles.targetMacroAmount}>
                    {targets.carbs_target}g
                  </Text>
                </View>

                <View style={styles.targetMacroCol}>
                  <Text
                    style={[styles.targetMacroDot, { color: Colors.light.fat }]}
                  >
                    ●
                  </Text>
                  <Text style={styles.targetMacroLabel}>Fat</Text>
                  <Text style={styles.targetMacroAmount}>
                    {targets.fat_target}g
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons
                  name="scale-outline"
                  size={20}
                  color={Colors.light.textPrimary}
                />
                <Text style={styles.preferenceLabel}>Units</Text>
              </View>
              <View style={styles.unitsToggle}>
                <TouchableOpacity
                  onPress={() => handleToggleUnits("metric")}
                  style={[
                    styles.unitOption,
                    units === "metric" && styles.unitOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      units === "metric" && styles.unitOptionTextSelected,
                    ]}
                  >
                    Metric (g)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleUnits("imperial")}
                  style={[
                    styles.unitOption,
                    units === "imperial" && styles.unitOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitOptionText,
                      units === "imperial" && styles.unitOptionTextSelected,
                    ]}
                  >
                    Imperial (oz)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color={Colors.light.textMuted}
                />
                <Text
                  style={[
                    styles.preferenceLabel,
                    { color: Colors.light.textSecondary },
                  ]}
                >
                  Dark Mode
                </Text>
              </View>
              <Text style={styles.comingSoonBadge}>Coming in Phase 2</Text>
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.dataCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleExportData}
              style={styles.dataActionRow}
            >
              <View style={styles.preferenceLeft}>
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={Colors.light.primary}
                />
                <View>
                  <Text style={styles.dataActionTitle}>Export Data</Text>
                  <Text style={styles.dataActionSubtitle}>
                    Backup food history as JSON
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.light.textMuted}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowClearConfirm(true)}
              style={styles.dataActionRow}
            >
              <View style={styles.preferenceLeft}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={Colors.light.danger}
                />
                <View>
                  <Text
                    style={[
                      styles.dataActionTitle,
                      { color: Colors.light.danger },
                    ]}
                  >
                    Clear All Data
                  </Text>
                  <Text style={styles.dataActionSubtitle}>
                    Delete saved food, health, and settings data
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.light.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About App */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>AI Nutrition Tracker</Text>
          <Text style={styles.aboutSubtitle}>Version 1.0.0 (MVP)</Text>
          <Text style={styles.aboutDescription}>
            All your nutritional and food records are strictly stored locally on
            your device via SQLite. No account or internet connection required.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={isEditingName} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your name"
              autoFocus
            />
            <View style={styles.modalActions}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setIsEditingName(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveName}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Preview Modal */}
      <Modal visible={exportedJson !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.exportModalCard}>
            <Text style={styles.modalTitle}>Exported Data (JSON)</Text>
            <ScrollView style={styles.exportScroll}>
              <Text style={styles.exportCodeText}>{exportedJson}</Text>
            </ScrollView>
            <PrimaryButton
              title="Close"
              onPress={() => setExportedJson(null)}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Clear All Data Confirmation Dialog */}
      <ConfirmationDialog
        visible={showClearConfirm}
        title="Clear All Data?"
        message="This action will permanently delete your food entries and health history, and reset your profile and targets. This cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleClearAllData}
        onCancel={() => setShowClearConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.primaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  userName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.primaryDark,
    fontWeight: Typography.weights.medium,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  editActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primary,
  },
  targetsCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  targetMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  targetLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  goalLabel: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.sm,
  },
  estimatePanel: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primaryMuted,
  },
  estimateLabel: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  estimateValue: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  suggestionNotice: {
    color: Colors.light.warning,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  useEstimateButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  useEstimateText: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
  targetValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  targetUnit: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textMuted,
  },
  targetPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.caloriesBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 4,
  },
  targetPillText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  targetMacrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  targetMacroCol: {
    alignItems: "center",
    flex: 1,
  },
  targetMacroDot: {
    fontSize: 10,
    marginBottom: 2,
  },
  targetMacroLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
  },
  targetMacroAmount: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  preferenceCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  preferenceLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textPrimary,
  },
  unitsToggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    padding: 3,
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.sm,
  },
  unitOptionSelected: {
    backgroundColor: Colors.light.surface,
    ...Shadows.card,
  },
  unitOptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  unitOptionTextSelected: {
    color: Colors.light.textPrimary,
    fontWeight: Typography.weights.bold,
  },
  comingSoonBadge: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  dataCard: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  dataActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  dataActionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
  dataActionSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  aboutCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  aboutTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  aboutSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  aboutDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 300,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  modalInput: {
    height: 48,
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  exportModalCard: {
    width: "100%",
    maxWidth: 420,
    height: 480,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
  },
  exportScroll: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  exportCodeText: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontSize: 11,
    color: Colors.light.textPrimary,
  },
});
