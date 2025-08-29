import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, Toast } from '@/types';

// Initial state
const initialState: UIState = {
  isLoading: false,
  loadingText: undefined,
  toasts: [],
  modals: {
    quickRecord: false,
    profile: false,
    settings: false,
  },
  activeTab: 'Dashboard',
};

// Helper function to generate toast ID
const generateToastId = (): string => {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingText = undefined;
      }
    },
    setLoadingWithText: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.loadingText = action.payload;
    },
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: generateToastId(),
        duration: action.payload.duration || 3000,
      };
      
      state.toasts.push(toast);
      
      // Limit the number of toasts to prevent memory issues
      if (state.toasts.length > 5) {
        state.toasts = state.toasts.slice(-5);
      }
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    showSuccessToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: generateToastId(),
        type: 'success',
        message: action.payload,
        duration: 3000,
      };
      state.toasts.push(toast);
    },
    showErrorToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: generateToastId(),
        type: 'error',
        message: action.payload,
        duration: 5000,
      };
      state.toasts.push(toast);
    },
    showWarningToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: generateToastId(),
        type: 'warning',
        message: action.payload,
        duration: 4000,
      };
      state.toasts.push(toast);
    },
    showInfoToast: (state, action: PayloadAction<string>) => {
      const toast: Toast = {
        id: generateToastId(),
        type: 'info',
        message: action.payload,
        duration: 3000,
      };
      state.toasts.push(toast);
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    toggleModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    // Batch actions for better performance
    setBulkUI: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },
    resetUI: (state) => {
      state.isLoading = false;
      state.loadingText = undefined;
      state.toasts = [];
      state.modals = {
        quickRecord: false,
        profile: false,
        settings: false,
      };
    },
    // Auto-hide toast after duration
    autoHideToast: (state, action: PayloadAction<string>) => {
      // This action is handled by middleware or effects
      // The reducer just acknowledges the action
    },
    // Modal with data actions
    openModalWithData: (state, action: PayloadAction<{
      modal: keyof UIState['modals'];
      data?: any;
    }>) => {
      const { modal } = action.payload;
      state.modals[modal] = true;
      // If you need to store modal data, you can extend the modals object
    },
    // Loading states for specific operations
    setLoadingState: (state, action: PayloadAction<{
      operation: string;
      loading: boolean;
      text?: string;
    }>) => {
      const { operation, loading, text } = action.payload;
      
      // You can track multiple loading states if needed
      if (operation === 'global') {
        state.isLoading = loading;
        state.loadingText = text;
      }
      
      // For specific operations, you could extend the state to track them
      // For now, we'll use the global loading state
      if (loading) {
        state.isLoading = true;
        state.loadingText = text || `Loading ${operation}...`;
      } else {
        state.isLoading = false;
        state.loadingText = undefined;
      }
    },
    // Queue multiple toasts
    showToasts: (state, action: PayloadAction<Omit<Toast, 'id'>[]>) => {
      const newToasts = action.payload.map(toast => ({
        ...toast,
        id: generateToastId(),
        duration: toast.duration || 3000,
      }));
      
      state.toasts.push(...newToasts);
      
      // Limit total toasts
      if (state.toasts.length > 5) {
        state.toasts = state.toasts.slice(-5);
      }
    },
    // Update toast
    updateToast: (state, action: PayloadAction<{
      id: string;
      updates: Partial<Omit<Toast, 'id'>>;
    }>) => {
      const { id, updates } = action.payload;
      const toastIndex = state.toasts.findIndex(toast => toast.id === id);
      
      if (toastIndex !== -1) {
        state.toasts[toastIndex] = { ...state.toasts[toastIndex], ...updates };
      }
    },
    // Conditional toast (only show if not already showing same message)
    showUniqueToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const { message, type } = action.payload;
      
      // Check if a similar toast is already showing
      const existingToast = state.toasts.find(toast => 
        toast.message === message && toast.type === type
      );
      
      if (!existingToast) {
        const toast: Toast = {
          ...action.payload,
          id: generateToastId(),
          duration: action.payload.duration || 3000,
        };
        state.toasts.push(toast);
      }
    },
  },
});

export const {
  setLoading,
  setLoadingWithText,
  showToast,
  hideToast,
  clearAllToasts,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  openModal,
  closeModal,
  closeAllModals,
  setActiveTab,
  toggleModal,
  setBulkUI,
  resetUI,
  autoHideToast,
  openModalWithData,
  setLoadingState,
  showToasts,
  updateToast,
  showUniqueToast,
} = uiSlice.actions;

export default uiSlice.reducer;