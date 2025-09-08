import React, { useEffect, useState, useCallback } from 'react'
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const authStore = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    await authStore.checkAuthStatus()
    setIsInitialized(true)
  }, [authStore])

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* 认证相关页面 */}
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            title: "登录",
            headerTitleAlign: 'center',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            title: "注册",
            headerTitleAlign: 'center',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="auth/forgot-password" 
          options={{ 
            title: "忘记密码",
            headerTitleAlign: 'center'
          }} 
        />
        
        {/* 主应用页面 */}
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "💧 喝水助手",
            headerTitleAlign: 'center'
          }} 
        />
      </Stack>
    </>
  );
}
