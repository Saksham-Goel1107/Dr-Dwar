import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface MedicineCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

function MedicineCard({ title, subtitle, icon, onPress }: MedicineCardProps) {
  return (
    <TouchableOpacity
      className="mb-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Ionicons name={icon as any} size={24} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{title}</Text>
          <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function MedicinesScreen() {
  const { user } = useUser();
  if (!user) {
    throw new Error('User not found');
  }

  const isVerified = user.unsafeMetadata?.isVerified ?? false;
  const userRole = user.unsafeMetadata?.role ?? 'user';

  if (!isVerified) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <View className="items-center rounded-xl bg-white p-8 shadow-sm">
          <Ionicons name="shield-checkmark-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-xl font-bold text-gray-900">
            Verification Required
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            You are not verified. Please wait until you get verified by the Team.
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3"
            onPress={() => {
              if (userRole === 'Doctor') {
                router.push('../guide-doctor');
              } else if (userRole === 'PharmaCist') {
                router.push('../guide-pharma');
              } else {
                router.push('../guide-doctor');
              }
            }}
          >
            <Text className="font-semibold text-white">View Verification Guide</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-gray-900">Medicines Management</Text>
        <Text className="mb-8 text-gray-600">
          Manage your pharmacy&apos;s medicine inventory and track medicine history.
        </Text>

        <View className="space-y-2">
          <MedicineCard
            title="Current Inventory"
            subtitle="View and manage available medicines"
            icon="medkit-outline"
            onPress={() => {
              // Navigate to current inventory (could be this same page or a separate one)
              console.log('Navigate to current inventory');
            }}
          />

          <MedicineCard
            title="Add New Medicine"
            subtitle="Add new medicines to your inventory"
            icon="add-circle-outline"
            onPress={() => router.push('/medicines/new-medicine')}
          />

          <MedicineCard
            title="Medicine History"
            subtitle="View medicine dispensing and stock history"
            icon="time-outline"
            onPress={() => router.push('/medicines/history')}
          />

          <MedicineCard
            title="Low Stock Alerts"
            subtitle="Medicines running low on stock"
            icon="warning-outline"
            onPress={() => {
              // Navigate to low stock alerts
              console.log('Navigate to low stock alerts');
            }}
          />

          <MedicineCard
            title="Expired Medicines"
            subtitle="Check for expired medicines"
            icon="alert-circle-outline"
            onPress={() => {
              // Navigate to expired medicines
              console.log('Navigate to expired medicines');
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
