import { Stack } from 'expo-router';

export default function MedicinesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Medicines',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="new-medicine"
        options={{
          title: 'Add New Medicine',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Medicine History',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
