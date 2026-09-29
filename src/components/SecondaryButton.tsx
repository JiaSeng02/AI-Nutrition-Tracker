import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../constants/theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  textColor?: string;
  variant?: 'outline' | 'filled';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
  textColor,
  variant = 'filled',
}) => {
  const isOutline = variant === 'outline';
  const resolvedTextColor = textColor || (isOutline ? Colors.light.textPrimary : Colors.light.textSecondary);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isOutline ? styles.outline : styles.filled,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={disabled ? Colors.light.textMuted : resolvedTextColor}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.text,
            { color: disabled ? Colors.light.textMuted : resolvedTextColor },
            textStyle,
          ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filled: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.border,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
