import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Animatable from 'react-native-animatable';

import { theme } from '@/constants/theme';
import { AuthStackParamList, LoginCredentials } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/slices/authSlice';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(credentials.email);
    const isPasswordValid = validatePassword(credentials.password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await dispatch(loginUser(credentials)).unwrap();
      // Navigation will be handled by AuthProvider/AppNavigator
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleInputChange = (
    field: keyof LoginCredentials,
    value: string | boolean
  ) => {
    setCredentials(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (field === 'email' && emailError) {
      setEmailError('');
    }
    if (field === 'password' && passwordError) {
      setPasswordError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo and Welcome */}
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            style={styles.header}
          >
            <Text style={styles.logo}>💧</Text>
            <Text style={styles.title}>HydrationTracker</Text>
            <Text style={styles.subtitle}>
              Welcome back! Sign in to continue
            </Text>
          </Animatable.View>

          {/* Login Form */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={200}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.formTitle}>Sign In</Text>

                {/* Email Input */}
                <TextInput
                  mode="outlined"
                  label="Email"
                  value={credentials.email}
                  onChangeText={text => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}

                {/* Password Input */}
                <TextInput
                  mode="outlined"
                  label="Password"
                  value={credentials.password}
                  onChangeText={text => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  error={!!passwordError}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}

                {/* Forgot Password Link */}
                <Button
                  mode="text"
                  onPress={handleForgotPassword}
                  style={styles.forgotButton}
                  compact
                >
                  Forgot Password?
                </Button>

                {/* Login Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  contentStyle={styles.loginButtonContent}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Divider style={styles.divider} />

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <Button
                    mode="text"
                    onPress={handleSignUp}
                    compact
                    style={styles.signUpButton}
                  >
                    Sign Up
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => dispatch(clearError())}
        duration={4000}
        style={styles.errorSnackbar}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    elevation: 4,
  },
  cardContent: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.onSurface,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    marginBottom: theme.spacing.md,
  },
  loginButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  divider: {
    marginVertical: theme.spacing.lg,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: theme.colors.onSurfaceVariant,
  },
  signUpButton: {
    marginLeft: -theme.spacing.sm,
  },
  errorSnackbar: {
    backgroundColor: theme.colors.errorContainer,
  },
});
