import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
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

interface Appointment {
  id: string;
  scheduledDate: string;
  startTime: string;
  appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'TELEMEDICINE';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  symptoms: string;
  notes?: string;
  fee: number;
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
  createdAt: string;
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#16a34a',
  COMPLETED: '#6b7280',
  CANCELLED: '#dc2626',
  NO_SHOW: '#9ca3af',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  useEffect(() => {
    const loadVibrationSettings = async () => {
      try {
        const vib = await SecureStore.getItemAsync('VIBRATIONS');
        setVibrationsEnabled(vib !== 'false'); // Default to true
      } catch (error) {
        console.error('Error loading vibration settings:', error);
        setVibrationsEnabled(true); // Default to true on error
      }
    };

    loadVibrationSettings();
  }, []);

  // Load network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch appointments
  const fetchAppointments = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) setIsRefreshing(true);
        else setIsLoading(true);

        const token = await getToken();
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/my-appointments`,
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
          setAppointments(data.data || []);
        } else {
          Alert.alert('Error', data.message || 'Failed to load appointments');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        Alert.alert('Error', 'Failed to load appointments. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getToken],
  );

  useEffect(() => {
    if (networkStatus) {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatus]);

  const handleRefresh = () => {
    fetchAppointments(true);
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/${appointmentId}/cancel`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt)),
        );
        Alert.alert('Success', 'Appointment cancelled successfully');
      } else {
        Alert.alert('Cancellation Failed', data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    if (appointment.status !== 'PENDING' && appointment.status !== 'CONFIRMED') {
      return false;
    }

    const appointmentDateTime = new Date(`${appointment.scheduledDate}T${appointment.startTime}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Allow cancellation up to 2 hours before appointment
    return hoursDifference > 2;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const appointmentDateTime = new Date(`${apt.scheduledDate}T${apt.startTime}`);
    const now = new Date();

    if (selectedFilter === 'UPCOMING') {
      return appointmentDateTime >= now && apt.status !== 'CANCELLED';
    } else if (selectedFilter === 'PAST') {
      return (
        appointmentDateTime < now ||
        apt.status === 'COMPLETED' ||
        apt.status === 'CANCELLED' ||
        apt.status === 'NO_SHOW'
      );
    }
    return true;
  });

  const sortedAppointments = filteredAppointments.sort((a, b) => {
    // Sort by date first, then by time
    const dateA = new Date(`${a.scheduledDate}T${a.startTime}`);
    const dateB = new Date(`${b.scheduledDate}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (!networkStatus) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="wifi-off" size={48} color="#6b7280" />
        <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          No Internet Connection
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ fontSize: 16, color: '#64748b', marginTop: 16 }}>
          Loading your appointments...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#16a34a',
          paddingTop: 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 45,
            left: 20,
            zIndex: 1,
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
          }}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
            My Appointments
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            View and manage your appointments
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'UPCOMING', label: 'Upcoming' },
              { key: 'PAST', label: 'Past' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key as any)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: selectedFilter === filter.key ? '#16a34a' : '#ffffff',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: selectedFilter === filter.key ? '#16a34a' : '#e5e7eb',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: selectedFilter === filter.key ? '#ffffff' : '#374151',
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#16a34a']}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {sortedAppointments.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={64} color="#d1d5db" />
            <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
              No appointments found
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
              {selectedFilter === 'ALL'
                ? "You haven't booked any appointments yet"
                : `No ${selectedFilter.toLowerCase()} appointments`}
            </Text>
            {selectedFilter === 'ALL' && (
              <TouchableOpacity
                onPress={() => router.push('/(root)/appointments')}
                style={{
                  marginTop: 20,
                  backgroundColor: '#16a34a',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
                  Book Your First Appointment
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            {sortedAppointments.map((appointment) => (
              <View
                key={appointment.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}
                    >
                      Dr. {appointment.doctor.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
                      {appointment.doctor.specialization}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons name="calendar" size={14} color="#64748b" />
                      <Text style={{ fontSize: 14, color: '#64748b' }}>
                        {formatAppointmentDate(appointment.scheduledDate)} at{' '}
                        {appointment.startTime}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: STATUS_COLORS[appointment.status],
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#ffffff' }}>
                      {STATUS_LABELS[appointment.status]}
                    </Text>
                  </View>
                </View>

                {/* Appointment Details */}
                <View style={{ marginBottom: 12 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}
                  >
                    <MaterialCommunityIcons name="medical-bag" size={14} color="#64748b" />
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      {appointment.appointmentType.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="currency-inr" size={14} color="#64748b" />
                    <Text style={{ fontSize: 14, color: '#64748b' }}>₹{appointment.fee}</Text>
                  </View>
                </View>

                {/* Symptoms */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}
                  >
                    Symptoms:
                  </Text>
                  <Text style={{ fontSize: 14, color: '#64748b', lineHeight: 20 }}>
                    {appointment.symptoms}
                  </Text>
                </View>

                {/* Notes */}
                {appointment.notes && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}
                    >
                      Notes:
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', lineHeight: 20 }}>
                      {appointment.notes}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                {canCancelAppointment(appointment) && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Cancel Appointment',
                        'Are you sure you want to cancel this appointment? This action cannot be undone.',
                        [
                          { text: 'Keep Appointment', style: 'cancel' },
                          {
                            text: 'Cancel Appointment',
                            onPress: () => cancelAppointment(appointment.id),
                            style: 'destructive',
                          },
                        ],
                      );
                    }}
                    style={{
                      backgroundColor: '#dc2626',
                      paddingVertical: 10,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                      Cancel Appointment
                    </Text>
                  </TouchableOpacity>
                )}

                {appointment.status === 'CONFIRMED' && (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: '#dcfce7',
                      borderRadius: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
                      <Text style={{ fontSize: 14, color: '#166534', fontWeight: '600' }}>
                        Appointment Confirmed
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                      Your appointment has been confirmed by the doctor.
                    </Text>
                  </View>
                )}

                {appointment.status === 'COMPLETED' && (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: '#f3f4f6',
                      borderRadius: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons name="check-all" size={16} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>
                        Appointment Completed
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      This appointment has been completed.
                    </Text>
                  </View>
                )}

                {appointment.status === 'CANCELLED' && (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: '#fef2f2',
                      borderRadius: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialCommunityIcons name="close-circle" size={16} color="#dc2626" />
                      <Text style={{ fontSize: 14, color: '#991b1b', fontWeight: '600' }}>
                        Appointment Cancelled
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                      This appointment has been cancelled.
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
