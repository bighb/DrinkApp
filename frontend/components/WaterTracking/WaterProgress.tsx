import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useWaterStore } from '../../store/waterStore'

export const WaterProgress: React.FC = () => {
  const { dailyGoal, todayIntake } = useWaterStore()
  
  const progress = Math.min((todayIntake / dailyGoal) * 100, 100)
  const remainingAmount = Math.max(dailyGoal - todayIntake, 0)
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日饮水进度</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todayIntake}ml</Text>
          <Text style={styles.statLabel}>已饮用</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dailyGoal}ml</Text>
          <Text style={styles.statLabel}>目标</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{remainingAmount}ml</Text>
          <Text style={styles.statLabel}>还需</Text>
        </View>
      </View>
      
      {progress >= 100 && (
        <Text style={styles.congratsText}>🎉 恭喜完成今日饮水目标！</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
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
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  congratsText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
})