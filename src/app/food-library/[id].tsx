import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import {
  Colors,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import {
  deleteCustomFood,
  getFoodLibraryItem,
  getFoodSourceLabel,
} from "../../database/foodLibraryRepository";
import { addFood } from "../../database/foodRepository";
import { FoodLibraryItem, MealType } from "../../types/food";
import { MEAL_TYPES } from "../../types/nutrition";
import { formatLocalTimestamp } from "../../utils/date";
import { scaleFoodNutrition } from "../../utils/foodNutrition";

export default function FoodLibraryDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string;
    date?: string;
    mealType?: MealType;
  }>();
  const [food, setFood] = useState<FoodLibraryItem | null>(null);
  const [quantityText, setQuantityText] = useState("1");
  const [mealType, setMealType] = useState<MealType>(
    params.mealType || "breakfast",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadFood = useCallback(async () => {
    try {
      const item = await getFoodLibraryItem(Number(params.id));
      setFood(item);
    } catch (error) {
      console.warn("Food details load failed:", error);
      Alert.alert("Food unavailable", "Could not load this food.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      void loadFood();
    }, [loadFood]),
  );

  const quantity = Number(quantityText);
  const scaled =
    food && Number.isFinite(quantity) && quantity > 0
      ? scaleFoodNutrition(food, quantity)
      : null;

  const handleAddToDiary = async () => {
    if (!food || !scaled) {
      Alert.alert(
        "Check quantity",
        "Enter a serving quantity greater than zero.",
      );
      return;
    }
    setIsSaving(true);
    try {
      const localTimestamp = formatLocalTimestamp();
      const createdAt = params.date
        ? `${params.date}${localTimestamp.slice(10)}`
        : localTimestamp;
      await addFood({
        name: food.name,
        meal_type: mealType,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        notes: null,
        photo_uri: food.photo_uri,
        created_at: createdAt,
        quantity,
        serving_size: food.serving_size,
        serving_unit: food.serving_unit,
        fiber: scaled.fiber,
        food_library_id: food.id,
        source_type:
          food.source_type === "reference" ? "reference" : "user_entered",
      });
      router.replace({
        pathname: "/(tabs)/diary",
        params: params.date ? { date: params.date } : undefined,
      });
    } catch (error) {
      console.warn("Adding catalog food failed:", error);
      Alert.alert(
        "Could not add food",
        "The diary entry was not saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomFood = () => {
    if (!food || food.source_type !== "custom") return;
    Alert.alert(
      "Delete custom food?",
      "This removes it from your food database. Diary entries already made with it will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deleteCustomFood(food.id)
              .then(() => router.back())
              .catch((error) => {
                console.warn("Custom food deletion failed:", error);
                Alert.alert(
                  "Delete failed",
                  "Could not delete this custom food.",
                );
              });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ActivityIndicator
          size="large"
          color={Colors.light.primary}
          style={styles.loading}
        />
      </SafeAreaView>
    );
  }

  if (!food) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.foodName}>Food not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backAction}
          >
            <Text style={styles.backActionText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.light.textPrimary}
          />
          <Text style={styles.backText}>Food Database</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.source}>
              {getFoodSourceLabel(food.source_type)}
            </Text>
          </View>
          <Text style={styles.category}>{food.category}</Text>
          <Text style={styles.serving}>
            Per {food.serving_size} {food.serving_unit}
          </Text>
          {food.description ? (
            <Text style={styles.description}>{food.description}</Text>
          ) : null}
          <View style={styles.calorieRow}>
            <Ionicons
              name="flame-outline"
              size={21}
              color={Colors.light.calories}
            />
            <Text style={styles.calories}>
              {scaled
                ? Math.round(scaled.calories).toLocaleString()
                : Math.round(food.calories).toLocaleString()}
            </Text>
            <Text style={styles.kcal}>kcal</Text>
          </View>
          <View style={styles.macroGrid}>
            <Macro
              label="Protein"
              value={scaled?.protein ?? food.protein}
              color={Colors.light.protein}
            />
            <Macro
              label="Carbs"
              value={scaled?.carbs ?? food.carbs}
              color={Colors.light.carbs}
            />
            <Macro
              label="Fat"
              value={scaled?.fat ?? food.fat}
              color={Colors.light.fat}
            />
            {food.fiber !== null && (
              <Macro
                label="Fiber"
                value={scaled?.fiber ?? food.fiber}
                color={Colors.light.primary}
              />
            )}
          </View>
          <Text style={styles.referenceNote}>
            Nutrition is reference information and may vary by recipe and
            portion.
          </Text>
        </View>

        {food.source_type === "custom" && (
          <View style={styles.customActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/food-library/manage",
                  params: { id: String(food.id) },
                })
              }
              style={styles.customAction}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={Colors.light.primaryDark}
              />
              <Text style={styles.customActionText}>Edit custom food</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteCustomFood}
              style={styles.customAction}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors.light.danger}
              />
              <Text
                style={[
                  styles.customActionText,
                  { color: Colors.light.danger },
                ]}
              >
                Delete custom food
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Serving quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              onPress={() =>
                setQuantityText(
                  String(Math.max(0.5, (Number(quantityText) || 1) - 0.5)),
                )
              }
              style={styles.stepButton}
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons
                name="remove"
                size={22}
                color={Colors.light.textPrimary}
              />
            </TouchableOpacity>
            <TextInput
              accessibilityLabel="Serving quantity"
              style={styles.quantityInput}
              value={quantityText}
              onChangeText={setQuantityText}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <TouchableOpacity
              onPress={() =>
                setQuantityText(String((Number(quantityText) || 0) + 0.5))
              }
              style={styles.stepButton}
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={22} color={Colors.light.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.servingUnit}>{food.serving_unit}</Text>
          </View>
          <Text style={styles.sectionTitle}>Meal</Text>
          <View style={styles.mealChoices}>
            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal.type}
                accessibilityRole="button"
                accessibilityState={{ selected: mealType === meal.type }}
                onPress={() => setMealType(meal.type)}
                style={[
                  styles.mealChoice,
                  mealType === meal.type && styles.mealChoiceSelected,
                ]}
              >
                <Ionicons
                  name={meal.icon as keyof typeof Ionicons.glyphMap}
                  size={17}
                  color={
                    mealType === meal.type ? meal.color : Colors.light.textMuted
                  }
                />
                <Text
                  style={[
                    styles.mealChoiceText,
                    mealType === meal.type && { color: meal.color },
                  ]}
                >
                  {meal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAddToDiary}
          disabled={isSaving || !scaled}
          style={[styles.addButton, (isSaving || !scaled) && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.light.textInverse} />
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.light.textInverse}
              />
              <Text style={styles.addButtonText}>Add to Diary</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value == null ? "--" : `${value.toFixed(1).replace(/\.0$/, "")}g`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  loading: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  backButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  backText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
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
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  foodName: {
    flex: 1,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  source: {
    color: Colors.light.primaryDark,
    backgroundColor: Colors.light.primaryMuted,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
  },
  category: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
  },
  customActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  customAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  customActionText: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  serving: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: 3,
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  calories: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extrabold,
  },
  kcal: { color: Colors.light.textMuted, fontSize: Typography.sizes.md },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  macro: {
    flexGrow: 1,
    flexBasis: "40%",
    minWidth: 100,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  macroDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 3 },
  macroLabel: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  macroValue: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  referenceNote: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    lineHeight: 17,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  quantityInput: {
    width: 64,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: "center",
  },
  servingUnit: {
    flex: 1,
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
  },
  mealChoices: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  mealChoice: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  mealChoiceSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  mealChoiceText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  addButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: Radii.lg,
    marginTop: Spacing.xs,
  },
  addButtonText: {
    color: Colors.light.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  disabled: { opacity: 0.5 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  backAction: { padding: Spacing.md },
  backActionText: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
