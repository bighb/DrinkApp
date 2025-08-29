import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, StyleSheet } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';

import { NetworkState } from '@/types';
import { theme } from '@/constants/theme';

interface NetworkStatusContextType {
  networkState: NetworkState;
  isOnline: boolean;
}

const NetworkStatusContext = createContext<
  NetworkStatusContextType | undefined
>(undefined);

interface NetworkStatusProviderProps {
  children: React.ReactNode;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({
  children,
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
  });
  const [showOfflineSnackbar, setShowOfflineSnackbar] = useState(false);
  const [showOnlineSnackbar, setShowOnlineSnackbar] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const newNetworkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      };

      // Show snackbars for connection changes
      if (networkState.isConnected && !newNetworkState.isConnected) {
        setShowOfflineSnackbar(true);
        setShowOnlineSnackbar(false);
      } else if (!networkState.isConnected && newNetworkState.isConnected) {
        setShowOnlineSnackbar(true);
        setShowOfflineSnackbar(false);
      }

      setNetworkState(newNetworkState);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [networkState.isConnected]);

  const isOnline = networkState.isConnected && networkState.isInternetReachable;

  const value: NetworkStatusContextType = {
    networkState,
    isOnline,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      <View style={styles.container}>
        {children}

        {/* Offline Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              📴 You're offline. Some features may not work.
            </Text>
          </View>
        )}

        {/* Connection Status Snackbars */}
        <Snackbar
          visible={showOfflineSnackbar}
          onDismiss={() => setShowOfflineSnackbar(false)}
          duration={3000}
          style={[styles.snackbar, styles.offlineSnackbar]}
        >
          <Text style={styles.snackbarText}>
            📴 Connection lost. Working offline...
          </Text>
        </Snackbar>

        <Snackbar
          visible={showOnlineSnackbar}
          onDismiss={() => setShowOnlineSnackbar(false)}
          duration={2000}
          style={[styles.snackbar, styles.onlineSnackbar]}
        >
          <Text style={styles.snackbarText}>
            ✅ Back online! Syncing data...
          </Text>
        </Snackbar>
      </View>
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = (): NetworkStatusContextType => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error(
      'useNetworkStatus must be used within a NetworkStatusProvider'
    );
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.warning,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  offlineSnackbar: {
    backgroundColor: theme.colors.error,
  },
  onlineSnackbar: {
    backgroundColor: theme.colors.success,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
  },
});
