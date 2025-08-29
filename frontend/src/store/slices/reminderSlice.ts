import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReminderState, ReminderSetting, ReminderLog } from '@/types';
import { ReminderService } from '@/services/ReminderService';
import { RootState } from '@/store';
import moment from 'moment';

// Initial state
const initialState: ReminderState = {
  settings: null,
  logs: [],
  nextReminder: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchReminderSettings = createAsyncThunk(
  'reminders/fetchSettings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.getSettings(auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch reminder settings');
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to fetch reminder settings'
      );
    }
  }
);

export const updateReminderSettings = createAsyncThunk(
  'reminders/updateSettings',
  async (settings: Partial<ReminderSetting>, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.updateSettings(
        settings,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update reminder settings');
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Failed to update reminder settings'
      );
    }
  }
);

export const fetchReminderLogs = createAsyncThunk(
  'reminders/fetchLogs',
  async (
    params: {
      startDate?: string;
      endDate?: string;
      status?: string;
      limit?: number;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.getLogs(params, auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch reminder logs');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reminder logs');
    }
  }
);

export const respondToReminder = createAsyncThunk(
  'reminders/respondToReminder',
  async (
    {
      logId,
      responseType,
      amount,
    }: {
      logId: number;
      responseType: 'drink_logged' | 'snooze_5min' | 'snooze_15min' | 'dismiss';
      amount?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.respondToReminder(
        logId,
        responseType,
        amount,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to respond to reminder');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to respond to reminder');
    }
  }
);

export const scheduleReminder = createAsyncThunk(
  'reminders/scheduleReminder',
  async (scheduledAt: string, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.scheduleReminder(
        scheduledAt,
        auth.token
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to schedule reminder');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to schedule reminder');
    }
  }
);

export const getNextReminder = createAsyncThunk(
  'reminders/getNextReminder',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;

      if (!auth.token) {
        throw new Error('No authentication token');
      }

      const response = await ReminderService.getNextReminder(auth.token);

      if (response.success && response.data) {
        return response.data;
      }

      // It's okay if there's no next reminder
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get next reminder');
    }
  }
);

// Reminder slice
const reminderSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearNextReminder: state => {
      state.nextReminder = null;
    },
    updateLocalSettings: (
      state,
      action: PayloadAction<Partial<ReminderSetting>>
    ) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload };
      }
    },
    addPendingLog: (state, action: PayloadAction<Partial<ReminderLog>>) => {
      // Add a pending reminder log for immediate UI feedback
      const pendingLog: ReminderLog = {
        id: Date.now(), // Temporary ID
        user_id: action.payload.user_id || 0,
        reminder_setting_id: action.payload.reminder_setting_id || null,
        scheduled_at: action.payload.scheduled_at || moment().toISOString(),
        sent_at: null,
        message: action.payload.message || 'Time to drink water!',
        notification_type: action.payload.notification_type || 'push',
        status: 'scheduled',
        response_type: null,
        responded_at: null,
        context: action.payload.context || null,
      };

      state.logs.unshift(pendingLog);
      state.nextReminder = pendingLog;
    },
  },
  extraReducers: builder => {
    // Fetch reminder settings
    builder
      .addCase(fetchReminderSettings.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReminderSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchReminderSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update reminder settings
    builder
      .addCase(updateReminderSettings.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReminderSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateReminderSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch reminder logs
    builder
      .addCase(fetchReminderLogs.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReminderLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload;

        // Find the next pending reminder
        const nextReminder = action.payload.find(
          log =>
            log.status === 'scheduled' && moment(log.scheduled_at).isAfter()
        );
        state.nextReminder = nextReminder || null;
      })
      .addCase(fetchReminderLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Respond to reminder
    builder
      .addCase(respondToReminder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToReminder.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update the log entry
        const index = state.logs.findIndex(log => log.id === action.payload.id);
        if (index !== -1) {
          state.logs[index] = action.payload;
        }

        // Clear next reminder if this was it
        if (state.nextReminder && state.nextReminder.id === action.payload.id) {
          state.nextReminder = null;
        }
      })
      .addCase(respondToReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Schedule reminder
    builder
      .addCase(scheduleReminder.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleReminder.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add the scheduled reminder to logs
        state.logs.unshift(action.payload);

        // Set as next reminder if it's the earliest
        if (
          !state.nextReminder ||
          moment(action.payload.scheduled_at).isBefore(
            moment(state.nextReminder.scheduled_at)
          )
        ) {
          state.nextReminder = action.payload;
        }
      })
      .addCase(scheduleReminder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get next reminder
    builder
      .addCase(getNextReminder.fulfilled, (state, action) => {
        state.nextReminder = action.payload;
      })
      .addCase(getNextReminder.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setLoading,
  clearNextReminder,
  updateLocalSettings,
  addPendingLog,
} = reminderSlice.actions;
export default reminderSlice.reducer;
