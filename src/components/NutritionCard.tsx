import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { ProgressBar } from './ProgressBar';
import { calculateProgress } from '../utils/nutrition';

interface NutritionCardProps {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  calories,
  calorieTarget,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
}) => {
  const calorieProgress = calculateProgress(calories, calorieTarget);
  const remainingCalories = Math.max(calorieTarget - calories, 0);

  return (
    <View style={styles.wrapper}>
      {/* Large Calories Summary Card */}
      <View style={styles.mainCard}>
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconBadge, { backgroundColor: Colors.light.caloriesBg }]}>
              <Ionicons name="flame" size={18} color={Colors.light.calories} />
            </View>
            <Text style={styles.mainTitle}>Calories</Text>
          </View>
          <Text style={styles.remainingText}>
            {calories > calorieTarget
              ? `${Math.round(calories - calorieTarget).toLocaleString()} kcal over`
              : `${Math.round(remainingCalories).toLocaleString()} kcal left`}
          </Text>
        </View>

        <View style={styles.calorieRow}>
          <Text style={styles.calorieCurrent}>{Math.round(calories).toLocaleString()}</Text>
          <Text style={styles.calorieTarget}> / {Math.round(calorieTarget).toLocaleString()} kcal</Text>
        </View>

        <ProgressBar
          progress={calorieProgress}
          color={Colors.light.calories}
          backgroundColor={Colors.light.surfaceSecondary}
          height={10}
          style={styles.progressBar}
        />
      </View>

      {/* 3 Macro Cards Side by Side */}
      <View style={styles.macroRow}>
        {/* Protein Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroDot, { backgroundColor: Colors.light.protein }]} />
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <Text style={styles.macroValue}>{Math.round(protein)} g</Text>
          <Text style={styles.macroTarget}>of {proteinTarget}g</Text>
          <ProgressBar
            progress={calculateProgress(protein, proteinTarget)}
            color={Colors.light.protein}
            height={5}
            style={styles.macroProgress}
          />
        </View>

        {/* Carbs Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroDot, { backgroundColor: Colors.light.carbs }]} />
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <Text style={styles.macroValue}>{Math.round(carbs)} g</Text>
          <Text style={styles.macroTarget}>of {carbsTarget}g</Text>
          <ProgressBar
            progress={calculateProgress(carbs, carbsTarget)}
            color={Colors.light.carbs}
            height={5}
            style={styles.macroProgress}
          />
        </View>

        {/* Fat Card */}
        <View style={styles.macroCard}>
          <View style={styles.macroHeader}>
            <View style={[styles.macroDot, { backgroundColor: Colors.light.fat }]} />
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
          <Text style={styles.macroValue}>{Math.round(fat)} g</Text>
          <Text style={styles.macroTarget}>of {fatTarget}g</Text>
          <ProgressBar
            progress={calculateProgress(fat, fatTarget)}
            color={Colors.light.fat}
            height={5}
            style={styles.macroProgress}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.md,
  },
  mainCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  mainTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
  remainingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: Spacing.xs,
  },
  calorieCurrent: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  calorieTarget: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textMuted,
  },
  progressBar: {
    marginTop: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textSecondary,
  },
  macroValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  macroTarget: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  macroProgress: {
    marginTop: 2,
  },
});
