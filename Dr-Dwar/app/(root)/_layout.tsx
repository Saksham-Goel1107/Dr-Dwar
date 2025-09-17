import AuthWrapper from '@/components/AuthWrapper';
import FloatingChatBot from '@/components/FloatingChatBot';
import { CartProvider } from '@/contexts/CartContext';
import '@/global.css';
import * as Notifications from 'expo-notifications';
import { Slot, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const pathname = usePathname();
  const showChatBot = !pathname.includes('/cart');

  useEffect(() => {
    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#059669',
      });
    }
  }, []);

  return (
    <CartProvider>
      <AuthWrapper>
        <SafeAreaView style={{ flex: 1 }}>
          <Slot screenOptions={{ headerShown: false }} />
        </SafeAreaView>
        {showChatBot && <FloatingChatBot />}
      </AuthWrapper>
    </CartProvider>
  );
}
