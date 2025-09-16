import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-3xl font-bold text-center mb-4 text-gray-800">
          Welcome to Dr. Dwar
        </Text>
        <Text className="text-lg text-center mb-8 text-gray-600">
          Your healthcare journey starts here
        </Text>
        
        <Button
          mode="outlined"
          onPress={() => signOut()}
          className="mt-4"
        >
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}