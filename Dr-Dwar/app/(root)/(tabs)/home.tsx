import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-4 text-center text-3xl font-bold text-gray-800">
          Welcome to Dr. Dwar
        </Text>
        <Text className="mb-8 text-center text-lg text-gray-600">
          Your healthcare journey starts here
        </Text>

        <Button mode="outlined" onPress={() => signOut()} className="mt-4">
          Sign Out
        </Button>
        <Button mode="outlined" onPress={() => router.push('/reminders')} className="mt-4">
          Reminder
        </Button>
        <Button mode="outlined" onPress={() => router.push('/hospitals')} className="mt-4">
          Reminder
        </Button>
      </View>
    </SafeAreaView>
  );
}
