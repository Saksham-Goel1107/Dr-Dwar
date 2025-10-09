import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MedicalNoteForm from '../../components/MedicalNoteForm';
import PrescriptionForm from '../../components/PrescriptionForm';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  fee: number;
  duration: number;
  notes?: string;
  userId: string;
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
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState(new Date());
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [medicalNoteModalVisible, setMedicalNoteModalVisible] = useState(false);
  const [selectedAppointmentForForms, setSelectedAppointmentForForms] =
    useState<Appointment | null>(null);

  // Refs to prevent infinite loading
  const dataLoadedRef = useRef(false);
  const prevNetworkStatusRef = useRef<boolean | null>(null);

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

    // Convert status to uppercase for Prisma enum
    const prismaStatus = newStatus.toUpperCase();

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
          body: JSON.stringify({ status: prismaStatus }),
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

  const openRescheduleModal = (appointment: Appointment) => {
    const currentDate = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
    const currentTime = new Date();
    currentTime.setHours(hours, minutes, 0, 0);

    setSelectedAppointment(appointment);
    setNewDate(currentDate);
    setNewTime(currentTime);
    setRescheduleModalVisible(true);
  };

  const closeRescheduleModal = () => {
    setRescheduleModalVisible(false);
    setSelectedAppointment(null);
    setNewDate(new Date());
    setNewTime(new Date());
  };

  const handleReschedule = async () => {
    if (!selectedAppointment) {
      Alert.alert('Error', 'Please select an appointment');
      return;
    }

    // Convert Date objects to strings for display
    const dateString = newDate.toISOString().split('T')[0];
    const timeString = `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`;

    // Check if date/time has changed
    const originalDate = selectedAppointment.appointmentDate;
    const originalTime = selectedAppointment.appointmentTime;

    if (dateString === originalDate && timeString === originalTime) {
      Alert.alert('No Changes', 'Please select a different date or time');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Reschedule',
      `Reschedule ${selectedAppointment.patientName}'s appointment from ${formatDate(originalDate)} ${formatTime(originalTime)} to ${formatDate(dateString)} ${formatTime(timeString)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reschedule',
          onPress: () => performReschedule(dateString, timeString),
        },
      ],
    );
  };

  const performReschedule = async (dateString: string, timeString: string) => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    setRescheduleLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/${selectedAppointment!.id}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            newDate: dateString,
            newTime: timeString,
            duration: selectedAppointment!.duration,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update the appointment in the local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === selectedAppointment!.id
              ? { ...apt, appointmentDate: dateString, appointmentTime: timeString }
              : apt,
          ),
        );
        Alert.alert('Success', 'Appointment rescheduled successfully');
        closeRescheduleModal();
      } else {
        Alert.alert('Reschedule Failed', data.message || 'Failed to reschedule appointment');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const getStatusActions = (appointment: Appointment) => {
    const actions = [];

    // Check if appointment is in the future for reprocessing cancelled appointments
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}`,
    );
    const now = new Date();
    const isFutureAppointment = appointmentDateTime > now;

    // Add View Patient History action for all appointments
    actions.push({
      text: 'View Patient History',
      onPress: () => router.push(`/appointments/patients-records?userId=${appointment.userId}`),
      style: 'default' as const,
    });

    if (appointment.status === 'pending') {
      actions.push(
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert(
              'Confirm Appointment',
              `Are you sure you want to confirm the appointment with ${appointment.patientName}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  onPress: () => updateAppointmentStatus(appointment.id, 'confirmed'),
                },
              ],
            );
          },
          style: 'default' as const,
        },
        {
          text: 'Reschedule',
          onPress: () => openRescheduleModal(appointment),
          style: 'default' as const,
        },
        {
          text: 'Cancel',
          onPress: () => {
            Alert.alert(
              'Cancel Appointment',
              `Are you sure you want to cancel the appointment with ${appointment.patientName}? This action cannot be undone.`,
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Cancel',
                  style: 'destructive',
                  onPress: () => updateAppointmentStatus(appointment.id, 'cancelled'),
                },
              ],
            );
          },
          style: 'destructive' as const,
        },
      );
    } else if (appointment.status === 'confirmed') {
      actions.push(
        {
          text: 'Mark Complete',
          onPress: () => {
            Alert.alert(
              'Complete Appointment',
              `Would you like to add prescription or medical notes for ${appointment.patientName}?`,
              [
                { text: 'Just Complete', onPress: () => updateAppointmentStatus(appointment.id, 'completed') },
                {
                  text: 'Add Prescription',
                  onPress: () => {
                    setSelectedAppointmentForForms(appointment);
                    setPrescriptionModalVisible(true);
                  },
                },
                {
                  text: 'Add Medical Notes',
                  onPress: () => {
                    setSelectedAppointmentForForms(appointment);
                    setMedicalNoteModalVisible(true);
                  },
                },
              ],
            );
          },
          style: 'default' as const,
        },
        {
          text: 'Reschedule',
          onPress: () => openRescheduleModal(appointment),
          style: 'default' as const,
        },
        {
          text: 'Cancel',
          onPress: () => {
            Alert.alert(
              'Cancel Appointment',
              `Are you sure you want to cancel the appointment with ${appointment.patientName}? This action cannot be undone.`,
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Cancel',
                  style: 'destructive',
                  onPress: () => updateAppointmentStatus(appointment.id, 'cancelled'),
                },
              ],
            );
          },
          style: 'destructive' as const,
        },
      );
    } else if (appointment.status === 'cancelled' && isFutureAppointment) {
      actions.push({
        text: 'Reprocess',
        onPress: () => {
          Alert.alert(
            'Reprocess Appointment',
            `Reactivate the cancelled appointment with ${appointment.patientName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reprocess',
                onPress: () => updateAppointmentStatus(appointment.id, 'pending'),
              },
            ],
          );
        },
        style: 'default' as const,
      });
    }

    // Add Close option at the beginning
    actions.unshift({ text: 'Close', style: 'cancel' as const });

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
                {/* Header with Patient Name and Status */}
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
                    <View
                      style={{
                        backgroundColor: STATUS_COLORS[appointment.status],
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '500', color: '#ffffff' }}>
                        {STATUS_LABELS[appointment.status]}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact Information */}
                <View
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}
                  >
                    Contact Information
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MaterialCommunityIcons name="phone" size={14} color="#6b7280" />
                    <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>
                      {appointment.patientPhone}
                    </Text>
                  </View>
                  {appointment.patientEmail && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MaterialCommunityIcons name="email-outline" size={14} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>
                        {appointment.patientEmail}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Appointment Details */}
                <View
                  style={{
                    backgroundColor: '#eff6ff',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}
                  >
                    Appointment Details
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>Date</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b' }}>
                      {formatDate(appointment.appointmentDate)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>Time</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#1e293b' }}>
                      {formatTime(appointment.appointmentTime)} ({appointment.duration} min)
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="medical-bag" size={14} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>Type</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#1e293b',
                        textTransform: 'capitalize',
                      }}
                    >
                      {appointment.appointmentType.replace('_', ' ')}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="cash" size={14} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 8 }}>Fee</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16a34a' }}>
                      ₹{appointment.fee}
                    </Text>
                  </View>
                </View>

                {/* Notes */}
                {appointment.notes && (
                  <View
                    style={{
                      backgroundColor: '#fefce8',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <MaterialCommunityIcons name="note-text-outline" size={14} color="#6b7280" />
                      <Text
                        style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 8 }}
                      >
                        Notes
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>
                      {appointment.notes}
                    </Text>
                  </View>
                )}

                {/* Action Buttons for Completed Appointments */}
                {appointment.status === 'completed' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      gap: 8,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAppointmentForForms(appointment);
                        setPrescriptionModalVisible(true);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#3b82f6',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="pill" size={14} color="#ffffff" />
                      <Text
                        style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginLeft: 4 }}
                      >
                        Prescription
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAppointmentForForms(appointment);
                        setMedicalNoteModalVisible(true);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#10b981',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="note-text-outline" size={14} color="#ffffff" />
                      <Text
                        style={{ fontSize: 12, fontWeight: '600', color: '#ffffff', marginLeft: 4 }}
                      >
                        Notes
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Indicator */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRescheduleModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#1e293b' }}>
                Reschedule Appointment
              </Text>
              <TouchableOpacity onPress={closeRescheduleModal}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 }}
                >
                  {selectedAppointment.patientName}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                  Current: {formatDate(selectedAppointment.appointmentDate)} at{' '}
                  {formatTime(selectedAppointment.appointmentTime)}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  Duration: {selectedAppointment.duration} minutes
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                New Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                }}
              >
                <Text style={{ fontSize: 16, color: '#374151' }}>
                  {newDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                New Time
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: '#f9fafb',
                }}
              >
                <Text style={{ fontSize: 16, color: '#374151' }}>
                  {newTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedAppointment) {
                    Alert.alert(
                      'Cancel Appointment',
                      `Are you sure you want to cancel the appointment with ${selectedAppointment.patientName}? This action cannot be undone.`,
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: () => {
                            updateAppointmentStatus(selectedAppointment.id, 'cancelled');
                            closeRescheduleModal();
                          },
                        },
                      ],
                    );
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#fee2e2',
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#fecaca',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#dc2626' }}>
                  Cancel Appointment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeRescheduleModal}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReschedule}
                disabled={rescheduleLoading}
                style={{
                  flex: 1,
                  backgroundColor: rescheduleLoading ? '#9ca3af' : '#3b82f6',
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                {rescheduleLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#ffffff' }}>
                    Reschedule
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={newDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event: any, selectedDate?: Date) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setNewDate(selectedDate);
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={newTime}
            mode="time"
            display="default"
            onChange={(event: any, selectedTime?: Date) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setNewTime(selectedTime);
              }
            }}
          />
        )}
      </Modal>

      {/* Prescription Modal */}
      {selectedAppointmentForForms && (
        <PrescriptionForm
          visible={prescriptionModalVisible}
          onClose={() => {
            setPrescriptionModalVisible(false);
            setSelectedAppointmentForForms(null);
          }}
          appointmentId={selectedAppointmentForForms.id}
          patientName={selectedAppointmentForForms.patientName}
          onSuccess={async () => {
            setPrescriptionModalVisible(false);
            setSelectedAppointmentForForms(null);
            // Mark appointment as completed after adding prescription (only if not already completed)
            const currentAppointment = selectedAppointmentForForms;
            setSelectedAppointmentForForms(null);
            if (currentAppointment && currentAppointment.status !== 'completed') {
              await updateAppointmentStatus(currentAppointment.id, 'completed');
            }
            // Refresh appointments to show updated status
            loadAppointments();
          }}
        />
      )}

      {/* Medical Note Modal */}
      {selectedAppointmentForForms && (
        <MedicalNoteForm
          visible={medicalNoteModalVisible}
          onClose={() => {
            setMedicalNoteModalVisible(false);
            setSelectedAppointmentForForms(null);
          }}
          patientId={selectedAppointmentForForms.userId}
          patientName={selectedAppointmentForForms.patientName}
          appointmentId={selectedAppointmentForForms.id}
          onSuccess={async () => {
            setMedicalNoteModalVisible(false);
            setSelectedAppointmentForForms(null);
            // Mark appointment as completed after adding medical notes (only if not already completed)
            const currentAppointment = selectedAppointmentForForms;
            setSelectedAppointmentForForms(null);
            if (currentAppointment && currentAppointment.status !== 'completed') {
              await updateAppointmentStatus(currentAppointment.id, 'completed');
            }
            // Refresh appointments to show updated status
            loadAppointments();
          }}
        />
      )}
    </View>
  );
}
