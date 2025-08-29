import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { LogBox, Platform, StyleSheet } from 'react-native';

import { store, persistor } from '@/store';
import { AppNavigator } from '@/navigation/AppNavigator';
import { NotificationService } from '@/services/NotificationService';
import { theme } from '@/constants/theme';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { NetworkStatusProvider } from '@/providers/NetworkStatusProvider';
import { AuthProvider } from '@/providers/AuthProvider';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ignore specific warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'VirtualizedLists should never be nested',
  ]);
}

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      if (Device.isDevice) {
        await NotificationService.initialize();
      }
    };

    setupNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <ReduxProvider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <PaperProvider theme={theme}>
              <SafeAreaProvider>
                <NetworkStatusProvider>
                  <AuthProvider>
                    <NavigationContainer>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </NavigationContainer>
                  </AuthProvider>
                </NetworkStatusProvider>
              </SafeAreaProvider>
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});