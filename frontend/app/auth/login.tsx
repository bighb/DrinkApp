import React, { useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Input } from '../../components/UI/Input'
import { Button } from '../../components/UI/Button'
import { useAuthStore } from '../../store/authStore'

// 表单数据类型
interface LoginForm {
  login: string // 邮箱或用户名
  password: string
  rememberMe?: boolean
}

// 表单验证规则
const validationRules = {
  login: {
    required: '请输入邮箱或用户名',
    minLength: {
      value: 3,
      message: '请输入有效的邮箱或用户名',
    },
  },
  password: {
    required: '请输入密码',
    minLength: {
      value: 6,
      message: '密码至少6个字符',
    },
  },
}

export default function LoginScreen() {
  const router = useRouter()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    defaultValues: {
      login: '',
      password: '',
      rememberMe: true,
    },
  })

  // 如果已登录，跳转到主页
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        router.replace('/');
      }, 100);
    }
  }, [isAuthenticated, router])

  // 提交登录表单
  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()

      const success = await login({
        login: data.login.trim(),
        password: data.password,
      })

      if (success) {
        // 登录成功，Zustand store会自动更新状态
        // 通过useEffect监听isAuthenticated变化来跳转
        Alert.alert('登录成功！', '欢迎回来！', [
          {
            text: '确定',
            onPress: () => {
              setTimeout(() => {
                router.replace('/');
              }, 100);
            },
          },
        ])
      }
    } catch (error) {
      console.error('登录失败:', error)
    }
  }

  const handleRegisterPress = () => {
    router.push('/auth/register')
  }

  const handleForgotPasswordPress = () => {
    router.push('/auth/forgot-password')
  }

  // 开发环境快速登录（可选）
  const handleQuickLogin = () => {
    if (__DEV__) {
      setValue('login', 'test@example.com')
      setValue('password', 'Test123456')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>欢迎回来</Text>
            <Text style={styles.subtitle}>登录您的账户继续使用</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="login"
              rules={validationRules.login}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="邮箱或用户名"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.login?.message}
                  placeholder="请输入邮箱地址或用户名"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={validationRules.password}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="密码"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  placeholder="请输入密码"
                  showPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                />
              )}
            />

            {/* 忘记密码链接 */}
            <View style={styles.forgotPasswordContainer}>
              <Button
                title="忘记密码？"
                variant="text"
                size="small"
                onPress={handleForgotPasswordPress}
                style={styles.forgotPasswordButton}
              />
            </View>

            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* 登录按钮 */}
            <Button
              title="登录"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.loginButton}
            />

            {/* 开发环境快速登录 */}
            {__DEV__ && (
              <Button
                title="🚀 开发快速登录"
                variant="outline"
                onPress={handleQuickLogin}
                style={styles.quickLoginButton}
              />
            )}

            {/* 分割线 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 注册链接 */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>还没有账户？ </Text>
              <Button
                title="立即注册"
                variant="text"
                onPress={handleRegisterPress}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordButton: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: 16,
  },
  quickLoginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: '#64748b',
  },
})