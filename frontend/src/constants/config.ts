import Constants from 'expo-constants';

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://api.hydrationtracker.com/api',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'HydrationTracker',
  VERSION: Constants.expoConfig?.version || '1.0.0',
  BUILD_NUMBER: Constants.expoConfig?.ios?.buildNumber || '1',
  BUNDLE_ID: Constants.expoConfig?.ios?.bundleIdentifier || 'com.hydrationtracker.app',
  
  // Default settings
  DEFAULT_WATER_GOAL: 2000, // ml
  DEFAULT_REMINDER_INTERVAL: 60, // minutes
  MIN_RECORD_AMOUNT: 50, // ml
  MAX_RECORD_AMOUNT: 2000, // ml
  MAX_DAILY_RECORDS: 50,
  
  // Time settings
  DEFAULT_WAKE_TIME: '07:00',
  DEFAULT_SLEEP_TIME: '23:00',
  REMINDER_START_TIME: '07:00',
  REMINDER_END_TIME: '22:00',
  
  // Analytics
  ANALYTICS_ENABLED: !__DEV__,
  CRASH_REPORTING_ENABLED: !__DEV__,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    REMINDERS: {
      id: 'hydration-reminders',
      name: 'Hydration Reminders',
      description: 'Notifications to remind you to drink water',
      importance: 4, // HIGH
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    },
    ACHIEVEMENTS: {
      id: 'achievements',
      name: 'Achievements',
      description: 'Notifications for unlocked achievements',
      importance: 3, // DEFAULT
      sound: 'achievement',
    },
    REPORTS: {
      id: 'weekly-reports',
      name: 'Weekly Reports',
      description: 'Weekly hydration summary reports',
      importance: 2, // LOW
    },
  },
  
  // Default reminder messages
  REMINDER_MESSAGES: [
    '💧 Time to hydrate! Your body will thank you.',
    '🌊 Stay refreshed - drink some water!',
    '💙 Keep the flow going - time for water!',
    '✨ Your hydration goal is waiting for you!',
    '🎯 One step closer to your daily goal!',
    '🌟 Keep up the great hydration habit!',
    '💦 Your cells are calling for water!',
    '🏆 Champions stay hydrated - drink up!',
  ],
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  THEME_PREFERENCE: '@theme_preference',
  LANGUAGE_PREFERENCE: '@language_preference',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  OFFLINE_RECORDS: '@offline_records',
  LAST_SYNC: '@last_sync',
  NOTIFICATION_SETTINGS: '@notification_settings',
  REMINDER_SETTINGS: '@reminder_settings',
  PRIVACY_SETTINGS: '@privacy_settings',
};

// Drink Types Configuration
export const DRINK_TYPES = {
  water: {
    name: 'Water',
    icon: '💧',
    color: '#2196F3',
    hydrationValue: 1.0,
  },
  tea: {
    name: 'Tea',
    icon: '🍵',
    color: '#4CAF50',
    hydrationValue: 0.9,
  },
  coffee: {
    name: 'Coffee',
    icon: '☕',
    color: '#8D6E63',
    hydrationValue: 0.8,
  },
  juice: {
    name: 'Juice',
    icon: '🧃',
    color: '#FF9800',
    hydrationValue: 0.7,
  },
  sports_drink: {
    name: 'Sports Drink',
    icon: '🥤',
    color: '#FF5722',
    hydrationValue: 0.9,
  },
  soda: {
    name: 'Soda',
    icon: '🥤',
    color: '#607D8B',
    hydrationValue: 0.6,
  },
  alcohol: {
    name: 'Alcohol',
    icon: '🍷',
    color: '#9C27B0',
    hydrationValue: -0.2, // Dehydrating
  },
  other: {
    name: 'Other',
    icon: '🥛',
    color: '#9E9E9E',
    hydrationValue: 0.8,
  },
} as const;

// Common drink amounts (ml)
export const QUICK_AMOUNTS = [
  { label: 'Small', value: 250, icon: '🥤' },
  { label: 'Medium', value: 500, icon: '🧃' },
  { label: 'Large', value: 750, icon: '🍼' },
  { label: 'Bottle', value: 1000, icon: '🍶' },
];

// Activity contexts
export const ACTIVITY_CONTEXTS = {
  work: { name: 'Work', icon: '💼', color: '#2196F3' },
  exercise: { name: 'Exercise', icon: '🏃', color: '#FF5722' },
  meal: { name: 'Meal', icon: '🍽️', color: '#4CAF50' },
  wake_up: { name: 'Wake Up', icon: '🌅', color: '#FF9800' },
  before_sleep: { name: 'Before Sleep', icon: '🌙', color: '#9C27B0' },
  break: { name: 'Break', icon: '☕', color: '#8D6E63' },
  other: { name: 'Other', icon: '📋', color: '#607D8B' },
} as const;

// Temperature settings
export const DRINK_TEMPERATURES = {
  hot: { name: 'Hot', icon: '🔥', color: '#F44336' },
  warm: { name: 'Warm', icon: '🌡️', color: '#FF9800' },
  room: { name: 'Room Temp', icon: '🌡️', color: '#4CAF50' },
  cold: { name: 'Cold', icon: '❄️', color: '#2196F3' },
  iced: { name: 'Iced', icon: '🧊', color: '#00BCD4' },
} as const;

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  consistency: { name: 'Consistency', icon: '📅', color: '#4CAF50' },
  volume: { name: 'Volume', icon: '📊', color: '#2196F3' },
  diversity: { name: 'Diversity', icon: '🌈', color: '#FF9800' },
  social: { name: 'Social', icon: '👥', color: '#9C27B0' },
  milestone: { name: 'Milestone', icon: '🏆', color: '#FFD700' },
  seasonal: { name: 'Seasonal', icon: '🎉', color: '#FF5722' },
} as const;

// Chart configurations
export const CHART_CONFIG = {
  colors: {
    primary: '#2196F3',
    secondary: '#03DAC6',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    gradient: ['#2196F3', '#21CBF3'],
  },
  
  // Time periods for statistics
  periods: {
    today: { name: 'Today', days: 1 },
    week: { name: 'This Week', days: 7 },
    month: { name: 'This Month', days: 30 },
    quarter: { name: '3 Months', days: 90 },
    year: { name: 'This Year', days: 365 },
  },
};

// Feature flags
export const FEATURE_FLAGS = {
  SOCIAL_FEATURES: false,
  SMART_CUP_INTEGRATION: false,
  AI_RECOMMENDATIONS: __DEV__ ? true : false,
  PREMIUM_FEATURES: true,
  WEATHER_INTEGRATION: false,
  HEALTH_KIT_INTEGRATION: false,
} as const;

// Error codes and messages
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.AUTH_ERROR]: 'Authentication failed. Please login again.',
  [ERROR_CODES.PERMISSION_ERROR]: 'Permission denied. Please check app permissions.',
  [ERROR_CODES.STORAGE_ERROR]: 'Storage error occurred. Please restart the app.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

// Animation durations (milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
} as const;

// Haptic feedback types
export const HAPTIC_TYPES = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;