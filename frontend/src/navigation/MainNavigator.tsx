import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MainTabParamList } from '@/types';
import { DashboardNavigator } from './DashboardNavigator';
import { RecordsNavigator } from './RecordsNavigator';
import { StatisticsNavigator } from './StatisticsNavigator';
import { ProfileNavigator } from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const theme = useTheme();

  const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Records':
        iconName = focused ? 'list' : 'list-outline';
        break;
      case 'Statistics':
        iconName = focused ? 'analytics' : 'analytics-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
      initialRouteName="Dashboard"
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Records" 
        component={RecordsNavigator}
        options={{
          tabBarLabel: 'Records',
        }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsNavigator}
        options={{
          tabBarLabel: 'Stats',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};