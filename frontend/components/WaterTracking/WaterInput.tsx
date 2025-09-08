import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useWaterStore } from '../../store/waterStore'

export const WaterInput: React.FC = () => {
  const [customAmount, setCustomAmount] = useState('')
  const { addWater } = useWaterStore()
  
  const quickAmounts = [100, 200, 300, 500]
  
  const handleAddWater = (amount: number) => {
    if (amount > 0) {
      addWater(amount)
      Alert.alert('记录成功', `已添加 ${amount}ml 饮水记录`)
    }
  }
  
  const handleCustomAdd = () => {
    const amount = parseInt(customAmount)
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('输入错误', '请输入有效的饮水量')
      return
    }
    
    handleAddWater(amount)
    setCustomAmount('')
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>添加饮水记录</Text>
      
      <Text style={styles.sectionTitle}>快速选择</Text>
      <View style={styles.quickButtonsContainer}>
        {quickAmounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.quickButton}
            onPress={() => handleAddWater(amount)}
          >
            <Text style={styles.quickButtonText}>{amount}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>自定义数量</Text>
      <View style={styles.customInputContainer}>
        <TextInput
          style={styles.customInput}
          value={customAmount}
          onChangeText={setCustomAmount}
          placeholder="输入饮水量"
          keyboardType="numeric"
          maxLength={4}
        />
        <Text style={styles.unitText}>ml</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCustomAdd}
        >
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    marginTop: 8,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
  },
  unitText: {
    fontSize: 16,
    color: '#64748b',
    marginRight: 12,
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})