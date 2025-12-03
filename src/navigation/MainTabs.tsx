import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import GuestsScreen from '../screens/GuestsScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PremiumScreen from '../screens/PremiumScreen';

// Minimal text-based "icons" as short labels
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
    <Text style={[styles.iconLabel, focused && styles.iconLabelFocused]}>{label}</Text>
  </View>
);

export type MainTabParamList = {
  Home: undefined;
  Guests: undefined;
  Stats: undefined;
  Premium: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#050816',
        },
        headerTitleStyle: {
          color: '#F9FAFB',
          fontSize: 18,
          fontWeight: '700',
        },
        headerShadowVisible: false,
        headerTintColor: '#E5E7EB',
        tabBarActiveTintColor: '#E5E7EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: 'rgba(15, 23, 42, 0.85)',
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => <TabIcon label="Дом" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Guests"
        component={GuestsScreen}
        options={{
          title: 'Гости',
          tabBarIcon: ({ focused }) => <TabIcon label="Гости" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Статистика',
          tabBarIcon: ({ focused }) => <TabIcon label="Статы" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          title: 'Premium',
          tabBarIcon: ({ focused }) => <TabIcon label="PRO" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ focused }) => <TabIcon label="Профиль" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(79, 70, 229, 0.16)',
  },
  iconLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  iconLabelFocused: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
});
