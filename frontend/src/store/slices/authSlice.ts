import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileData,
} from '@/types';
import { AuthService } from '@/services/AuthService';
import { StorageService } from '@/services/StorageService';
import { STORAGE_KEYS } from '@/constants/config';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // Store tokens securely
        await StorageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
        await StorageService.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          refreshToken
        );
        await StorageService.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(user)
        );

        return { user, token, refreshToken };
      }

      throw new Error(response.message || 'Login failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(credentials);

      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;

        // Store tokens securely
        await StorageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
        await StorageService.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          refreshToken
        );
        await StorageService.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(user)
        );

        return { user, token, refreshToken };
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      if (!auth.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await AuthService.refreshToken(auth.refreshToken);

      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data;

        // Update stored tokens
        await StorageService.setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
        await StorageService.setSecureItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          newRefreshToken
        );

        return { token, refreshToken: newRefreshToken };
      }

      throw new Error(response.message || 'Token refresh failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const token = await StorageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      const refreshTokenValue = await StorageService.getSecureItem(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      const userDataString = await StorageService.getItem(
        STORAGE_KEYS.USER_DATA
      );

      if (token && refreshTokenValue && userDataString) {
        const user = JSON.parse(userDataString);
        return { user, token, refreshToken: refreshTokenValue };
      }

      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stored auth');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      // Call logout API if user is authenticated
      if (auth.isAuthenticated && auth.token) {
        await AuthService.logout(auth.token);
      }
    } catch (error) {
      // Logout locally even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear stored data
      await StorageService.removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      await StorageService.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      await StorageService.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: UpdateProfileData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AuthService.updateProfile(data, auth.token);

      if (response.success && response.data) {
        // Update stored user data
        await StorageService.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data)
        );
        return response.data;
      }

      throw new Error(response.message || 'Profile update failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.verifyEmail(token);

      if (response.success) {
        return response.data;
      }

      throw new Error(response.message || 'Email verification failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Email verification failed');
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.requestPasswordReset(email);

      if (response.success) {
        return response.message;
      }

      throw new Error(response.message || 'Password reset request failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset request failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, password }: { token: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await AuthService.resetPassword(token, password);

      if (response.success) {
        return response.message;
      }

      throw new Error(response.message || 'Password reset failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshToken.rejected, state => {
        // Token refresh failed, logout user
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, state => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, state => {
        state.isLoading = false;
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, state => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Update profile
    builder
      .addCase(updateProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, state => {
        state.isLoading = false;
        if (state.user) {
          state.user.email_verified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Password reset request
    builder
      .addCase(requestPasswordReset.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Password reset
    builder
      .addCase(resetPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
