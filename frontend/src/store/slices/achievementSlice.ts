import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AchievementState, Achievement, UserAchievement } from '@/types';
import { AchievementService } from '@/services/AchievementService';
import { RootState } from '@/store';

// Initial state
const initialState: AchievementState = {
  achievements: [],
  userAchievements: [],
  recentAchievements: [],
  totalPoints: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAchievements = createAsyncThunk(
  'achievements/fetchAchievements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.getAllAchievements(auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch achievements');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch achievements');
    }
  }
);

export const fetchUserAchievements = createAsyncThunk(
  'achievements/fetchUserAchievements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.getUserAchievements(auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch user achievements');
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch user achievements'
      );
    }
  }
);

export const fetchRecentAchievements = createAsyncThunk(
  'achievements/fetchRecentAchievements',
  async (limit: number = 5, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.getRecentAchievements(
        limit,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.message || 'Failed to fetch recent achievements'
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch recent achievements'
      );
    }
  }
);

export const checkAchievements = createAsyncThunk(
  'achievements/checkAchievements',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.checkAchievements(auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to check achievements');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check achievements');
    }
  }
);

export const updateAchievementPreferences = createAsyncThunk(
  'achievements/updatePreferences',
  async (
    preferences: {
      achievementId: number;
      isDisplayed?: boolean;
      isFavorite?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.updateAchievementPreferences(
        preferences,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(
        response.message || 'Failed to update achievement preferences'
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to update achievement preferences'
      );
    }
  }
);

export const shareAchievement = createAsyncThunk(
  'achievements/shareAchievement',
  async (achievementId: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await AchievementService.shareAchievement(
        achievementId,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to share achievement');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to share achievement');
    }
  }
);

// Helper functions
const calculateTotalPoints = (userAchievements: UserAchievement[]): number => {
  return userAchievements.reduce((total, userAchievement) => {
    return total + userAchievement.achievement.points;
  }, 0);
};

const sortAchievementsByDate = (
  achievements: UserAchievement[]
): UserAchievement[] => {
  return [...achievements].sort(
    (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime()
  );
};

// Achievement slice
const achievementSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNewAchievement: (state, action: PayloadAction<UserAchievement>) => {
      // Add newly earned achievement
      state.userAchievements.push(action.payload);
      state.recentAchievements.unshift(action.payload);

      // Keep only the 5 most recent
      if (state.recentAchievements.length > 5) {
        state.recentAchievements = state.recentAchievements.slice(0, 5);
      }

      // Recalculate total points
      state.totalPoints = calculateTotalPoints(state.userAchievements);
    },
    markAchievementAsSeen: (state, action: PayloadAction<number>) => {
      // Mark achievement as seen (for UI purposes)
      const index = state.recentAchievements.findIndex(
        achievement => achievement.id === action.payload
      );

      if (index !== -1) {
        // Could add a 'seen' flag if needed
        // For now, we'll just acknowledge it's been seen
      }
    },
    clearRecentAchievements: state => {
      state.recentAchievements = [];
    },
    updateAchievementDisplay: (
      state,
      action: PayloadAction<{
        achievementId: number;
        isDisplayed: boolean;
      }>
    ) => {
      const { achievementId, isDisplayed } = action.payload;

      const index = state.userAchievements.findIndex(
        ua => ua.achievement_id === achievementId
      );

      if (index !== -1) {
        state.userAchievements[index].is_displayed = isDisplayed;
      }
    },
    updateAchievementFavorite: (
      state,
      action: PayloadAction<{
        achievementId: number;
        isFavorite: boolean;
      }>
    ) => {
      const { achievementId, isFavorite } = action.payload;

      const index = state.userAchievements.findIndex(
        ua => ua.achievement_id === achievementId
      );

      if (index !== -1) {
        state.userAchievements[index].is_favorite = isFavorite;
      }
    },
  },
  extraReducers: builder => {
    // Fetch all achievements
    builder
      .addCase(fetchAchievements.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user achievements
    builder
      .addCase(fetchUserAchievements.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userAchievements = sortAchievementsByDate(action.payload);
        state.totalPoints = calculateTotalPoints(action.payload);
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch recent achievements
    builder
      .addCase(fetchRecentAchievements.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentAchievements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentAchievements = action.payload;
      })
      .addCase(fetchRecentAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check achievements
    builder
      .addCase(checkAchievements.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add newly earned achievements
        if (
          action.payload.newAchievements &&
          action.payload.newAchievements.length > 0
        ) {
          action.payload.newAchievements.forEach(
            (achievement: UserAchievement) => {
              // Check if achievement already exists
              const exists = state.userAchievements.find(
                ua => ua.id === achievement.id
              );
              if (!exists) {
                state.userAchievements.push(achievement);
                state.recentAchievements.unshift(achievement);
              }
            }
          );

          // Keep only the 5 most recent
          if (state.recentAchievements.length > 5) {
            state.recentAchievements = state.recentAchievements.slice(0, 5);
          }

          // Recalculate total points
          state.totalPoints = calculateTotalPoints(state.userAchievements);

          // Sort achievements by date
          state.userAchievements = sortAchievementsByDate(
            state.userAchievements
          );
        }
      })
      .addCase(checkAchievements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update achievement preferences
    builder
      .addCase(updateAchievementPreferences.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAchievementPreferences.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update the achievement in the list
        const index = state.userAchievements.findIndex(
          ua => ua.id === action.payload.id
        );

        if (index !== -1) {
          state.userAchievements[index] = action.payload;
        }
      })
      .addCase(updateAchievementPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Share achievement
    builder
      .addCase(shareAchievement.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shareAchievement.fulfilled, state => {
        state.isLoading = false;
        // Sharing doesn't change local state
      })
      .addCase(shareAchievement.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setLoading,
  addNewAchievement,
  markAchievementAsSeen,
  clearRecentAchievements,
  updateAchievementDisplay,
  updateAchievementFavorite,
} = achievementSlice.actions;
export default achievementSlice.reducer;
