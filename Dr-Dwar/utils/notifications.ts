import * as SecureStore from 'expo-secure-store';

/**
 * Check if notifications are enabled by the user
 * @returns Promise<boolean> - true if notifications are enabled, false otherwise
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const notifSetting = await SecureStore.getItemAsync('NOTIFICATIONS');
    return notifSetting !== 'false'; // Default to true if not set
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to true on error
  }
};

/**
 * Send a notification only if user has enabled notifications
 * @param notification - The notification content and trigger
 * @returns Promise<void>
 */
export const sendNotificationIfEnabled = async (notification: {
  content: {
    title: string;
    body: string;
    sound?: string;
    data?: any;
  };
  trigger: any;
}): Promise<void> => {
  const enabled = await areNotificationsEnabled();
  if (enabled) {
    const Notifications = (await import('expo-notifications')).default;
    await Notifications.scheduleNotificationAsync(notification);
  }
};
