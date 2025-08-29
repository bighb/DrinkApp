import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Import slices
import authSlice from './slices/authSlice';
import hydrationSlice from './slices/hydrationSlice';
import reminderSlice from './slices/reminderSlice';
import statisticsSlice from './slices/statisticsSlice';
import achievementSlice from './slices/achievementSlice';
import settingsSlice from './slices/settingsSlice';
import uiSlice from './slices/uiSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'settings'], // Only persist auth and settings
  blacklist: ['ui'], // Don't persist UI state
};

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'token', 'refreshToken', 'isAuthenticated'],
};

const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

// Root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  hydration: hydrationSlice,
  reminders: reminderSlice,
  statistics: statisticsSlice,
  achievements: achievementSlice,
  settings: persistReducer(settingsPersistConfig, settingsSlice),
  ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
      immutableCheck: {
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
