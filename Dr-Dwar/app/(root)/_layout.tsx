import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import '@/global.css';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Slot screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
