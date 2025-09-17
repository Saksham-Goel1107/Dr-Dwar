import AuthWrapper from '@/components/AuthWrapper';
import FloatingChatBot from '@/components/FloatingChatBot';
import '@/global.css';
import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <AuthWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <Slot screenOptions={{ headerShown: false }} />
      </SafeAreaView>
      <FloatingChatBot />
    </AuthWrapper>
  );
}
