import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';

import { theme } from '@/constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can log the error to your error reporting service here
    // For example: Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRestart = () => {
    // In a real app, you might want to restart the app or navigate to home
    this.handleRetry();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Animatable.View
              animation="bounceIn"
              duration={1000}
              style={styles.iconContainer}
            >
              <Text style={styles.errorIcon}>⚠️</Text>
            </Animatable.View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is
              safe.
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={this.handleRetry}
                style={[styles.button, styles.primaryButton]}
                contentStyle={styles.buttonContent}
              >
                Try Again
              </Button>

              <Button
                mode="outlined"
                onPress={this.handleRestart}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Restart App
              </Button>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

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
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  debugContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
