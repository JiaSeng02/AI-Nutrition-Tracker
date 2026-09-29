import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getDatabase } from '../database/database';
import { seedSampleData } from '../database/foodRepository';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite DB schema and seed initial sample data
        await getDatabase();
        await seedSampleData();
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashFallback}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="food/add"
          options={{
            headerShown: true,
            title: 'Add Food',
            presentation: 'modal',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.light.surface },
            headerTitleStyle: { fontWeight: '700', color: Colors.light.textPrimary },
          }}
        />
        <Stack.Screen
          name="food/[id]"
          options={{
            headerShown: true,
            title: 'Food Details',
            presentation: 'card',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.light.surface },
            headerTitleStyle: { fontWeight: '700', color: Colors.light.textPrimary },
          }}
        />
        <Stack.Screen
          name="scan/preview"
          options={{
            headerShown: true,
            title: 'Photo Preview',
            presentation: 'card',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.light.surface },
            headerTitleStyle: { fontWeight: '700', color: Colors.light.textPrimary },
          }}
        />
        <Stack.Screen
          name="profile/targets"
          options={{
            headerShown: true,
            title: 'Daily Nutrition Targets',
            presentation: 'modal',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: Colors.light.surface },
            headerTitleStyle: { fontWeight: '700', color: Colors.light.textPrimary },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splashFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
});
