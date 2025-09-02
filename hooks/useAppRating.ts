import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  APP_LAUNCHES: '@endocare_app_launches',
  LAST_RATING_PROMPT: '@endocare_last_rating_prompt',
  USER_RATED: '@endocare_user_rated',
  RATING_DECLINED: '@endocare_rating_declined',
};

export const useAppRating = () => {
  const checkAndPromptRating = useCallback(async () => {
    try {
      // Only prompt on iOS/Android, not web
      if (!StoreReview.isAvailableAsync()) {
        return;
      }

      // Check if user already rated or declined
      const userRated = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATED);
      const ratingDeclined = await AsyncStorage.getItem(STORAGE_KEYS.RATING_DECLINED);
      
      if (userRated === 'true' || ratingDeclined === 'true') {
        return;
      }

      // Get app launch count
      const launchCountStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_LAUNCHES);
      const launchCount = parseInt(launchCountStr || '0', 10);
      
      // Get last rating prompt time
      const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RATING_PROMPT);
      const lastPrompt = lastPromptStr ? parseInt(lastPromptStr, 10) : 0;
      const now = Date.now();
      const daysSinceLastPrompt = (now - lastPrompt) / (1000 * 60 * 60 * 24);

      // Prompt conditions:
      // - After 5 app launches, OR
      // - After 10 launches, OR 
      // - After 20 launches, etc. (every 10 after first prompt)
      // - At least 7 days since last prompt
      const shouldPrompt = 
        (launchCount === 5) || 
        (launchCount >= 10 && launchCount % 10 === 0 && daysSinceLastPrompt >= 7);

      if (shouldPrompt) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_RATING_PROMPT, now.toString());
        
        // Use the native in-app rating dialog (iOS 10.3+ and Android 5.0+)
        if (await StoreReview.hasAction()) {
          await StoreReview.requestReview();
          // Mark as prompted (user might have rated)
          await AsyncStorage.setItem(STORAGE_KEYS.USER_RATED, 'true');
        }
      }
    } catch (error) {
      console.log('Error checking rating prompt:', error);
    }
  }, []);

  const incrementAppLaunches = useCallback(async () => {
    try {
      const launchCountStr = await AsyncStorage.getItem(STORAGE_KEYS.APP_LAUNCHES);
      const launchCount = parseInt(launchCountStr || '0', 10) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LAUNCHES, launchCount.toString());
      
      // Check if we should prompt for rating after incrementing
      await checkAndPromptRating();
    } catch (error) {
      console.log('Error incrementing app launches:', error);
    }
  }, [checkAndPromptRating]);

  const manuallyPromptRating = useCallback(async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        await AsyncStorage.setItem(STORAGE_KEYS.USER_RATED, 'true');
      } else {
        // Fallback to opening store page
        const storeUrl = Platform.select({
          ios: 'https://apps.apple.com/app/id[YOUR_APP_ID]', // Replace with actual App Store ID
          android: 'https://play.google.com/store/apps/details?id=com.racsolutions.endocare',
        });
        
        if (storeUrl) {
          const { Linking } = require('react-native');
          await Linking.openURL(storeUrl);
        }
      }
    } catch (error) {
      console.log('Error prompting rating manually:', error);
    }
  }, []);

  const markUserDeclinedRating = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATING_DECLINED, 'true');
    } catch (error) {
      console.log('Error marking rating declined:', error);
    }
  }, []);

  return {
    checkAndPromptRating,
    incrementAppLaunches,
    manuallyPromptRating,
    markUserDeclinedRating,
  };
};