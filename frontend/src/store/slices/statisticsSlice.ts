import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StatisticsState, UserStatistics, ChartDataPoint } from '@/types';
import { StatisticsService } from '@/services/StatisticsService';
import { RootState } from '@/store';
import moment from 'moment';

// Initial state
const initialState: StatisticsState = {
  daily: [],
  weekly: [],
  monthly: [],
  selectedPeriod: 'daily',
  dateRange: {
    start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    end: moment().format('YYYY-MM-DD'),
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchStatistics = createAsyncThunk(
  'statistics/fetchStatistics',
  async (params: {
    type: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
  }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const response = await StatisticsService.getStatistics(params, auth.token);
      
      if (response.success && response.data) {
        return { type: params.type, data: response.data };
      }
      
      throw new Error(response.message || 'Failed to fetch statistics');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch statistics');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'statistics/fetchDashboardStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const response = await StatisticsService.getDashboardStats(auth.token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchWeeklyReport = createAsyncThunk(
  'statistics/fetchWeeklyReport',
  async (weekStart?: string, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const startDate = weekStart || moment().startOf('week').format('YYYY-MM-DD');
      const response = await StatisticsService.getWeeklyReport(startDate, auth.token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch weekly report');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weekly report');
    }
  }
);

export const fetchMonthlyReport = createAsyncThunk(
  'statistics/fetchMonthlyReport',
  async (monthStart?: string, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const startDate = monthStart || moment().startOf('month').format('YYYY-MM-DD');
      const response = await StatisticsService.getMonthlyReport(startDate, auth.token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch monthly report');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch monthly report');
    }
  }
);

export const fetchHydrationTrends = createAsyncThunk(
  'statistics/fetchHydrationTrends',
  async (params: {
    period: 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const response = await StatisticsService.getHydrationTrends(params, auth.token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch hydration trends');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch hydration trends');
    }
  }
);

export const exportStatistics = createAsyncThunk(
  'statistics/exportStatistics',
  async (params: {
    format: 'csv' | 'pdf' | 'json';
    startDate: string;
    endDate: string;
    includeCharts?: boolean;
  }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as RootState;
      
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      const response = await StatisticsService.exportStatistics(params, auth.token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to export statistics');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export statistics');
    }
  }
);

// Statistics slice
const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSelectedPeriod: (state, action: PayloadAction<'daily' | 'weekly' | 'monthly'>) => {
      state.selectedPeriod = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload;
    },
    clearStatistics: (state) => {
      state.daily = [];
      state.weekly = [];
      state.monthly = [];
    },
    // Local statistics calculation for offline mode
    calculateLocalStats: (state, action: PayloadAction<{
      records: any[];
      userGoal: number;
    }>) => {
      const { records, userGoal } = action.payload;
      const today = moment().format('YYYY-MM-DD');
      
      // Calculate today's stats
      const todayRecords = records.filter(record => 
        moment(record.recorded_at).format('YYYY-MM-DD') === today
      );
      
      const totalIntake = todayRecords.reduce((sum, record) => sum + record.amount, 0);
      const recordCount = todayRecords.length;
      const achievementRate = Math.min((totalIntake / userGoal) * 100, 100);
      
      // Calculate drink type percentages
      const drinkTypeCounts = todayRecords.reduce((acc, record) => {
        acc[record.drink_type] = (acc[record.drink_type] || 0) + record.amount;
        return acc;
      }, {});
      
      const waterPercentage = ((drinkTypeCounts.water || 0) / totalIntake) * 100 || 0;
      const teaPercentage = ((drinkTypeCounts.tea || 0) / totalIntake) * 100 || 0;
      const coffeePercentage = ((drinkTypeCounts.coffee || 0) / totalIntake) * 100 || 0;
      const otherPercentage = 100 - waterPercentage - teaPercentage - coffeePercentage;
      
      // Calculate time distribution
      const timeDistribution = todayRecords.reduce((acc, record) => {
        const hour = moment(record.recorded_at).hour();
        if (hour < 12) acc.morning += record.amount;
        else if (hour < 18) acc.afternoon += record.amount;
        else acc.evening += record.amount;
        return acc;
      }, { morning: 0, afternoon: 0, evening: 0 });
      
      // Create local daily stat
      const localDailyStat: UserStatistics = {
        id: 0,
        user_id: 0,
        stat_date: today,
        stat_type: 'daily',
        total_intake: totalIntake,
        goal_achievement_rate: achievementRate,
        record_count: recordCount,
        water_percentage: waterPercentage,
        tea_percentage: teaPercentage,
        coffee_percentage: coffeePercentage,
        other_percentage: otherPercentage,
        morning_intake: timeDistribution.morning,
        afternoon_intake: timeDistribution.afternoon,
        evening_intake: timeDistribution.evening,
        avg_interval_minutes: 0, // Calculate if needed
        most_common_amount: 0, // Calculate if needed
        peak_hour: 0, // Calculate if needed
        reminder_count: 0,
        reminder_response_rate: 0,
        consistency_score: achievementRate,
        health_score: Math.min(achievementRate, 100),
        created_at: moment().toISOString(),
        updated_at: moment().toISOString(),
      };
      
      // Update or add today's stat
      const existingIndex = state.daily.findIndex(stat => stat.stat_date === today);
      if (existingIndex !== -1) {
        state.daily[existingIndex] = localDailyStat;
      } else {
        state.daily.unshift(localDailyStat);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch statistics
    builder
      .addCase(fetchStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        const { type, data } = action.payload;
        
        switch (type) {
          case 'daily':
            state.daily = data;
            break;
          case 'weekly':
            state.weekly = data;
            break;
          case 'monthly':
            state.monthly = data;
            break;
        }
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        // Dashboard stats might include summary data for different periods
        if (action.payload.daily) state.daily = action.payload.daily;
        if (action.payload.weekly) state.weekly = action.payload.weekly;
        if (action.payload.monthly) state.monthly = action.payload.monthly;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch weekly report
    builder
      .addCase(fetchWeeklyReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyReport.fulfilled, (state, action) => {
        state.isLoading = false;
        // Weekly report data would be merged into weekly stats
        if (action.payload.statistics) {
          state.weekly = action.payload.statistics;
        }
      })
      .addCase(fetchWeeklyReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch monthly report
    builder
      .addCase(fetchMonthlyReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.isLoading = false;
        // Monthly report data would be merged into monthly stats
        if (action.payload.statistics) {
          state.monthly = action.payload.statistics;
        }
      })
      .addCase(fetchMonthlyReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch hydration trends
    builder
      .addCase(fetchHydrationTrends.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHydrationTrends.fulfilled, (state, action) => {
        state.isLoading = false;
        // Trends data would be used for charts, might be stored separately
        // For now, we'll just clear the loading state
      })
      .addCase(fetchHydrationTrends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Export statistics
    builder
      .addCase(exportStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(exportStatistics.fulfilled, (state) => {
        state.isLoading = false;
        // Export doesn't change state, just triggers download
      })
      .addCase(exportStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  setSelectedPeriod, 
  setDateRange,
  clearStatistics,
  calculateLocalStats
} = statisticsSlice.actions;
export default statisticsSlice.reducer;