import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { storeCapturedImage } from '../services/capturedImageStore';

interface CameraPreviewProps {
  onCapture: (photoUri: string) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ onCapture }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { width } = useWindowDimensions();

  const viewfinderSize = Math.min(width * 0.65, 280);

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to pick a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
        base64: true,
      });

      const asset = result.canceled ? null : result.assets[0];

      if (asset?.uri && asset.base64) {
        storeCapturedImage(asset.uri, asset.base64, 'image/jpeg');
        onCapture(asset.uri);
      } else if (!result.canceled) {
        Alert.alert('Photo Error', 'Unable to read the selected photo. Please try another image.');
      }
    } catch {
      Alert.alert('Error', 'Unable to pick photo from gallery.');
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
        base64: true,
      });

      if (photo?.uri && photo.base64) {
        storeCapturedImage(photo.uri, photo.base64, 'image/jpeg');
        onCapture(photo.uri);
      } else {
        Alert.alert('Camera Error', 'The photo could not be prepared. Please try again.');
      }
    } catch {
      Alert.alert('Camera Error', 'Could not capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={44} color={Colors.light.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionDescription}>
          We need access to your camera so you can photograph your meals for easy nutrition tracking.
        </Text>
        <PrimaryButton
          title="Enable Camera"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
        <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryFallbackButton}>
          <Text style={styles.galleryFallbackText}>Or choose from photo library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera with NO children — required by expo-camera SDK 57 */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* All UI overlaid using absolute positioning outside CameraView */}
      <SafeAreaView style={styles.overlayContainer} edges={['top', 'bottom']}>
        {/* Top Controls Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleFlash}
            style={styles.circleControl}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off-outline'}
              size={20}
              color={flash === 'on' ? '#FBBF24' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={styles.cameraTag}>
            <Text style={styles.cameraTagText}>Scan Food</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleFacing}
            style={styles.circleControl}>
            <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Middle: Viewfinder */}
        <View style={styles.viewfinderCenter}>
          <View
            style={[
              styles.viewfinderBox,
              { width: viewfinderSize, height: viewfinderSize },
            ]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hintText}>Take a photo of your meal</Text>
        </View>

        {/* Bottom: AI Badge + Shutter Controls */}
        <View style={styles.bottomOverlay}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.light.primary} />
            <Text style={styles.aiBadgeText}>AI food recognition will be available here</Text>
          </View>

          <View style={styles.shutterRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickFromGallery}
              style={styles.galleryButton}>
              <Ionicons name="images-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTakePicture}
              disabled={isCapturing}
              style={styles.shutterOuter}>
              {isCapturing ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            {/* Placeholder to balance the row */}
            <View style={styles.galleryButton} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  permissionButton: {
    minWidth: 200,
    marginBottom: Spacing.md,
  },
  galleryFallbackButton: {
    padding: Spacing.sm,
  },
  galleryFallbackText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.primaryDark,
    fontWeight: Typography.weights.semibold,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  circleControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  cameraTagText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  viewfinderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  viewfinderBox: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  bottomOverlay: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.full,
    gap: 6,
    marginBottom: Spacing.xl,
  },
  aiBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.textPrimary,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
});
