import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { MealType, NewFoodInput } from '../types/food';
import { MEAL_TYPES } from '../types/nutrition';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

interface FoodFormProps {
  initialValues?: Partial<NewFoodInput>;
  submitLabel?: string;
  onSubmit: (values: NewFoodInput) => Promise<void>;
}

export const FoodForm: React.FC<FoodFormProps> = ({
  initialValues,
  submitLabel = 'Save Food',
  onSubmit,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [mealType, setMealType] = useState<MealType>(initialValues?.meal_type || 'breakfast');
  const [calories, setCalories] = useState(
    initialValues?.calories !== undefined ? String(initialValues.calories) : ''
  );
  const [protein, setProtein] = useState(
    initialValues?.protein !== undefined ? String(initialValues.protein) : ''
  );
  const [carbs, setCarbs] = useState(
    initialValues?.carbs !== undefined ? String(initialValues.carbs) : ''
  );
  const [fat, setFat] = useState(
    initialValues?.fat !== undefined ? String(initialValues.fat) : ''
  );
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [photoUri, setPhotoUri] = useState<string | null>(initialValues?.photo_uri || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; calories?: string }>({});

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Photo library access is needed to attach food photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo gallery.');
    }
  };

  const handleTakePhoto = () => {
    // Navigate to camera scan screen with return parameter or set photo
    router.push({
      pathname: '/(tabs)/scan',
    });
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; calories?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter a food name';
    }

    if (!calories.trim() || isNaN(Number(calories)) || Number(calories) < 0) {
      newErrors.calories = 'Please enter valid calories';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        meal_type: mealType,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        notes: notes.trim() || null,
        photo_uri: photoUri,
      });
    } catch (err) {
      console.warn('Food save error:', err);
      Alert.alert('Save Failed', 'Could not save food item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {/* Food Name Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Food Name *</Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          placeholder="e.g. Oatmeal + banana"
          placeholderTextColor={Colors.light.textMuted}
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Meal Type Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Meal Type</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((m) => {
            const isSelected = mealType === m.type;
            return (
              <TouchableOpacity
                key={m.type}
                activeOpacity={0.7}
                onPress={() => setMealType(m.type)}
                style={[
                  styles.mealTypeButton,
                  isSelected && {
                    backgroundColor: m.bgColor,
                    borderColor: m.color,
                  },
                ]}>
                <Ionicons
                  name={m.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={isSelected ? m.color : Colors.light.textMuted}
                />
                <Text
                  style={[
                    styles.mealTypeText,
                    isSelected && { color: m.color, fontWeight: Typography.weights.bold },
                  ]}>
                  {m.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Calories (Prominent Field) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Calories (kcal) *</Text>
        <View style={[styles.inputWithUnit, errors.calories ? styles.inputError : null]}>
          <TextInput
            style={styles.unitInput}
            placeholder="0"
            placeholderTextColor={Colors.light.textMuted}
            keyboardType="numeric"
            value={calories}
            onChangeText={(val) => {
              setCalories(val);
              if (errors.calories) setErrors((prev) => ({ ...prev, calories: undefined }));
            }}
          />
          <Text style={styles.unitLabel}>kcal</Text>
        </View>
        {errors.calories && <Text style={styles.errorText}>{errors.calories}</Text>}
      </View>

      {/* Macro Row (Protein, Carbs, Fat) */}
      <Text style={[styles.label, { marginBottom: Spacing.xs }]}>Macronutrients (Optional)</Text>
      <View style={styles.macroInputsRow}>
        {/* Protein */}
        <View style={styles.macroInputCol}>
          <Text style={[styles.macroLabel, { color: Colors.light.protein }]}>Protein</Text>
          <View style={styles.macroInputWrap}>
            <TextInput
              style={styles.macroInput}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />
            <Text style={styles.macroUnit}>g</Text>
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroInputCol}>
          <Text style={[styles.macroLabel, { color: Colors.light.carbs }]}>Carbs</Text>
          <View style={styles.macroInputWrap}>
            <TextInput
              style={styles.macroInput}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
            <Text style={styles.macroUnit}>g</Text>
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroInputCol}>
          <Text style={[styles.macroLabel, { color: Colors.light.fat }]}>Fat</Text>
          <View style={styles.macroInputWrap}>
            <TextInput
              style={styles.macroInput}
              placeholder="0"
              placeholderTextColor={Colors.light.textMuted}
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
            <Text style={styles.macroUnit}>g</Text>
          </View>
        </View>
      </View>

      {/* Photo Section */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Photo (Optional)</Text>
        {photoUri ? (
          <View style={styles.photoPreviewCard}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <View style={styles.photoActions}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.photoActionButton}>
                <Ionicons name="images-outline" size={16} color={Colors.light.textPrimary} />
                <Text style={styles.photoActionText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemovePhoto}
                style={[styles.photoActionButton, styles.removePhotoButton]}>
                <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
                <Text style={[styles.photoActionText, { color: Colors.light.danger }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.photoButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickImage}
              style={styles.photoPickerButton}>
              <Ionicons name="images-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.photoPickerText}>Choose Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTakePhoto}
              style={styles.photoPickerButton}>
              <Ionicons name="camera-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.photoPickerText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Optional Notes */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. 1 bowl with chia seeds and almond milk"
          placeholderTextColor={Colors.light.textMuted}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Submit Button */}
      <PrimaryButton
        title={submitLabel}
        onPress={handleSubmit}
        loading={isSubmitting}
        icon="checkmark"
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 50,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.light.textPrimary,
  },
  textArea: {
    height: 90,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.danger,
    marginTop: 4,
    marginLeft: 2,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  mealTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: 4,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  mealTypeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textSecondary,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
  },
  unitInput: {
    flex: 1,
    height: '100%',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  unitLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textMuted,
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  macroInputCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    marginBottom: 4,
  },
  macroInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
  },
  macroInput: {
    flex: 1,
    height: '100%',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
  macroUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.primaryMuted,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.primaryLight,
    gap: Spacing.xs,
  },
  photoPickerText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.primaryDark,
  },
  photoPreviewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    gap: 4,
  },
  removePhotoButton: {
    backgroundColor: Colors.light.dangerLight,
  },
  photoActionText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
