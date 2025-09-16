import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-4 text-center text-2xl font-bold" style={{ color: '#1e293b' }}>
          Profile
        </Text>
        <Text className="mb-8 text-center text-base" style={{ color: '#64748b' }}>
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
