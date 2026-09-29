import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { getTargets, updateTargets } from '../../database/settingsRepository';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';

export default function EditTargetsScreen() {
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('120');
  const [carbs, setCarbs] = useState('220');
  const [fat, setFat] = useState('65');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const targets = await getTargets();
      setCalories(String(targets.calorie_target));
      setProtein(String(targets.protein_target));
      setCarbs(String(targets.carbs_target));
      setFat(String(targets.fat_target));
    }
    load();
  }, []);

  const macroKcal =
    (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9;

  const handleSave = async () => {
    const calNum = Number(calories);
    const pNum = Number(protein);
    const cNum = Number(carbs);
    const fNum = Number(fat);

    if (isNaN(calNum) || calNum <= 0) {
      Alert.alert('Invalid Calorie Target', 'Please enter a valid positive number for calories.');
      return;
    }

    setIsSaving(true);
    try {
      await updateTargets({
        calorie_target: Math.round(calNum),
        protein_target: Math.round(pNum),
        carbs_target: Math.round(cNum),
        fat_target: Math.round(fNum),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update daily targets.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerDescription}>
          Set your daily nutritional goals. These will guide your progress ring and macro targets on the dashboard.
        </Text>

        {/* Calories Input Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Daily Calorie Goal</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.largeInput}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              placeholder="2000"
            />
            <Text style={styles.inputUnit}>kcal</Text>
          </View>
        </View>

        {/* Macro Targets Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Macronutrient Breakdown</Text>

          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.protein }]} />
              <Text style={styles.macroName}>Protein</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
                placeholder="120"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.carbs }]} />
              <Text style={styles.macroName}>Carbohydrates</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
                placeholder="220"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroTitleWrap}>
              <View style={[styles.macroDot, { backgroundColor: Colors.light.fat }]} />
              <Text style={styles.macroName}>Fat</Text>
            </View>
            <View style={styles.smallInputWrap}>
              <TextInput
                style={styles.smallInput}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
                placeholder="65"
              />
              <Text style={styles.smallUnit}>g</Text>
            </View>
          </View>
        </View>

        {/* Calculation Helper info */}
        <View style={styles.calcNotice}>
          <Text style={styles.calcNoticeText}>
            Combined macro energy: <Text style={{ fontWeight: '700' }}>{macroKcal} kcal</Text>{' '}
            ({Math.round(((Number(protein) * 4) / (macroKcal || 1)) * 100)}% Protein,{' '}
            {Math.round(((Number(carbs) * 4) / (macroKcal || 1)) * 100)}% Carbs,{' '}
            {Math.round(((Number(fat) * 9) / (macroKcal || 1)) * 100)}% Fat)
          </Text>
        </View>

        <PrimaryButton
          title="Save Targets"
          onPress={handleSave}
          loading={isSaving}
          icon="checkmark"
          style={styles.saveButton}
        />

        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          style={styles.cancelButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  headerDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  largeInput: {
    flex: 1,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  inputUnit: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textMuted,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  macroTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  macroName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.textPrimary,
  },
  smallInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    width: 90,
  },
  smallInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
    textAlign: 'right',
    paddingRight: 4,
  },
  smallUnit: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  calcNotice: {
    backgroundColor: Colors.light.primaryMuted,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.xl,
  },
  calcNoticeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.primaryDark,
    lineHeight: 18,
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
  cancelButton: {},
});
