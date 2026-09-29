import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CameraPreview } from '../../components/CameraPreview';

export default function ScanScreen() {
  const handleCapture = (photoUri: string) => {
    router.push({
      pathname: '/scan/preview',
      params: { photoUri },
    });
  };

  return (
    <View style={styles.container}>
      <CameraPreview onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
