import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-4 text-center text-2xl font-bold" style={{ color: '#1e293b' }}>
          Search
        </Text>
        <Text className="text-center text-base" style={{ color: '#64748b' }}>
          Search for doctors, hospitals, and services
        </Text>
      </View>
    </SafeAreaView>
  );
}
