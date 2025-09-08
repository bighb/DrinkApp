import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useWaterStore, WaterRecord } from '../../store/waterStore'

export const WaterHistory: React.FC = () => {
  const { getTodayRecords } = useWaterStore()
  const todayRecords = getTodayRecords()
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  const renderRecord = ({ item }: { item: WaterRecord }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordInfo}>
        <Text style={styles.recordAmount}>{item.amount}ml</Text>
        <Text style={styles.recordTime}>{formatTime(item.timestamp)}</Text>
      </View>
      <View style={styles.waterIcon}>
        <Text style={styles.waterEmoji}>💧</Text>
      </View>
    </View>
  )
  
  if (todayRecords.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>今日记录</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📝</Text>
          <Text style={styles.emptyMessage}>还没有饮水记录</Text>
          <Text style={styles.emptySubMessage}>开始记录你的第一杯水吧！</Text>
        </View>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>今日记录 ({todayRecords.length}次)</Text>
      <FlatList
        data={todayRecords.reverse()} // 最新记录在前
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
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
    padding: 20,
    paddingBottom: 0,
  },
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  recordInfo: {
    flex: 1,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  recordTime: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  waterIcon: {
    marginLeft: 12,
  },
  waterEmoji: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  emptySubMessage: {
    fontSize: 14,
    color: '#94a3b8',
  },
})