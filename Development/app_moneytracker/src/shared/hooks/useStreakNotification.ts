import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

if (Constants.appOwnership !== 'expo') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const useStreakNotification = () => {
  useEffect(() => {
    // Expo Go on Android throws an error with notifications in SDK 53+.
    // Bypass notifications entirely if running in Expo Go.
    if (Constants.appOwnership === 'expo') {
      return;
    }

    registerForPushNotificationsAsync();
    scheduleDailyReminder();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('streak', {
          name: 'Streak Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
    } catch (e) {
      console.warn("Expo Go notifications issue ignored: ", e);
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      // Cancel all previously scheduled streak reminders to avoid duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new daily reminder at 20:00
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Đừng để mất chuỗi! 🔥',
          body: 'Bạn chưa sử dụng MoneyTracker hôm nay! Hãy vào app ngay để giữ chuỗi của mình nhé.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
          channelId: 'streak',
        },
      });
    } catch (e) {
      console.warn("Could not schedule local notification: ", e);
    }
  };

  return null;
};
