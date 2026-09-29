import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  const tabBarHeight = Platform.select({
    ios: 50 + insets.bottom,
    default: 56 + insets.bottom,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.tabBarInactive,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom + 4,
          },
        ],
        tabBarLabelStyle: [
          styles.tabBarLabel,
          isSmallScreen && { fontSize: 9 },
        ],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={isSmallScreen ? 20 : 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={isSmallScreen ? 20 : 24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.scanIconWrapper,
                focused && styles.scanIconWrapperActive,
                isSmallScreen && styles.scanIconWrapperSmall,
              ]}>
              <Ionicons
                name="camera"
                size={isSmallScreen ? 18 : 22}
                color={Colors.light.textInverse}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={isSmallScreen ? 20 : 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.tabBarBorder,
    paddingTop: 6,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  scanIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    // Bring it up slightly so it overlaps the tab bar nicely
    marginTop: -8,
  },
  scanIconWrapperSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginTop: -6,
  },
  scanIconWrapperActive: {
    backgroundColor: Colors.light.primaryDark,
  },
});
