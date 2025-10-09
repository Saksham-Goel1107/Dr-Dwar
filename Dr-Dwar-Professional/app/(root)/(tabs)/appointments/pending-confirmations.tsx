import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PendingAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  fee: number;
  duration: number;
  notes: string;
  status: string;
  userId: string;
}

export default function PendingConfirmationsScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);

  // Load vibration settings
  useEffect(() => {
    const loadVibrationSettings = async () => {
      try {
        const vib = await SecureStore.getItemAsync('VIBRATIONS');
        setVibrationsEnabled(vib !== 'false');
      } catch (error) {
        console.error('Error loading vibration settings:', error);
        setVibrationsEnabled(true);
      }
    };
    loadVibrationSettings();
  }, []);

  const fetchPendingAppointments = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctor/appointments`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        // Filter only pending appointments
        const pendingAppointments = data.data.filter(
          (appointment: PendingAppointment) => appointment.status === 'pending',
        );
        setAppointments(pendingAppointments);
      } else {
        Alert.alert('Error', data.message || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchPendingAppointments();
    }, [fetchPendingAppointments]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingAppointments();
  }, [fetchPendingAppointments]);

  const handleConfirmAppointment = async (appointmentId: string, patientName: string) => {
    Alert.alert(
      'Confirm Appointment',
      `Are you sure you want to confirm the appointment with ${patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctor/${appointmentId}/status`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                  },
                  body: JSON.stringify({
                    status: 'CONFIRMED',
                  }),
                },
              );

              const data = await response.json();
              if (data.success) {
                // Provide vibration feedback if enabled
                if (vibrationsEnabled) {
                  const Haptics = (await import('expo-haptics')).default;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }

                Alert.alert('Success', 'Appointment confirmed successfully!');
                // Refresh the list
                fetchPendingAppointments();
              } else {
                Alert.alert('Error', data.message || 'Failed to confirm appointment');
              }
            } catch (error) {
              console.error('Error confirming appointment:', error);
              Alert.alert('Error', 'Failed to confirm appointment. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleRejectAppointment = async (appointmentId: string, patientName: string) => {
    Alert.alert(
      'Reject Appointment',
      `Are you sure you want to reject the appointment with ${patientName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctor/${appointmentId}/status`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                  },
                  body: JSON.stringify({
                    status: 'CANCELLED',
                  }),
                },
              );

              const data = await response.json();
              if (data.success) {
                // Provide vibration feedback if enabled
                if (vibrationsEnabled) {
                  const Haptics = (await import('expo-haptics')).default;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }

                Alert.alert('Success', 'Appointment rejected.');
                // Refresh the list
                fetchPendingAppointments();
              } else {
                Alert.alert('Error', data.message || 'Failed to reject appointment');
              }
            } catch (error) {
              console.error('Error rejecting appointment:', error);
              Alert.alert('Error', 'Failed to reject appointment. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAppointmentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      consultation: 'Initial Consultation',
      follow_up: 'Follow-up Visit',
      emergency: 'Emergency',
      telemedicine: 'Telemedicine',
      home_visit: 'Home Visit',
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-gray-600">Loading pending appointments...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {appointments.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="checkmark-circle-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-center text-lg font-medium text-gray-900">
              No Pending Appointments
            </Text>
            <Text className="mt-2 text-center text-gray-500">
              All appointments have been reviewed
            </Text>
          </View>
        ) : (
          <View className="py-6">
            <Text className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
              {appointments.length} Pending Confirmation{appointments.length !== 1 ? 's' : ''}
            </Text>

            {appointments.map((appointment) => (
              <View key={appointment.id} className="mb-4 rounded-xl bg-white p-6 shadow-sm">
                {/* Patient Info */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    {appointment.patientName}
                  </Text>
                  <Text className="text-sm text-gray-500">{appointment.patientPhone}</Text>
                  {appointment.patientEmail && (
                    <Text className="text-sm text-gray-500">{appointment.patientEmail}</Text>
                  )}
                </View>

                {/* Appointment Details */}
                <View className="mb-4 space-y-2">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-600">
                      {formatDate(appointment.appointmentDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-600">
                      {formatTime(appointment.appointmentTime)} ({appointment.duration} min)
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="medical-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-600">
                      {getAppointmentTypeLabel(appointment.appointmentType)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm font-medium text-green-600">
                      ₹{appointment.fee}
                    </Text>
                  </View>
                </View>

                {/* Symptoms/Notes */}
                {appointment.notes && (
                  <View className="mb-4 rounded-lg bg-gray-50 p-3">
                    <Text className="text-sm text-gray-700">{appointment.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="mb-3">
                  <TouchableOpacity
                    onPress={() =>
                      router.replace(
                        `/(root)/(tabs)/appointments/patients-records?userId=${appointment.userId}`,
                      )
                    }
                    className="mb-3 w-full rounded-lg bg-blue-50 px-4 py-3 active:bg-blue-100"
                  >
                    <Text className="text-center font-medium text-blue-600">
                      View Patient History
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => handleRejectAppointment(appointment.id, appointment.patientName)}
                    className="flex-1 rounded-lg bg-red-50 px-4 py-3 active:bg-red-100"
                  >
                    <Text className="text-center font-medium text-red-600">Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleConfirmAppointment(appointment.id, appointment.patientName)
                    }
                    className="flex-1 rounded-lg bg-green-600 px-4 py-3 active:bg-green-700"
                  >
                    <Text className="text-center font-medium text-white">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
