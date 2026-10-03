import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
import { Colors, Radii, Spacing, Typography } from "../../constants/theme";
import {
  createCustomFood,
  FoodLibraryInput,
  getFoodLibraryItem,
  updateCustomFood,
} from "../../database/foodLibraryRepository";
import {
  FOOD_CATEGORIES,
  FoodCategory,
  FoodLibraryItem,
} from "../../types/food";

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

export default function ManageFoodLibraryScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const [existing, setExisting] = useState<FoodLibraryItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("Other");
  const [servingSize, setServingSize] = useState("1");
  const [servingUnit, setServingUnit] = useState("serving");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [fiber, setFiber] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(!!editingId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    getFoodLibraryItem(editingId)
      .then((food) => {
        if (!food || food.source_type !== "custom") {
          Alert.alert(
            "Reference food",
            "Built-in reference foods cannot be edited.",
          );
          router.back();
          return;
        }
        setExisting(food);
        setName(food.name);
        setCategory(food.category);
        setServingSize(String(food.serving_size));
        setServingUnit(food.serving_unit);
        setCalories(String(food.calories));
        setProtein(String(food.protein));
        setCarbs(String(food.carbs));
        setFat(String(food.fat));
        setFiber(food.fiber == null ? "" : String(food.fiber));
        setDescription(food.description ?? "");
      })
      .catch((error) => {
        console.warn("Custom food load failed:", error);
        Alert.alert("Food unavailable", "Could not load this custom food.");
      })
      .finally(() => setIsLoading(false));
  }, [editingId]);

  const handleSave = async () => {
    const serving = optionalNumber(servingSize);
    const energy = optionalNumber(calories);
    const proteinValue = optionalNumber(protein);
    const carbValue = optionalNumber(carbs);
    const fatValue = optionalNumber(fat);
    const fiberValue = optionalNumber(fiber);

    if (!name.trim() || !servingUnit.trim()) {
      Alert.alert("Missing information", "Enter a food name and serving unit.");
      return;
    }
    if (serving === null || serving <= 0 || energy === null || energy < 0) {
      Alert.alert(
        "Check serving or calories",
        "Enter a positive serving size and non-negative calories.",
      );
      return;
    }
    const macroValues = [proteinValue, carbValue, fatValue];
    if (
      macroValues.some((value) => value === null || value < 0) ||
      (fiber.trim() && (fiberValue === null || fiberValue < 0))
    ) {
      Alert.alert(
        "Check nutrition values",
        "Enter non-negative numbers for all nutrition fields.",
      );
      return;
    }

    const input: FoodLibraryInput = {
      name: name.trim(),
      category,
      serving_size: serving,
      serving_unit: servingUnit.trim(),
      calories: energy,
      protein: proteinValue!,
      carbs: carbValue!,
      fat: fatValue!,
      fiber: fiberValue,
      description: description.trim() || null,
      photo_uri: existing?.photo_uri ?? null,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateCustomFood(editingId, input);
      } else {
        await createCustomFood(input);
      }
      router.back();
    } catch (error) {
      console.warn("Custom food save failed:", error);
      Alert.alert(
        "Save failed",
        "Could not save this custom food. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {editingId ? "Edit Custom Food" : "Add Custom Food"}
        </Text>
        <Text style={styles.description}>
          Nutrition values are user-entered and saved only on this device.
        </Text>

        <Field label="Food name">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Food name"
            placeholderTextColor={Colors.light.textMuted}
          />
        </Field>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categories}>
          {FOOD_CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setCategory(item)}
              style={[
                styles.category,
                category === item && styles.categorySelected,
              ]}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.categoryText,
                  category === item && styles.categoryTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.twoColumns}>
          <Field label="Serving size">
            <TextInput
              style={styles.input}
              value={servingSize}
              onChangeText={setServingSize}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
          <Field label="Serving unit">
            <TextInput
              style={styles.input}
              value={servingUnit}
              onChangeText={setServingUnit}
              placeholder="serving"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
        </View>

        <Field label="Calories (kcal)">
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={Colors.light.textMuted}
          />
        </Field>
        <Text style={styles.label}>Macronutrients (g per serving)</Text>
        <View style={styles.twoColumns}>
          <Field label="Protein">
            <TextInput
              style={styles.input}
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
          <Field label="Carbohydrates">
            <TextInput
              style={styles.input}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
        </View>
        <View style={styles.twoColumns}>
          <Field label="Fat">
            <TextInput
              style={styles.input}
              value={fat}
              onChangeText={setFat}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
          <Field label="Fiber (optional)">
            <TextInput
              style={styles.input}
              value={fiber}
              onChangeText={setFiber}
              keyboardType="decimal-pad"
              placeholder="-"
              placeholderTextColor={Colors.light.textMuted}
            />
          </Field>
        </View>
        <Field label="Notes (optional)">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Preparation or portion notes"
            placeholderTextColor={Colors.light.textMuted}
          />
        </Field>
        <PrimaryButton
          title={editingId ? "Save Changes" : "Save Custom Food"}
          onPress={handleSave}
          loading={isSaving}
          icon="checkmark"
          style={styles.saveButton}
        />
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
          disabled={isSaving}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  loading: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  title: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  field: { flex: 1, marginBottom: Spacing.md },
  label: {
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
    backgroundColor: Colors.light.surface,
    color: Colors.light.textPrimary,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  textArea: { minHeight: 86, textAlignVertical: "top", paddingTop: Spacing.md },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  category: {
    maxWidth: "48%",
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.full,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  categorySelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryMuted,
  },
  categoryText: {
    flexShrink: 1,
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  categoryTextSelected: {
    color: Colors.light.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  twoColumns: { flexDirection: "row", gap: Spacing.md },
  saveButton: { marginTop: Spacing.md },
  cancelButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  cancelText: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
