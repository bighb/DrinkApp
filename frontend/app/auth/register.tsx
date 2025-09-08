import React from 'react'
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
import { RegisterRequest } from '../../api/types'

// 表单数据类型
interface RegisterForm {
  email: string
  username: string
  password: string
  confirmPassword: string
  fullName: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  height?: string
  weight?: string
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
}

// 表单验证规则
const validationRules = {
  email: {
    required: '请输入邮箱地址',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: '请输入有效的邮箱地址',
    },
  },
  username: {
    required: '请输入用户名',
    minLength: {
      value: 3,
      message: '用户名至少3个字符',
    },
    maxLength: {
      value: 20,
      message: '用户名最多20个字符',
    },
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
    },
  },
  password: {
    required: '请输入密码',
    minLength: {
      value: 8,
      message: '密码至少8个字符',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: '密码需包含大小写字母和数字',
    },
  },
  confirmPassword: {
    required: '请确认密码',
  },
  fullName: {
    required: '请输入姓名',
    maxLength: {
      value: 50,
      message: '姓名最多50个字符',
    },
  },
}

export default function RegisterScreen() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      gender: undefined,
      height: '',
      weight: '',
      activityLevel: 'moderately_active',
    },
  })

  const password = watch('password')

  // 提交注册表单
  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError()

      // 验证确认密码
      if (data.password !== data.confirmPassword) {
        Alert.alert('错误', '两次输入的密码不一致')
        return
      }

      // 构造注册数据
      const registerData: RegisterRequest = {
        email: data.email.trim().toLowerCase(),
        username: data.username.trim(),
        password: data.password,
        fullName: data.fullName.trim(),
        gender: data.gender,
        height: data.height ? parseFloat(data.height) : undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        activityLevel: data.activityLevel,
      }

      const success = await register(registerData)

      if (success) {
        Alert.alert(
          '注册成功！',
          '请检查您的邮箱并点击验证链接完成注册。',
          [
            {
              text: '确定',
              onPress: () => router.push('/auth/login'),
            },
          ]
        )
      }
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  const handleLoginPress = () => {
    router.push('/auth/login')
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
            <Text style={styles.title}>创建账户</Text>
            <Text style={styles.subtitle}>加入我们，开始健康饮水之旅</Text>
          </View>

          <View style={styles.form}>
            {/* 基本信息 */}
            <Text style={styles.sectionTitle}>基本信息</Text>
            
            <Controller
              control={control}
              name="fullName"
              rules={validationRules.fullName}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="姓名"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  placeholder="请输入您的姓名"
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={validationRules.email}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="邮箱地址"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  placeholder="请输入邮箱地址"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              rules={validationRules.username}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="用户名"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  placeholder="3-20个字符，仅限字母数字下划线"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  placeholder="至少8位，包含大小写字母和数字"
                  showPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                ...validationRules.confirmPassword,
                validate: (value) =>
                  value === password || '两次输入的密码不一致',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="确认密码"
                  required
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  placeholder="请再次输入密码"
                  showPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />

            {/* 健康信息 */}
            <Text style={styles.sectionTitle}>健康信息（可选）</Text>
            
            <View style={styles.row}>
              <Controller
                control={control}
                name="height"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="身高 (cm)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="170"
                    keyboardType="numeric"
                    containerStyle={styles.halfWidth}
                  />
                )}
              />

              <Controller
                control={control}
                name="weight"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="体重 (kg)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="65"
                    keyboardType="numeric"
                    containerStyle={styles.halfWidth}
                  />
                )}
              />
            </View>

            {/* 错误提示 */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* 提交按钮 */}
            <Button
              title="创建账户"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
            />

            {/* 登录链接 */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>已有账户？ </Text>
              <Button
                title="立即登录"
                variant="text"
                onPress={handleLoginPress}
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
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
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
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#64748b',
  },
})