import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const saveData = async (key: string, data: any, retryCount = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving data (attempt ${attempt}/${retryCount}):`, error);
      
      if (attempt === retryCount) {
        // Final attempt failed - notify user
        Alert.alert(
          'Data Save Error',
          'Unable to save your data. Please ensure you have enough storage space and try again. Your recent changes may be lost if you close the app.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  return false;
};

export const loadData = async (key: string): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error('Error parsing stored data:', parseError);
        // Data is corrupted, return null to start fresh
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDay.getDay();
  
  const days: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};