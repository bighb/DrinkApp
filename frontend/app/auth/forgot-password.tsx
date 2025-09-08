import React, { useState } from 'react'
import {
  View,
  Text,
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
import { AuthApi } from '../../api/auth'
import { ApiErrorHandler } from '../../api/client'

// 表单数据类型
interface ForgotPasswordForm {
  email: string
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
}

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    defaultValues: {
      email: '',
    },
  })

  // 提交忘记密码表单
  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true)

      const response = await AuthApi.sendPasswordResetEmail(data.email.trim().toLowerCase())

      if (response.success) {
        setIsEmailSent(true)
        Alert.alert(
          '重置邮件已发送',
          `密码重置链接已发送到 ${data.email}，请检查您的邮箱。`,
          [{ text: '确定' }]
        )
      } else {
        throw new Error(response.message || '发送失败')
      }
    } catch (error: any) {
      const errorMessage = ApiErrorHandler.getErrorMessage(error)
      Alert.alert('发送失败', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 重新发送邮件
  const handleResendEmail = async () => {
    const email = getValues('email')
    if (email) {
      await onSubmit({ email })
    }
  }

  const handleBackToLogin = () => {
    router.back()
  }

  if (isEmailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>邮件已发送</Text>
            <Text style={styles.successMessage}>
              我们已向您的邮箱发送了密码重置链接。
              {'\n'}
              请检查您的邮箱（包括垃圾邮件文件夹）。
            </Text>
            
            <View style={styles.actionContainer}>
              <Text style={styles.resendText}>没收到邮件？</Text>
              <Button
                title="重新发送"
                variant="outline"
                onPress={handleResendEmail}
                loading={isLoading}
                style={styles.resendButton}
              />
            </View>

            <Button
              title="返回登录"
              onPress={handleBackToLogin}
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>忘记密码？</Text>
            <Text style={styles.subtitle}>
              输入您的邮箱地址，我们将向您发送密码重置链接
            </Text>
          </View>

          <View style={styles.form}>
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
                  placeholder="请输入注册时的邮箱地址"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              )}
            />

            <Button
              title="发送重置链接"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
            />

            <Button
              title="返回登录"
              variant="text"
              onPress={handleBackToLogin}
              style={styles.backToLoginButton}
            />
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  backToLoginButton: {
    marginTop: 8,
  },
  
  // 成功页面样式
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  resendButton: {
    marginBottom: 16,
  },
  backButton: {
    width: '100%',
  },
})