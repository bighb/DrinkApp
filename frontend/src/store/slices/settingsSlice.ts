import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState } from '@/types';
import { StorageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/constants/config';

// Initial state
const initialState: SettingsState = {
  theme: 'system',
  language: 'en',
  notifications: {
    reminders: true,
    achievements: true,
    weekly_reports: true,
    marketing: false,
  },
  privacy: {
    data_sharing: false,
    analytics: true,
    crash_reports: true,
  },
  sync: {
    auto_sync: true,
    wifi_only: false,
    last_sync: null,
  },
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Load settings from storage
      const notificationSettings = await StorageService.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      const privacySettings = await StorageService.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      const themePreference = await StorageService.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      const languagePreference = await StorageService.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
      const lastSync = await StorageService.getItem(STORAGE_KEYS.LAST_SYNC);
      
      const settings: Partial<SettingsState> = {};
      
      if (notificationSettings) {
        settings.notifications = JSON.parse(notificationSettings);
      }
      
      if (privacySettings) {
        settings.privacy = JSON.parse(privacySettings);
      }
      
      if (themePreference) {
        settings.theme = themePreference as 'light' | 'dark' | 'system';
      }
      
      if (languagePreference) {
        settings.language = languagePreference;
      }
      
      if (lastSync) {
        settings.sync = {
          ...initialState.sync,
          last_sync: lastSync,
        };
      }
      
      return settings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load settings');
    }
  }
);

export const saveNotificationSettings = createAsyncThunk(
  'settings/saveNotificationSettings',
  async (notifications: SettingsState['notifications'], { rejectWithValue }) => {
    try {
      await StorageService.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(notifications));
      return notifications;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save notification settings');
    }
  }
);

export const savePrivacySettings = createAsyncThunk(
  'settings/savePrivacySettings',
  async (privacy: SettingsState['privacy'], { rejectWithValue }) => {
    try {
      await StorageService.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(privacy));
      return privacy;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save privacy settings');
    }
  }
);

export const saveThemePreference = createAsyncThunk(
  'settings/saveThemePreference',
  async (theme: SettingsState['theme'], { rejectWithValue }) => {
    try {
      await StorageService.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
      return theme;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save theme preference');
    }
  }
);

export const saveLanguagePreference = createAsyncThunk(
  'settings/saveLanguagePreference',
  async (language: string, { rejectWithValue }) => {
    try {
      await StorageService.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
      return language;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save language preference');
    }
  }
);

export const updateLastSync = createAsyncThunk(
  'settings/updateLastSync',
  async (timestamp: string, { rejectWithValue }) => {
    try {
      await StorageService.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
      return timestamp;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update last sync');
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/resetSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Clear all settings from storage
      await StorageService.removeItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      await StorageService.removeItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      await StorageService.removeItem(STORAGE_KEYS.THEME_PREFERENCE);
      await StorageService.removeItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
      await StorageService.removeItem(STORAGE_KEYS.LAST_SYNC);
      
      return initialState;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reset settings');
    }
  }
);

export const exportSettings = createAsyncThunk(
  'settings/exportSettings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { settings } = getState() as { settings: SettingsState };
      
      const settingsToExport = {
        theme: settings.theme,
        language: settings.language,
        notifications: settings.notifications,
        privacy: settings.privacy,
        sync: {
          auto_sync: settings.sync.auto_sync,
          wifi_only: settings.sync.wifi_only,
          // Don't export last_sync timestamp
        },
        exported_at: new Date().toISOString(),
      };
      
      return settingsToExport;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export settings');
    }
  }
);

export const importSettings = createAsyncThunk(
  'settings/importSettings',
  async (settingsData: Partial<SettingsState>, { dispatch, rejectWithValue }) => {
    try {
      // Validate and sanitize imported settings
      const validatedSettings: Partial<SettingsState> = {};
      
      if (settingsData.theme && ['light', 'dark', 'system'].includes(settingsData.theme)) {
        validatedSettings.theme = settingsData.theme;
        await dispatch(saveThemePreference(settingsData.theme));
      }
      
      if (settingsData.language && typeof settingsData.language === 'string') {
        validatedSettings.language = settingsData.language;
        await dispatch(saveLanguagePreference(settingsData.language));
      }
      
      if (settingsData.notifications && typeof settingsData.notifications === 'object') {
        validatedSettings.notifications = {
          ...initialState.notifications,
          ...settingsData.notifications,
        };
        await dispatch(saveNotificationSettings(validatedSettings.notifications));
      }
      
      if (settingsData.privacy && typeof settingsData.privacy === 'object') {
        validatedSettings.privacy = {
          ...initialState.privacy,
          ...settingsData.privacy,
        };
        await dispatch(savePrivacySettings(validatedSettings.privacy));
      }
      
      if (settingsData.sync && typeof settingsData.sync === 'object') {
        validatedSettings.sync = {
          ...initialState.sync,
          ...settingsData.sync,
          last_sync: null, // Don't import last_sync
        };
      }
      
      return validatedSettings;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to import settings');
    }
  }
);

// Settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<SettingsState['privacy']>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    updateSyncSettings: (state, action: PayloadAction<Partial<SettingsState['sync']>>) => {
      state.sync = { ...state.sync, ...action.payload };
    },
    toggleNotificationSetting: (state, action: PayloadAction<keyof SettingsState['notifications']>) => {
      const key = action.payload;
      state.notifications[key] = !state.notifications[key];
    },
    togglePrivacySetting: (state, action: PayloadAction<keyof SettingsState['privacy']>) => {
      const key = action.payload;
      state.privacy[key] = !state.privacy[key];
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.sync.last_sync = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load settings
    builder
      .addCase(loadSettings.fulfilled, (state, action) => {
        // Merge loaded settings with current state
        Object.assign(state, action.payload);
      });

    // Save notification settings
    builder
      .addCase(saveNotificationSettings.fulfilled, (state, action) => {
        state.notifications = action.payload;
      });

    // Save privacy settings
    builder
      .addCase(savePrivacySettings.fulfilled, (state, action) => {
        state.privacy = action.payload;
      });

    // Save theme preference
    builder
      .addCase(saveThemePreference.fulfilled, (state, action) => {
        state.theme = action.payload;
      });

    // Save language preference
    builder
      .addCase(saveLanguagePreference.fulfilled, (state, action) => {
        state.language = action.payload;
      });

    // Update last sync
    builder
      .addCase(updateLastSync.fulfilled, (state, action) => {
        state.sync.last_sync = action.payload;
      });

    // Reset settings
    builder
      .addCase(resetSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });

    // Import settings
    builder
      .addCase(importSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });
  },
});

export const {
  setTheme,
  setLanguage,
  updateNotificationSettings,
  updatePrivacySettings,
  updateSyncSettings,
  toggleNotificationSetting,
  togglePrivacySetting,
  setLastSync,
} = settingsSlice.actions;

export default settingsSlice.reducer;