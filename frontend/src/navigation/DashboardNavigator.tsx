import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

import { DashboardStackParamList } from '@/types';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { QuickRecordScreen } from '@/screens/dashboard/QuickRecordScreen';
import { RecordDetailsScreen } from '@/screens/dashboard/RecordDetailsScreen';

const Stack = createStackNavigator<DashboardStackParamList>();

export const DashboardNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="DashboardHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.onSurface,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{
          headerShown: false, // Dashboard will have its own custom header
        }}
      />
      <Stack.Screen
        name="QuickRecord"
        component={QuickRecordScreen}
        options={{
          headerTitle: 'Add Water',
          presentation: 'modal',
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      />
      <Stack.Screen
        name="RecordDetails"
        component={RecordDetailsScreen}
        options={{
          headerTitle: 'Record Details',
        }}
      />
    </Stack.Navigator>
  );
};