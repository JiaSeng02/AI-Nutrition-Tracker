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
import { DateSelector } from "../../components/DateSelector";
import { EmptyState } from "../../components/EmptyState";
import { MealCard } from "../../components/MealCard";
import { ProgressBar } from "../../components/ProgressBar";
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
import { DailyNutritionSummary, FoodItem, MealType } from "../../types/food";
import { formatDisplayDate, getTodayISOString } from "../../utils/date";
import {
  calculateProgress,
  formatKcal,
  getNutritionGoalCaption,
} from "../../utils/nutrition";

export default function DiaryScreen() {
  const [selectedDate, setSelectedDate] = useState(getTodayISOString());
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);

  const loadData = useCallback(async (dateStr: string) => {
    try {
      const data = await getDailyNutritionSummary(dateStr);
      setSummary(data);
    } catch (err) {
      console.warn("Failed to load diary data:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(selectedDate);
    }, [loadData, selectedDate]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedDate);
    setRefreshing(false);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    loadData(dateStr);
  };

  const handleAddFood = (mealType?: MealType) => {
    router.push({
      pathname: "/food/add",
      params: {
        date: selectedDate,
        ...(mealType ? { mealType } : {}),
      },
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
      await loadData(selectedDate);
    }
  };

  const totalItems = summary
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Food Diary</Text>
            <Text style={styles.subtitle}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleAddFood()}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={Colors.light.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <DateSelector
          selectedDateStr={selectedDate}
          onSelectDate={handleSelectDate}
        />

        {/* Meal Groups or Empty State */}
        {totalItems === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No meals logged"
            description={`You haven't recorded any foods for ${formatDisplayDate(selectedDate)}.`}
            actionTitle="Add Food"
            onAction={() => handleAddFood()}
          />
        ) : (
          <View style={styles.mealsContainer}>
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

                {/* Daily Total Summary Card */}
                <View style={styles.dailyTotalCard}>
                  <View style={styles.dailyTotalHeader}>
                    <Text style={styles.dailyTotalTitle}>Daily total</Text>
                    <View style={styles.dailyTotalValueWrap}>
                      <Text style={styles.dailyTotalCalories}>
                        {formatKcal(summary.totalCalories)}
                      </Text>
                      <Text style={styles.dailyTotalTarget}>
                        Target {formatKcal(summary.calorieTarget)}
                      </Text>
                    </View>
                  </View>

                  <ProgressBar
                    progress={calculateProgress(
                      summary.totalCalories,
                      summary.calorieTarget,
                    )}
                    color={Colors.light.calories}
                    backgroundColor={Colors.light.surfaceSecondary}
                    height={8}
                    style={styles.dailyProgressBar}
                  />
                  <Text style={styles.goalCaption}>
                    {getNutritionGoalCaption(summary.nutritionGoal)}
                  </Text>

                  <View style={styles.dailyTotalDivider} />

                  <View style={styles.macrosSummaryRow}>
                    <View style={styles.macroTag}>
                      <View style={styles.macroTagLabelRow}>
                        <Text
                          style={[
                            styles.macroDotText,
                            { color: Colors.light.protein },
                          ]}
                        >
                          ●
                        </Text>
                        <Text style={styles.macroTagText}>Protein</Text>
                      </View>
                      <Text style={styles.macroTargetValue}>
                        {Math.round(summary.totalProtein)} /{" "}
                        {summary.proteinTarget}g
                      </Text>
                    </View>
                    <View style={styles.macroTag}>
                      <View style={styles.macroTagLabelRow}>
                        <Text
                          style={[
                            styles.macroDotText,
                            { color: Colors.light.carbs },
                          ]}
                        >
                          ●
                        </Text>
                        <Text style={styles.macroTagText}>Carbs</Text>
                      </View>
                      <Text style={styles.macroTargetValue}>
                        {Math.round(summary.totalCarbs)} / {summary.carbsTarget}
                        g
                      </Text>
                    </View>
                    <View style={styles.macroTag}>
                      <View style={styles.macroTagLabelRow}>
                        <Text
                          style={[
                            styles.macroDotText,
                            { color: Colors.light.fat },
                          ]}
                        >
                          ●
                        </Text>
                        <Text style={styles.macroTagText}>Fat</Text>
                      </View>
                      <Text style={styles.macroTargetValue}>
                        {Math.round(summary.totalFat)} / {summary.fatTarget}g
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.card,
  },
  mealsContainer: {
    marginTop: Spacing.xs,
  },
  dailyTotalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  dailyTotalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dailyTotalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  dailyTotalCalories: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.primaryDark,
  },
  dailyTotalValueWrap: {
    alignItems: "flex-end",
  },
  dailyTotalTarget: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  dailyProgressBar: {
    marginTop: Spacing.md,
  },
  goalCaption: {
    color: Colors.light.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  dailyTotalDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  macrosSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroTag: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  macroTagLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroDotText: {
    fontSize: 10,
  },
  macroTagText: {
    fontSize: 10,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  macroTargetValue: {
    fontSize: 10,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
});
