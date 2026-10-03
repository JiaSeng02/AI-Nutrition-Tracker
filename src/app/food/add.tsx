import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FoodForm } from "../../components/FoodForm";
import { Colors, Spacing, Typography } from "../../constants/theme";
import {
  addFood,
  getFoodById,
  updateFood,
} from "../../database/foodRepository";
import { MealType, NewFoodInput } from "../../types/food";
import { getTodayISOString } from "../../utils/date";

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{
    mealType?: MealType;
    date?: string;
    photoUri?: string;
    editId?: string;
  }>();
  const navigation = useNavigation();

  const [loadingInitial, setLoadingInitial] = useState(!!params.editId);
  const [initialValues, setInitialValues] = useState<Partial<NewFoodInput>>({
    meal_type: params.mealType || "breakfast",
    photo_uri: params.photoUri || null,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    async function loadExisting() {
      if (params.editId) {
        try {
          const existing = await getFoodById(Number(params.editId));
          if (existing) {
            setInitialValues({
              name: existing.name,
              meal_type: existing.meal_type,
              calories: existing.calories,
              protein: existing.protein,
              carbs: existing.carbs,
              fat: existing.fat,
              notes: existing.notes || "",
              photo_uri: existing.photo_uri,
              quantity: existing.quantity,
              serving_size: existing.serving_size,
              serving_unit: existing.serving_unit,
              fiber: existing.fiber,
              food_library_id: existing.food_library_id,
              source_type: existing.source_type,
            });
          }
        } catch (e) {
          console.warn("Error loading food to edit:", e);
        } finally {
          setLoadingInitial(false);
        }
      }
    }
    loadExisting();
  }, [params.editId]);

  const handleSubmit = async (values: NewFoodInput) => {
    if (params.editId) {
      await updateFood(Number(params.editId), {
        ...values,
        source_type: "user_entered",
      });
    } else {
      const selectedDate = params.date || getTodayISOString();
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      // Store as local datetime string so LIKE 'YYYY-MM-DD%' queries in SQLite work correctly
      // regardless of the device timezone (no UTC offset applied).
      const fullTimestamp = `${selectedDate}T${hh}:${mm}:${ss}.000`;

      await addFood({
        ...values,
        created_at: fullTimestamp,
      });
    }

    router.back();
  };

  if (loadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/food-library",
            params: {
              ...(params.date ? { date: params.date } : {}),
              ...(params.mealType ? { mealType: params.mealType } : {}),
            },
          })
        }
        style={styles.databaseButton}
      >
        <Ionicons
          name="search-outline"
          size={19}
          color={Colors.light.primaryDark}
        />
        <Text style={styles.databaseButtonText}>Search Food Database</Text>
      </TouchableOpacity>
      <FoodForm
        initialValues={initialValues}
        submitLabel={params.editId ? "Update Food" : "Save Food"}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  cancelButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: Typography.sizes.md,
    color: Colors.light.primary,
    fontWeight: Typography.weights.medium,
  },
  databaseButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 8,
    backgroundColor: Colors.light.primaryMuted,
    marginBottom: Spacing.md,
  },
  databaseButtonText: {
    color: Colors.light.primaryDark,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});
