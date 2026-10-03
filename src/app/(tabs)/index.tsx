import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { EmptyState } from "../../components/EmptyState";
import { MealCard } from "../../components/MealCard";
import { NutritionCard } from "../../components/NutritionCard";
import {
  Colors,
  Radii,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/theme";
import {
  deleteFood,
  getDailyNutritionSummary,
} from "../../database/foodRepository";
import { getSetting } from "../../database/settingsRepository";
import { DailyNutritionSummary, FoodItem, MealType } from "../../types/food";
import { getTimeGreeting, getTodayISOString } from "../../utils/date";

export default function HomeScreen() {
  const [userName, setUserName] = useState("User");
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const today = getTodayISOString();
      const [name, dailyData] = await Promise.all([
        getSetting("user_name", "User"),
        getDailyNutritionSummary(today),
      ]);
      setUserName(name || "User");
      setSummary(dailyData);
    } catch (err) {
      console.warn("Failed to load home data:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenScan = () => {
    router.push("/(tabs)/scan");
  };

  const handleAddFood = (mealType?: MealType) => {
    router.push({
      pathname: "/food/add",
      params: mealType ? { mealType } : undefined,
    });
  };

  const handleFoodItemPress = (item: FoodItem) => {
    router.push({
      pathname: "/food/[id]",
      params: { id: item.id.toString() },
    });
  };

  const handleFoodItemDelete = (item: FoodItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteFood(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    }
  };

  const totalFoodsToday = summary
    ? summary.meals.breakfast.length +
      summary.meals.lunch.length +
      summary.meals.dinner.length +
      summary.meals.snack.length
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>
              {getTimeGreeting()}, {userName}
            </Text>
            <Text style={styles.subGreetingText}>{"Today's nutrition"}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAddFood()}
            style={styles.quickAddButton}
          >
            <Ionicons name="add" size={24} color={Colors.light.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Nutrition Summary Card & Macros */}
        {summary && (
          <NutritionCard
            calories={summary.totalCalories}
            calorieTarget={summary.calorieTarget}
            protein={summary.totalProtein}
            proteinTarget={summary.proteinTarget}
            carbs={summary.totalCarbs}
            carbsTarget={summary.carbsTarget}
            fat={summary.totalFat}
            fatTarget={summary.fatTarget}
          />
        )}

        {/* Today's Meals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{"Today's meals"}</Text>
          {totalFoodsToday > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/diary")}>
              <Text style={styles.sectionLink}>View Diary</Text>
            </TouchableOpacity>
          )}
        </View>

        {totalFoodsToday === 0 ? (
          <EmptyState
            icon="nutrition-outline"
            title="Nothing logged yet"
            description="Add your first meal to start tracking today's nutrition."
            actionTitle="Add Food"
            onAction={() => handleAddFood()}
          />
        ) : (
          <View style={styles.mealsList}>
            {summary && (
              <>
                <MealCard
                  mealType="breakfast"
                  items={summary.meals.breakfast}
                  onItemPress={handleFoodItemPress}
                  onItemDelete={handleFoodItemDelete}
                  onAddMeal={handleAddFood}
                />
                <MealCard
                  mealType="lunch"
                  items={summary.meals.lunch}
                  onItemPress={handleFoodItemPress}
                  onItemDelete={handleFoodItemDelete}
                  onAddMeal={handleAddFood}
                />
                <MealCard
                  mealType="dinner"
                  items={summary.meals.dinner}
                  onItemPress={handleFoodItemPress}
                  onItemDelete={handleFoodItemDelete}
                  onAddMeal={handleAddFood}
                />
                <MealCard
                  mealType="snack"
                  items={summary.meals.snack}
                  onItemPress={handleFoodItemPress}
                  onItemDelete={handleFoodItemDelete}
                  onAddMeal={handleAddFood}
                />
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenScan}
          style={styles.scanButton}
        >
          <Ionicons name="camera" size={20} color={Colors.light.textInverse} />
          <Text style={styles.scanButtonText}>Scan Food</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Item Confirmation Dialog */}
      <ConfirmationDialog
        visible={itemToDelete !== null}
        title="Delete Food Entry"
        message={`Are you sure you want to remove "${itemToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  greetingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  subGreetingText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  quickAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  sectionLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primary,
  },
  mealsList: {
    marginTop: Spacing.xs,
  },
  scanButton: {
    alignSelf: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.full,
    gap: Spacing.sm,
  },
  scanButtonText: {
    color: Colors.light.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
});
