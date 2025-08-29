import React, { createContext, useContext, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadStoredAuth } from '@/store/slices/authSlice';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to load stored authentication data
        await dispatch(loadStoredAuth()).unwrap();
      } catch (error) {
        console.log('No stored auth data found or invalid:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  const contextValue: AuthContextType = {
    ...authState,
    isInitialized,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};