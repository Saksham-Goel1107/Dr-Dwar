import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-center mb-4" style={{ color: '#1e293b' }}>
          Search
        </Text>
        <Text className="text-base text-center" style={{ color: '#64748b' }}>
          Search for doctors, hospitals, and services
        </Text>
      </View>
    </SafeAreaView>
  );
}