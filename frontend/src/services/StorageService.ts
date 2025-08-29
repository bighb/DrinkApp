import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export class StorageService {
  /**
   * Store data securely (for sensitive information like tokens)
   */
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web (less secure but functional)
        await AsyncStorage.setItem(`secure_${key}`, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data from secure storage
   */
  static async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web
        return await AsyncStorage.getItem(`secure_${key}`);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from secure storage
   */
  static async removeSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web
        await AsyncStorage.removeItem(`secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store data in async storage (for non-sensitive information)
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error storing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data from async storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from async storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store object data
   */
  static async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing object ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get object data
   */
  static async getObject(key: string): Promise<any | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting object ${key}:`, error);
      return null;
    }
  }

  /**
   * Store secure object data
   */
  static async setSecureObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setSecureItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing secure object ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get secure object data
   */
  static async getSecureObject(key: string): Promise<any | null> {
    try {
      const jsonValue = await this.getSecureItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting secure object ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear all data
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get multiple items
   */
  static async getMultiple(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return [];
    }
  }

  /**
   * Set multiple items
   */
  static async setMultiple(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   */
  static async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  }
}
