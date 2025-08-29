import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import { theme } from '@/constants/theme';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showLogo = true,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {showLogo && (
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.logoContainer}
          >
            <Text style={styles.logo}>💧</Text>
          </Animatable.View>
        )}

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
