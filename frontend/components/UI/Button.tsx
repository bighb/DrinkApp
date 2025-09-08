import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size]]
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary)
        if (isDisabled) baseStyle.push(styles.primaryDisabled)
        break
      case 'secondary':
        baseStyle.push(styles.secondary)
        if (isDisabled) baseStyle.push(styles.secondaryDisabled)
        break
      case 'outline':
        baseStyle.push(styles.outline)
        if (isDisabled) baseStyle.push(styles.outlineDisabled)
        break
      case 'text':
        baseStyle.push(styles.text)
        if (isDisabled) baseStyle.push(styles.textDisabled)
        break
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle[] => {
    const baseTextStyle: TextStyle[] = [styles.buttonText, styles[`${size}Text` as keyof typeof styles]]
    
    switch (variant) {
      case 'primary':
        baseTextStyle.push(styles.primaryText)
        if (isDisabled) baseTextStyle.push(styles.primaryTextDisabled)
        break
      case 'secondary':
        baseTextStyle.push(styles.secondaryText)
        if (isDisabled) baseTextStyle.push(styles.secondaryTextDisabled)
        break
      case 'outline':
        baseTextStyle.push(styles.outlineText)
        if (isDisabled) baseTextStyle.push(styles.outlineTextDisabled)
        break
      case 'text':
        baseTextStyle.push(styles.textButtonText)
        if (isDisabled) baseTextStyle.push(styles.textButtonTextDisabled)
        break
    }

    return baseTextStyle
  }

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#ffffff' : '#3b82f6'} 
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // 尺寸
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },

  // 基础文字样式
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Primary样式
  primary: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    color: '#ffffff',
  },
  primaryTextDisabled: {
    color: '#ffffff',
  },

  // Secondary样式
  secondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  secondaryText: {
    color: '#1e40af',
  },
  secondaryTextDisabled: {
    color: '#9ca3af',
  },

  // Outline样式
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  outlineDisabled: {
    borderColor: '#9ca3af',
  },
  outlineText: {
    color: '#3b82f6',
  },
  outlineTextDisabled: {
    color: '#9ca3af',
  },

  // Text样式
  text: {
    backgroundColor: 'transparent',
  },
  textDisabled: {
    backgroundColor: 'transparent',
  },
  textButtonText: {
    color: '#3b82f6',
  },
  textButtonTextDisabled: {
    color: '#9ca3af',
  },
})

export default Button