import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '../../types/food';
import { MEAL_TYPES } from '../../types/nutrition';
import { getFoodById, deleteFood } from '../../database/foodRepository';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { formatDisplayDate, formatTime } from '../../utils/date';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadItem = useCallback(async () => {
    if (!id) return;
    try {
      const item = await getFoodById(Number(id));
      setFood(item);
    } catch (e) {
      console.warn('Error loading food details:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  const handleEdit = () => {
    if (!food) return;
    router.push({
      pathname: '/food/add',
      params: { editId: food.id.toString() },
    });
  };

  const handleDelete = async () => {
    if (!food) return;
    setShowDeleteConfirm(false);
    await deleteFood(food.id);
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Food item not found.</Text>
        <SecondaryButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const mealMeta = MEAL_TYPES.find((m) => m.type === food.meal_type) || MEAL_TYPES[0];
  const dateStr = food.created_at.split('T')[0];
  const timeFormatted = formatTime(food.created_at);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo if available */}
        {food.photo_uri ? (
          <View style={styles.imageCard}>
            <Image source={{ uri: food.photo_uri }} style={styles.image} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.light.primary} />
          </View>
        )}

        {/* Food Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{food.name}</Text>
            <View style={[styles.mealBadge, { backgroundColor: mealMeta.bgColor }]}>
              <Ionicons
                name={mealMeta.icon as keyof typeof Ionicons.glyphMap}
                size={14}
                color={mealMeta.color}
              />
              <Text style={[styles.mealBadgeText, { color: mealMeta.color }]}>
                {mealMeta.title}
              </Text>
            </View>
          </View>

          {/* Calories Display */}
          <View style={styles.calorieRow}>
            <Ionicons name="flame" size={24} color={Colors.light.calories} />
            <Text style={styles.caloriesNumber}>{Math.round(food.calories).toLocaleString()}</Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
          </View>

          <View style={styles.divider} />

          {/* Macronutrients Breakdown */}
          <Text style={styles.sectionHeading}>Nutritional Breakdown</Text>
          <View style={styles.macrosGrid}>
            <View style={styles.macroBox}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.protein }]} />
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{Math.round(food.protein)}g</Text>
              <Text style={styles.macroKcal}>{Math.round(food.protein * 4)} kcal</Text>
            </View>

            <View style={styles.macroBox}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.carbs }]} />
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{Math.round(food.carbs)}g</Text>
              <Text style={styles.macroKcal}>{Math.round(food.carbs * 4)} kcal</Text>
            </View>

            <View style={styles.macroBox}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.fat }]} />
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{Math.round(food.fat)}g</Text>
              <Text style={styles.macroKcal}>{Math.round(food.fat * 9)} kcal</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Date and Time */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.metaText}>{formatDisplayDate(dateStr)}</Text>
            </View>
            {timeFormatted ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.metaText}>{timeFormatted}</Text>
              </View>
            ) : null}
          </View>

          {/* Notes if available */}
          {food.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <View style={styles.notesBox}>
                <Ionicons name="document-text-outline" size={16} color={Colors.light.textMuted} />
                <Text style={styles.notesText}>{food.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Actions Bar */}
      <View style={styles.bottomBar}>
        <SecondaryButton
          title="Delete"
          icon="trash-outline"
          textColor={Colors.light.danger}
          onPress={() => setShowDeleteConfirm(true)}
          style={styles.deleteBtn}
        />
        <PrimaryButton
          title="Edit"
          icon="create-outline"
          onPress={handleEdit}
          style={styles.editBtn}
        />
      </View>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete Food Entry"
        message={`Are you sure you want to permanently delete "${food.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  notFoundText: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 110,
  },
  imageCard: {
    width: '100%',
    height: 240,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 4,
  },
  mealBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.md,
    gap: 6,
  },
  caloriesNumber: {
    fontSize: Typography.sizes.hero,
    fontWeight: Typography.weights.extrabold,
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  caloriesUnit: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.lg,
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroBox: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  macroValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginTop: 2,
  },
  macroKcal: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  notesSection: {
    marginTop: Spacing.lg,
  },
  notesLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.light.textPrimary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  deleteBtn: {
    flex: 1,
  },
  editBtn: {
    flex: 2,
  },
});
