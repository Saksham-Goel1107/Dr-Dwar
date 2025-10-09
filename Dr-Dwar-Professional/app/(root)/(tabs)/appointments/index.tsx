import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AppointmentCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

function AppointmentCard({ title, subtitle, icon, onPress }: AppointmentCardProps) {
  return (
    <TouchableOpacity
      className="mb-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm active:bg-gray-50"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Ionicons name={icon as any} size={24} color="#059669" />
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

export default function AppointmentsScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    throw new Error('User not found');
  }

  const isVerified = user.unsafeMetadata?.isVerified ?? false;
  const userRole = user.unsafeMetadata?.role ?? 'user';

  const appointmentCards = [
    {
      title: 'Set Availability',
      subtitle: 'Configure your working hours and days',
      icon: 'time-outline',
      onPress: () => router.push('/(root)/doctor-availability'),
      keywords: ['availability', 'schedule', 'hours', 'days', 'working'],
    },
    {
      title: 'Set Consultation Fees',
      subtitle: 'Configure your fees for different appointment types',
      icon: 'cash-outline',
      onPress: () => router.push('/(root)/doctor-fees'),
      keywords: ['fees', 'consultation', 'payment', 'pricing', 'cost'],
    },
    {
      title: "Today's Appointments",
      subtitle: "View and manage today's schedule",
      icon: 'today-outline',
      onPress: () => router.push('/(root)/doctor-appointments'),
      keywords: ['today', 'schedule', 'current', 'appointments', 'daily'],
    },
    {
      title: 'Schedule New Appointment',
      subtitle: 'Book a new appointment for a patient',
      icon: 'add-circle-outline',
      onPress: () => router.push('/appointments/schedule'),
      keywords: ['schedule', 'new', 'book', 'appointment', 'patient'],
    },
    {
      title: 'Appointment History',
      subtitle: 'View past appointments and records',
      icon: 'time-outline',
      onPress: () => router.push('/appointments/history'),
      keywords: ['history', 'past', 'records', 'previous', 'archive'],
    },
    {
      title: 'Calendar View',
      subtitle: 'View appointments in calendar format',
      icon: 'calendar-outline',
      onPress: () => router.push('/appointments/calendar'),
      keywords: ['calendar', 'view', 'month', 'date', 'visual'],
    },
    {
      title: 'Pending Confirmations',
      subtitle: 'Appointments waiting for confirmation',
      icon: 'hourglass-outline',
      onPress: () => router.push('/(root)/(tabs)/appointments/pending-confirmations'),
      keywords: ['pending', 'confirmation', 'waiting', 'approve', 'review'],
    }
  ];

  const filteredCards = appointmentCards.filter(
    (card) =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase())),
  );

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
        <Text className="mb-6 text-2xl font-bold text-gray-900">Appointments</Text>
        <Text className="mb-8 text-gray-600">
          Manage your medical appointments and patient schedules.
        </Text>

        {/* Search Bar */}
        <View className="mb-6">
          <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-4 py-3">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="ml-3 flex-1 text-gray-900"
              placeholder="Search appointments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="space-y-2">
          {filteredCards.map((card, index) => (
            <AppointmentCard
              key={index}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              onPress={card.onPress}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
