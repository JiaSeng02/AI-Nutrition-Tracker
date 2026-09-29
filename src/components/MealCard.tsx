import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem as FoodItemType, MealType } from '../types/food';
import { MEAL_TYPES } from '../types/nutrition';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { FoodItem } from './FoodItem';
import { formatKcal } from '../utils/nutrition';

interface MealCardProps {
  mealType: MealType;
  items: FoodItemType[];
  onItemPress: (item: FoodItemType) => void;
  onItemDelete?: (item: FoodItemType) => void;
  onAddMeal?: (mealType: MealType) => void;
  hideIfEmpty?: boolean;
}

export const MealCard: React.FC<MealCardProps> = ({
  mealType,
  items,
  onItemPress,
  onItemDelete,
  onAddMeal,
  hideIfEmpty = false,
}) => {
  const meta = MEAL_TYPES.find((m) => m.type === mealType) || MEAL_TYPES[0];
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  if (hideIfEmpty && items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <View style={[styles.iconContainer, { backgroundColor: meta.bgColor }]}>
            <Ionicons
              name={meta.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={meta.color}
            />
          </View>
          <Text style={styles.title}>{meta.title}</Text>
        </View>

        <View style={styles.rightHeader}>
          {items.length > 0 && (
            <Text style={styles.totalCalories}>{formatKcal(totalCalories)}</Text>
          )}
          {onAddMeal && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onAddMeal(mealType)}
              style={styles.addButton}>
              <Ionicons name="add" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Items list or empty state */}
      <View style={styles.body}>
        {items.length > 0 ? (
          items.map((item) => (
            <FoodItem
              key={item.id}
              item={item}
              onPress={onItemPress}
              onDelete={onItemDelete}
            />
          ))
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onAddMeal?.(mealType)}
            style={styles.emptyContainer}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>Add {meta.title.toLowerCase()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  totalCalories: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textSecondary,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    // items container
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textMuted,
    fontWeight: Typography.weights.medium,
  },
});
