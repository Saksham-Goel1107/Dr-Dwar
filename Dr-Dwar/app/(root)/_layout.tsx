import AuthWrapper from '@/components/AuthWrapper';
import FloatingChatBot from '@/components/FloatingChatBot';
import { CartProvider } from '@/contexts/CartContext';
import '@/global.css';
import { Slot, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  const pathname = usePathname();
  const showChatBot = !pathname.includes('/cart');

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
