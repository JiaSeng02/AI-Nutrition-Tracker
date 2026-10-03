import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
} from "../constants/theme";
import {
  getFoodSourceLabel,
  getRecentFoodLibraryItems,
  searchFoodLibrary,
} from "../database/foodLibraryRepository";
import {
  FOOD_CATEGORIES,
  FoodCategory,
  FoodLibraryItem,
  MealType,
} from "../types/food";

function FoodResult({
  food,
  onPress,
}: {
  food: FoodLibraryItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.result}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.source}>
          {getFoodSourceLabel(food.source_type)}
        </Text>
      </View>
      <Text style={styles.foodDetail}>
        {food.category} - {food.serving_size} {food.serving_unit}
      </Text>
      <Text style={styles.foodCalories}>
        {Math.round(food.calories).toLocaleString()} kcal
      </Text>
      <Text style={styles.foodMacros}>
        P {food.protein}g C {food.carbs}g F {food.fat}g
        {food.fiber == null ? "" : `   Fiber ${food.fiber}g`}
      </Text>
    </TouchableOpacity>
  );
}

export default function FoodLibraryScreen() {
  const params = useLocalSearchParams<{ date?: string; mealType?: MealType }>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FoodCategory | null>(null);
  const [foods, setFoods] = useState<FoodLibraryItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const recentIds = new Set(recentFoods.map((food) => food.id));
  const visibleFoods =
    !search.trim() && !category
      ? foods.filter((food) => !recentIds.has(food.id))
      : foods;

  const loadFoods = useCallback(async () => {
    try {
      const [results, recent] = await Promise.all([
        searchFoodLibrary(search, category),
        getRecentFoodLibraryItems(),
      ]);
      setFoods(results);
      setRecentFoods(recent);
      setError(false);
    } catch (loadError) {
      console.warn("Food library load failed:", loadError);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [category, search]);

  useFocusEffect(
    useCallback(() => {
      void loadFoods();
    }, [loadFoods]),
  );

  const openFood = (food: FoodLibraryItem) => {
    router.push({
      pathname: "/food-library/[id]",
      params: {
        id: String(food.id),
        ...(params.date ? { date: params.date } : {}),
        ...(params.mealType ? { mealType: params.mealType } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
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
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Food Database</Text>
          <Text style={styles.subtitle}>
            Reference values vary by recipe and portion.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/food-library/manage")}
          style={styles.addButton}
          accessibilityLabel="Add custom food"
        >
          <Ionicons name="add" size={24} color={Colors.light.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color={Colors.light.textMuted}
        />
        <TextInput
          accessibilityLabel="Search foods"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search foods"
          placeholderTextColor={Colors.light.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={Colors.light.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        style={styles.categoryFilter}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        <TouchableOpacity
          onPress={() => setCategory(null)}
          style={[
            styles.categoryChip,
            category === null && styles.categoryChipSelected,
          ]}
        >
          <Text
            style={[
              styles.categoryText,
              category === null && styles.categoryTextSelected,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {FOOD_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategory(category === item ? null : item)}
            style={[
              styles.categoryChip,
              category === item && styles.categoryChipSelected,
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
      </ScrollView>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.light.primary}
            style={styles.loading}
          />
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Food database unavailable</Text>
            <Text style={styles.emptyDescription}>
              Try opening this screen again.
            </Text>
          </View>
        ) : (
          <>
            {!search.trim() && !category && recentFoods.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recently logged</Text>
                {recentFoods.map((food) => (
                  <FoodResult
                    key={`recent-${food.id}`}
                    food={food}
                    onPress={() => openFood(food)}
                  />
                ))}
                <Text style={styles.sectionTitle}>All foods</Text>
              </>
            )}
            {visibleFoods.map((food) => (
              <FoodResult
                key={food.id}
                food={food}
                onPress={() => openFood(food)}
              />
            ))}
            {visibleFoods.length === 0 &&
              (search.trim() || category || recentFoods.length === 0) && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="restaurant-outline"
                      size={28}
                      color={Colors.light.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {search.trim()
                      ? "No matching foods"
                      : "No foods in this category"}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {search.trim()
                      ? "Try another name or create a custom food."
                      : "Choose another category or add a custom food."}
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backButton: { width: 40, height: 44, justifyContent: "center" },
  headerCopy: { flex: 1, minWidth: 0 },
  title: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.sm,
  },
  clearButton: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  categories: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 50,
    gap: Spacing.xs,
  },
  categoryFilter: {
    flexGrow: 0,
    height: 60,
    maxHeight: 60,
  },
  categoryChip: {
    flexShrink: 0,
    maxWidth: 180,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.full,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primaryMuted,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    maxWidth: 150,
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  categoryTextSelected: {
    color: Colors.light.primaryDark,
    fontWeight: Typography.weights.bold,
  },
  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  loading: { marginTop: Spacing.xxxl },
  sectionTitle: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  result: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  foodName: {
    flex: 1,
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  source: {
    color: Colors.light.primaryDark,
    backgroundColor: Colors.light.primaryMuted,
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  foodDetail: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 5,
  },
  foodCalories: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  foodMacros: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: Colors.light.primaryMuted,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.light.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
});
