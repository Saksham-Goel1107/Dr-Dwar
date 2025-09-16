import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-center mb-4" style={{ color: '#1e293b' }}>
          Profile
        </Text>
        <Text className="text-base text-center mb-8" style={{ color: '#64748b' }}>
          Manage your account and preferences
        </Text>
        
        <Button
          mode="contained"
          onPress={() => signOut()}
          style={{
            backgroundColor: '#059669',
            borderRadius: 8,
          }}
          textColor="white"
        >
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}