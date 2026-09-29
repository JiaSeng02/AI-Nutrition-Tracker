import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { PhotoPreview } from '../../components/PhotoPreview';
import { Colors } from '../../constants/theme';
import { SecondaryButton } from '../../components/SecondaryButton';

export default function ScanPhotoPreviewScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  if (!photoUri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No photo captured</Text>
        <SecondaryButton title="Back to Camera" onPress={() => router.back()} />
      </View>
    );
  }

  const handleRetake = () => {
    router.back();
  };

  const handleAddDetails = () => {
    // Open Add Food screen with this photo attached
    router.replace({
      pathname: '/food/add',
      params: { photoUri },
    });
  };

  return (
    <View style={styles.container}>
      <PhotoPreview
        photoUri={photoUri}
        onRetake={handleRetake}
        onAddDetails={handleAddDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 16,
  },
});
