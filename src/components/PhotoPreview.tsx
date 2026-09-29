import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface PhotoPreviewProps {
  photoUri: string;
  onRetake: () => void;
  onAddDetails: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photoUri,
  onRetake,
  onAddDetails,
}) => {
  return (
    <View style={styles.container}>
      {/* Captured Image Box */}
      <View style={styles.imageCard}>
        <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        <View style={styles.badge}>
          <Ionicons name="camera" size={14} color={Colors.light.textInverse} />
          <Text style={styles.badgeText}>Food Photo</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>Food photo captured</Text>
        <Text style={styles.subtitle}>
          Add details now to log your meal. AI food recognition will automatically detect portion & calories in the future.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <SecondaryButton
          title="Retake"
          icon="refresh-outline"
          onPress={onRetake}
          variant="outline"
          style={styles.retakeButton}
        />
        <PrimaryButton
          title="Add Details"
          icon="arrow-forward"
          onPress={onAddDetails}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
  },
  imageCard: {
    width: '100%',
    height: 380,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 6,
  },
  badgeText: {
    color: Colors.light.textInverse,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retakeButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1.5,
  },
});
