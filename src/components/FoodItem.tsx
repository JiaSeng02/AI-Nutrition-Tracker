import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem as FoodItemType } from '../types/food';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { formatKcal } from '../utils/nutrition';

interface FoodItemProps {
  item: FoodItemType;
  onPress: (item: FoodItemType) => void;
  onDelete?: (item: FoodItemType) => void;
  showMealBadge?: boolean;
}

export const FoodItem: React.FC<FoodItemProps> = ({
  item,
  onPress,
  onDelete,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={styles.container}>
      {/* Thumbnail or placeholder */}
      {item.photo_uri ? (
        <Image source={{ uri: item.photo_uri }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholderThumbnail}>
          <Ionicons name="restaurant-outline" size={18} color={Colors.light.primary} />
        </View>
      )}

      {/* Info column */}
      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.macroRow}>
          {item.protein > 0 && (
            <Text style={[styles.macroText, { color: Colors.light.protein }]}>
              P {Math.round(item.protein)}g
            </Text>
          )}
          {item.carbs > 0 && (
            <Text style={[styles.macroText, { color: Colors.light.carbs }]}>
              • C {Math.round(item.carbs)}g
            </Text>
          )}
          {item.fat > 0 && (
            <Text style={[styles.macroText, { color: Colors.light.fat }]}>
              • F {Math.round(item.fat)}g
            </Text>
          )}
        </View>
      </View>

      {/* Calories & Delete Action */}
      <View style={styles.rightCol}>
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieText}>{formatKcal(item.calories)}</Text>
        </View>

        {onDelete && (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color={Colors.light.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surfaceSecondary,
    flexShrink: 0,
  },
  placeholderThumbnail: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoCol: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
    minWidth: 0, // allow flex child to shrink below content size
  },
  name: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
    flexShrink: 1,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
    gap: 3,
  },
  macroText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  rightCol: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    gap: 4,
    flexShrink: 0,
  },
  calorieBadge: {
    backgroundColor: Colors.light.surfaceSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  calorieText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'center',
  },
});
