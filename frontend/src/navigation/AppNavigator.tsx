import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '@/providers/AuthProvider';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, user } = useAuth();

  // Show loading screen while initializing auth
  if (!isInitialized) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Check if user needs onboarding (new user without complete profile)
  const needsOnboarding = isAuthenticated && user && (
    !user.daily_water_goal || 
    !user.wake_up_time || 
    !user.sleep_time ||
    !user.height ||
    !user.weight
  );

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false, // Disable swipe back to prevent navigation issues
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};