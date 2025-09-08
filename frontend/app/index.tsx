import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WaterProgress, WaterInput, WaterHistory } from '../components/WaterTracking';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/UI/Button';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // 等待组件挂载并且认证状态检查完成
    if (isMounted && !isLoading && !isAuthenticated) {
      // 使用setTimeout延迟导航，确保组件完全挂载
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    }
  }, [isAuthenticated, isLoading, router, isMounted]);

  const handleLogout = async () => {
    Alert.alert(
      '确认登出',
      '您确定要登出吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '登出',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 如果未认证，返回空视图（会自动跳转到登录页）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 用户信息栏 */}
      <View style={styles.userBar}>
        <Text style={styles.welcomeText}>
          欢迎回来，{user?.fullName || user?.username || '用户'}！
        </Text>
        <Button
          title="登出"
          variant="text"
          size="small"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <WaterProgress />
        <WaterInput />
        <WaterHistory />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  logoutButton: {
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});
