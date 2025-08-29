// 用户相关类型
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth?: string;
  height?: number;
  weight?: number;
  activity_level?:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extremely_active';
  daily_water_goal: number;
  wake_up_time: string;
  sleep_time: string;
  timezone: string;
  locale: string;
  email_verified: boolean;
  is_active: boolean;
  is_premium: boolean;
  premium_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// 认证相关类型
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  terms_accepted: boolean;
}

export interface UpdateProfileData {
  full_name?: string;
  gender?: User['gender'];
  date_of_birth?: string;
  height?: number;
  weight?: number;
  activity_level?: User['activity_level'];
  daily_water_goal?: number;
  wake_up_time?: string;
  sleep_time?: string;
}

// 饮水记录相关类型
export interface HydrationRecord {
  id: number;
  user_id: number;
  amount: number;
  drink_type: DrinkType;
  drink_name?: string;
  recorded_at: string;
  location?: string;
  activity_context?: ActivityContext;
  temperature?: DrinkTemperature;
  source: RecordSource;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

export type DrinkType =
  | 'water'
  | 'tea'
  | 'coffee'
  | 'juice'
  | 'sports_drink'
  | 'soda'
  | 'alcohol'
  | 'other';

export type ActivityContext =
  | 'work'
  | 'exercise'
  | 'meal'
  | 'wake_up'
  | 'before_sleep'
  | 'break'
  | 'other';

export type DrinkTemperature = 'hot' | 'warm' | 'room' | 'cold' | 'iced';
export type RecordSource =
  | 'manual'
  | 'quick_add'
  | 'reminder_response'
  | 'smart_cup'
  | 'api_import';

export interface CreateRecordData {
  amount: number;
  drink_type: DrinkType;
  drink_name?: string;
  recorded_at?: string;
  location?: string;
  activity_context?: ActivityContext;
  temperature?: DrinkTemperature;
}

// 提醒相关类型
export interface ReminderSetting {
  id: number;
  user_id: number;
  strategy_type: ReminderStrategy;
  is_enabled: boolean;
  fixed_interval_minutes: number;
  start_time: string;
  end_time: string;
  weekday_enabled: boolean;
  weekend_enabled: boolean;
  weekend_start_time: string;
  weekend_end_time: string;
  consider_weather: boolean;
  consider_activity: boolean;
  consider_previous_intake: boolean;
  do_not_disturb_enabled: boolean;
  dnd_start_time?: string;
  dnd_end_time?: string;
  notification_type: string[];
  notification_sound: string;
  custom_messages?: string[];
  created_at: string;
  updated_at: string;
}

export type ReminderStrategy =
  | 'fixed_interval'
  | 'smart_adaptive'
  | 'activity_based'
  | 'custom';

export interface ReminderLog {
  id: number;
  user_id: number;
  scheduled_at: string;
  sent_at?: string;
  message: string;
  notification_type: string;
  status: ReminderStatus;
  response_type?: ReminderResponse;
  responded_at?: string;
  context?: Record<string, any>;
}

export type ReminderStatus =
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'responded'
  | 'ignored'
  | 'failed';
export type ReminderResponse =
  | 'drink_logged'
  | 'snooze_5min'
  | 'snooze_15min'
  | 'dismiss'
  | 'none';

// 统计相关类型
export interface UserStatistics {
  id: number;
  user_id: number;
  stat_date: string;
  stat_type: 'daily' | 'weekly' | 'monthly';
  total_intake: number;
  goal_achievement_rate: number;
  record_count: number;
  water_percentage: number;
  tea_percentage: number;
  coffee_percentage: number;
  other_percentage: number;
  morning_intake: number;
  afternoon_intake: number;
  evening_intake: number;
  avg_interval_minutes: number;
  most_common_amount: number;
  peak_hour: number;
  reminder_count: number;
  reminder_response_rate: number;
  consistency_score: number;
  health_score: number;
  created_at: string;
  updated_at: string;
}

export interface DailyProgress {
  date: string;
  total_intake: number;
  goal: number;
  achievement_rate: number;
  records: HydrationRecord[];
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

// 成就相关类型
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  category: AchievementCategory;
  criteria: Record<string, any>;
  difficulty: AchievementDifficulty;
  points: number;
  is_hidden: boolean;
  unlock_message?: string;
  is_repeatable: boolean;
  cooldown_days: number;
  is_active: boolean;
}

export type AchievementCategory =
  | 'consistency'
  | 'volume'
  | 'diversity'
  | 'social'
  | 'milestone'
  | 'seasonal';
export type AchievementDifficulty =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
  progress_data?: Record<string, any>;
  is_displayed: boolean;
  is_favorite: boolean;
  achievement: Achievement;
}

// 设备相关类型
export interface UserDevice {
  id: number;
  user_id: number;
  device_id: string;
  device_name: string;
  device_type:
    | 'mobile_app'
    | 'smart_cup'
    | 'fitness_tracker'
    | 'smart_scale'
    | 'other';
  platform?: 'ios' | 'android' | 'web' | 'iot' | 'other';
  push_token?: string;
  push_enabled: boolean;
  is_primary: boolean;
  is_active: boolean;
  last_sync_at?: string;
  settings?: Record<string, any>;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 导航相关类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Records: undefined;
  Statistics: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  QuickRecord: undefined;
  RecordDetails: { recordId: number };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ReminderSettings: undefined;
  Achievements: undefined;
  About: undefined;
};

// 表单相关类型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  validation?: any;
  options?: Array<{ label: string; value: any }>;
}

// 通用组件 Props 类型
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: any;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

// 网络状态类型
export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// 主题相关类型
export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    body1: any;
    body2: any;
    caption: any;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// Redux Store 状态类型
export interface RootState {
  auth: AuthState;
  hydration: HydrationState;
  reminders: ReminderState;
  statistics: StatisticsState;
  achievements: AchievementState;
  settings: SettingsState;
  ui: UIState;
}

export interface HydrationState {
  records: HydrationRecord[];
  dailyProgress: DailyProgress | null;
  todayIntake: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface ReminderState {
  settings: ReminderSetting | null;
  logs: ReminderLog[];
  nextReminder: ReminderLog | null;
  isLoading: boolean;
  error: string | null;
}

export interface StatisticsState {
  daily: UserStatistics[];
  weekly: UserStatistics[];
  monthly: UserStatistics[];
  selectedPeriod: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  isLoading: boolean;
  error: string | null;
}

export interface AchievementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  recentAchievements: UserAchievement[];
  totalPoints: number;
  isLoading: boolean;
  error: string | null;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    reminders: boolean;
    achievements: boolean;
    weekly_reports: boolean;
    marketing: boolean;
  };
  privacy: {
    data_sharing: boolean;
    analytics: boolean;
    crash_reports: boolean;
  };
  sync: {
    auto_sync: boolean;
    wifi_only: boolean;
    last_sync: string | null;
  };
}

export interface UIState {
  isLoading: boolean;
  loadingText?: string;
  toasts: Toast[];
  modals: {
    quickRecord: boolean;
    profile: boolean;
    settings: boolean;
  };
  activeTab: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
