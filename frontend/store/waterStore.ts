import { create } from 'zustand'

export interface WaterRecord {
  id: string
  amount: number
  timestamp: number
}

interface WaterState {
  dailyGoal: number
  todayIntake: number
  records: WaterRecord[]
  addWater: (amount: number) => void
  setDailyGoal: (goal: number) => void
  getTodayRecords: () => WaterRecord[]
  resetDay: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const isToday = (timestamp: number): boolean => {
  const today = new Date()
  const recordDate = new Date(timestamp)
  return (
    today.getFullYear() === recordDate.getFullYear() &&
    today.getMonth() === recordDate.getMonth() &&
    today.getDate() === recordDate.getDate()
  )
}

export const useWaterStore = create<WaterState>((set, get) => ({
  dailyGoal: 2000, // 2000ml default
  todayIntake: 0,
  records: [],
  
  addWater: (amount: number) => {
    const newRecord: WaterRecord = {
      id: generateId(),
      amount,
      timestamp: Date.now()
    }
    
    set((state) => {
      const newRecords = [...state.records, newRecord]
      const todayRecords = newRecords.filter(record => isToday(record.timestamp))
      const todayIntake = todayRecords.reduce((sum, record) => sum + record.amount, 0)
      
      return {
        records: newRecords,
        todayIntake
      }
    })
  },
  
  setDailyGoal: (goal: number) => set({ dailyGoal: goal }),
  
  getTodayRecords: () => {
    const { records } = get()
    return records.filter(record => isToday(record.timestamp))
  },
  
  resetDay: () => set({ todayIntake: 0, records: [] })
}))