import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  HydrationState,
  HydrationRecord,
  CreateRecordData,
  DailyProgress,
} from '@/types';
import { HydrationService } from '@/services/HydrationService';
import { RootState } from '@/store';
import moment from 'moment';

// Initial state
const initialState: HydrationState = {
  records: [],
  dailyProgress: null,
  todayIntake: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchRecords = createAsyncThunk(
  'hydration/fetchRecords',
  async (
    params: {
      date?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.getRecords(params, auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch records');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch records');
    }
  }
);

export const fetchDailyProgress = createAsyncThunk(
  'hydration/fetchDailyProgress',
  async (
    date: string = moment().format('YYYY-MM-DD'),
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.getDailyProgress(
        date,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch daily progress');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch daily progress');
    }
  }
);

export const createRecord = createAsyncThunk(
  'hydration/createRecord',
  async (data: CreateRecordData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.createRecord(data, auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create record');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create record');
    }
  }
);

export const updateRecord = createAsyncThunk(
  'hydration/updateRecord',
  async (
    { id, data }: { id: number; data: Partial<CreateRecordData> },
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.updateRecord(
        id,
        data,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update record');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update record');
    }
  }
);

export const deleteRecord = createAsyncThunk(
  'hydration/deleteRecord',
  async (id: number, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.deleteRecord(id, auth.token);

      if (response.success) {
        return id;
      }

      throw new Error(response.message || 'Failed to delete record');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete record');
    }
  }
);

export const syncOfflineRecords = createAsyncThunk(
  'hydration/syncOfflineRecords',
  async (offlineRecords: CreateRecordData[], { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await HydrationService.syncOfflineRecords(
        offlineRecords,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to sync offline records');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync offline records');
    }
  }
);

// Helper function to calculate daily intake
const calculateDailyIntake = (
  records: HydrationRecord[],
  date: string = moment().format('YYYY-MM-DD')
): number => {
  return records
    .filter(record => moment(record.recorded_at).format('YYYY-MM-DD') === date)
    .reduce((total, record) => total + record.amount, 0);
};

// Hydration slice
const hydrationSlice = createSlice({
  name: 'hydration',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addOfflineRecord: (state, action: PayloadAction<CreateRecordData>) => {
      // Add a temporary record for offline mode
      const tempRecord: HydrationRecord = {
        id: Date.now(), // Temporary ID
        user_id: 0, // Will be set when synced
        amount: action.payload.amount,
        drink_type: action.payload.drink_type,
        drink_name: action.payload.drink_name,
        recorded_at: action.payload.recorded_at || moment().toISOString(),
        location: action.payload.location,
        activity_context: action.payload.activity_context,
        temperature: action.payload.temperature || 'room',
        source: 'manual',
        created_at: moment().toISOString(),
        updated_at: moment().toISOString(),
      };

      state.records.unshift(tempRecord);
      state.todayIntake = calculateDailyIntake(state.records);

      // Update daily progress if exists
      if (
        state.dailyProgress &&
        moment(tempRecord.recorded_at).format('YYYY-MM-DD') ===
          moment().format('YYYY-MM-DD')
      ) {
        state.dailyProgress.total_intake += tempRecord.amount;
        state.dailyProgress.records.push(tempRecord);
        state.dailyProgress.achievement_rate = Math.min(
          (state.dailyProgress.total_intake / state.dailyProgress.goal) * 100,
          100
        );
      }
    },
    updateTodayIntake: state => {
      state.todayIntake = calculateDailyIntake(state.records);
    },
  },
  extraReducers: builder => {
    // Fetch records
    builder
      .addCase(fetchRecords.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload;
        state.todayIntake = calculateDailyIntake(action.payload);
        state.lastUpdated = moment().toISOString();
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch daily progress
    builder
      .addCase(fetchDailyProgress.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyProgress = action.payload;
        state.todayIntake = action.payload.total_intake;
        state.lastUpdated = moment().toISOString();
      })
      .addCase(fetchDailyProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create record
    builder
      .addCase(createRecord.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRecord.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add new record to the beginning of the array
        state.records.unshift(action.payload);

        // Update today's intake if the record is for today
        const recordDate = moment(action.payload.recorded_at).format(
          'YYYY-MM-DD'
        );
        const today = moment().format('YYYY-MM-DD');

        if (recordDate === today) {
          state.todayIntake += action.payload.amount;

          // Update daily progress if exists
          if (state.dailyProgress) {
            state.dailyProgress.total_intake += action.payload.amount;
            state.dailyProgress.records.push(action.payload);
            state.dailyProgress.achievement_rate = Math.min(
              (state.dailyProgress.total_intake / state.dailyProgress.goal) *
                100,
              100
            );
          }
        }

        state.lastUpdated = moment().toISOString();
      })
      .addCase(createRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update record
    builder
      .addCase(updateRecord.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRecord.fulfilled, (state, action) => {
        state.isLoading = false;

        // Find and update the record
        const index = state.records.findIndex(
          record => record.id === action.payload.id
        );
        if (index !== -1) {
          const oldAmount = state.records[index].amount;
          const newAmount = action.payload.amount;
          const recordDate = moment(action.payload.recorded_at).format(
            'YYYY-MM-DD'
          );
          const today = moment().format('YYYY-MM-DD');

          state.records[index] = action.payload;

          // Update today's intake if the record is for today
          if (recordDate === today) {
            state.todayIntake = state.todayIntake - oldAmount + newAmount;

            // Update daily progress if exists
            if (state.dailyProgress) {
              state.dailyProgress.total_intake =
                state.dailyProgress.total_intake - oldAmount + newAmount;
              state.dailyProgress.achievement_rate = Math.min(
                (state.dailyProgress.total_intake / state.dailyProgress.goal) *
                  100,
                100
              );

              // Update the record in daily progress
              const progressRecordIndex = state.dailyProgress.records.findIndex(
                r => r.id === action.payload.id
              );
              if (progressRecordIndex !== -1) {
                state.dailyProgress.records[progressRecordIndex] =
                  action.payload;
              }
            }
          }
        }

        state.lastUpdated = moment().toISOString();
      })
      .addCase(updateRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete record
    builder
      .addCase(deleteRecord.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.isLoading = false;

        // Find and remove the record
        const index = state.records.findIndex(
          record => record.id === action.payload
        );
        if (index !== -1) {
          const deletedRecord = state.records[index];
          const recordDate = moment(deletedRecord.recorded_at).format(
            'YYYY-MM-DD'
          );
          const today = moment().format('YYYY-MM-DD');

          state.records.splice(index, 1);

          // Update today's intake if the record was for today
          if (recordDate === today) {
            state.todayIntake -= deletedRecord.amount;

            // Update daily progress if exists
            if (state.dailyProgress) {
              state.dailyProgress.total_intake -= deletedRecord.amount;
              state.dailyProgress.achievement_rate = Math.min(
                (state.dailyProgress.total_intake / state.dailyProgress.goal) *
                  100,
                100
              );

              // Remove the record from daily progress
              state.dailyProgress.records = state.dailyProgress.records.filter(
                r => r.id !== action.payload
              );
            }
          }
        }

        state.lastUpdated = moment().toISOString();
      })
      .addCase(deleteRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Sync offline records
    builder
      .addCase(syncOfflineRecords.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncOfflineRecords.fulfilled, (state, action) => {
        state.isLoading = false;

        // Replace temporary offline records with synced ones
        const syncedRecords = action.payload;

        // Remove temporary records (those with timestamp IDs)
        state.records = state.records.filter(
          record => !Number.isInteger(record.id) || record.id < 1000000000000
        );

        // Add synced records
        state.records.unshift(...syncedRecords);

        // Recalculate today's intake
        state.todayIntake = calculateDailyIntake(state.records);
        state.lastUpdated = moment().toISOString();
      })
      .addCase(syncOfflineRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, addOfflineRecord, updateTodayIntake } =
  hydrationSlice.actions;
export default hydrationSlice.reducer;
