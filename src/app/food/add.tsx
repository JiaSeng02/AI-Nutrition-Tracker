import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FoodForm } from '../../components/FoodForm';
import { addFood, getFoodById, updateFood } from '../../database/foodRepository';
import { MealType, NewFoodInput } from '../../types/food';
import { Colors, Spacing } from '../../constants/theme';
import { getTodayISOString } from '../../utils/date';

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{
    mealType?: MealType;
    date?: string;
    photoUri?: string;
    editId?: string;
  }>();

  const [loadingInitial, setLoadingInitial] = useState(!!params.editId);
  const [initialValues, setInitialValues] = useState<Partial<NewFoodInput>>({
    meal_type: params.mealType || 'breakfast',
    photo_uri: params.photoUri || null,
  });

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
              notes: existing.notes || '',
              photo_uri: existing.photo_uri,
            });
          }
        } catch (e) {
          console.warn('Error loading food to edit:', e);
        } finally {
          setLoadingInitial(false);
        }
      }
    }
    loadExisting();
  }, [params.editId]);

  const handleSubmit = async (values: NewFoodInput) => {
    if (params.editId) {
      await updateFood(Number(params.editId), values);
    } else {
      const selectedDate = params.date || getTodayISOString();
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
      const fullTimestamp = `${selectedDate}T${timePart}.000Z`;

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
      <FoodForm
        initialValues={initialValues}
        submitLabel={params.editId ? 'Update Food' : 'Save Food'}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
});
