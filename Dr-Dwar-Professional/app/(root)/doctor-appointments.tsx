import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  fee: number;
  duration: number;
  notes?: string;
}

const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function DoctorAppointmentsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Refs to prevent infinite loading
  const dataLoadedRef = useRef(false);
  const prevNetworkStatusRef = useRef<boolean | null>(null);

  // Haptics setting
  const vibrationsEnabled = true;

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
  const fetchAppointments = useCallback(async () => {
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
        setAppointments(data.data || []);
      } else {
        Alert.alert('Error', 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    }
  }, [getToken]);

  const loadAppointments = useCallback(async () => {
    if (networkStatus) {
      await fetchAppointments();
    }
  }, [networkStatus, fetchAppointments]);

  useEffect(() => {
    const prevStatus = prevNetworkStatusRef.current;
    prevNetworkStatusRef.current = networkStatus;

    // Only load if network just became available and we haven't loaded data yet
    if (networkStatus && !prevStatus && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadAppointments().finally(() => setIsLoading(false));
    } else if (!networkStatus) {
      setIsLoading(false);
    }
  }, [networkStatus, loadAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
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
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/${appointmentId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, status: newStatus as any } : apt,
          ),
        );
        Alert.alert('Success', `Appointment ${newStatus} successfully`);
      } else {
        Alert.alert('Update Failed', data.message || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const getStatusActions = (appointment: Appointment) => {
    const actions = [];

    if (appointment.status === 'pending') {
      actions.push(
        {
          text: 'Confirm',
          onPress: () => updateAppointmentStatus(appointment.id, 'confirmed'),
          style: 'default' as const,
        },
        {
          text: 'Cancel',
          onPress: () => updateAppointmentStatus(appointment.id, 'cancelled'),
          style: 'destructive' as const,
        },
      );
    } else if (appointment.status === 'confirmed') {
      actions.push(
        {
          text: 'Mark Complete',
          onPress: () => updateAppointmentStatus(appointment.id, 'completed'),
          style: 'default' as const,
        },
        {
          text: 'Cancel',
          onPress: () => updateAppointmentStatus(appointment.id, 'cancelled'),
          style: 'destructive' as const,
        },
      );
    }

    actions.push({ text: 'Cancel', style: 'cancel' as const });
    return actions;
  };

  const filteredAppointments = appointments.filter(
    (apt) => selectedStatus === 'all' || apt.status === selectedStatus,
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
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
          Loading appointments...
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
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            Manage your patient appointments
          </Text>
        </View>
      </View>

      {/* Status Filter */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedStatus(filter.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                backgroundColor: selectedStatus === filter.key ? '#16a34a' : '#ffffff',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: selectedStatus === filter.key ? '#16a34a' : '#e5e7eb',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: selectedStatus === filter.key ? '#ffffff' : '#374151',
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
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
        {filteredAppointments.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#9ca3af" />
            <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
              {selectedStatus === 'all'
                ? 'No appointments found'
                : `No ${selectedStatus} appointments`}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            {filteredAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                onPress={() => {
                  Alert.alert(
                    'Appointment Actions',
                    `What would you like to do with this appointment?`,
                    getStatusActions(appointment),
                  );
                }}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
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
                      style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}
                    >
                      {appointment.patientName}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>
                      📞 {appointment.patientPhone}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      💼 {appointment.consultationType.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <View
                      style={{
                        backgroundColor: STATUS_COLORS[appointment.status],
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#ffffff' }}>
                        {STATUS_LABELS[appointment.status]}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16a34a' }}>
                      ₹{appointment.fee}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 14, color: '#374151', marginBottom: 2 }}>
                      📅 {formatDate(appointment.appointmentDate)}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#374151' }}>
                      🕐 {formatTime(appointment.appointmentTime)} ({appointment.duration}min)
                    </Text>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                </View>

                {appointment.notes && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#e5e7eb',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>
                      📝 {appointment.notes}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
