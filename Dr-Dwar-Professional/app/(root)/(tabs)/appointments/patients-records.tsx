import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

interface PatientProfile {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  email: string;
  profileData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    diseases?: string;
    allergies?: string;
    medicalNote?: string;
    emergencyContact?: {
      name?: string;
      relation?: string;
      phone?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface PatientAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  fee: number;
  duration: number;
  notes: string;
}

export default function PatientRecordsScreen() {
  const { getToken } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatEmergencyContact = (contact: {
    name?: string;
    relation?: string;
    phone?: string;
  }) => {
    if (!contact || typeof contact !== 'object') return '';
    const parts = [];
    if (contact.name && typeof contact.name === 'string') parts.push(`Name: ${contact.name}`);
    if (contact.relation && typeof contact.relation === 'string')
      parts.push(`Relation: ${contact.relation}`);
    if (contact.phone && typeof contact.phone === 'string') parts.push(`Phone: ${contact.phone}`);
    return parts.join(', ');
  };

  const formatAddress = (address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => {
    if (!address || typeof address !== 'object') return '';
    const parts = [];
    if (address.line1 && typeof address.line1 === 'string') parts.push(address.line1);
    if (address.line2 && typeof address.line2 === 'string') parts.push(address.line2);
    const cityState = [];
    if (address.city && typeof address.city === 'string') cityState.push(address.city);
    if (address.state && typeof address.state === 'string') cityState.push(address.state);
    if (cityState.length > 0) parts.push(cityState.join(', '));
    if (address.pincode && typeof address.pincode === 'string') parts.push(address.pincode);
    return parts.join(', ');
  };

  const fetchPatientData = useCallback(async () => {
    if (!userId) return;

    try {
      const token = await getToken();

      // Fetch patient profile
      const profileResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/profile/${userId}?t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const profileData = await profileResponse.json();

      if (profileData.success) {
        setPatientProfile(profileData.data);
      } else {
        Alert.alert('Error', 'Failed to load patient profile');
        return;
      }

      // Fetch patient's appointment history
      const appointmentsResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctor/patient/${userId}/appointments?t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );

      const appointmentsData = await appointmentsResponse.json();

      if (appointmentsData.success) {
        setPatientAppointments(appointmentsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to load patient data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getToken]); // Remove userId from dependencies

  useEffect(() => {
    if (userId) {
      fetchPatientData();
    }
  }, [userId, fetchPatientData]); // Add userId and fetchPatientData to useEffect dependencies

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatientData();
  }, [fetchPatientData]);

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10B981';
      case 'confirmed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="mt-4 text-gray-600">Loading patient records...</Text>
      </View>
    );
  }

  if (!patientProfile) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-white px-6 pb-4 pt-12 shadow-sm">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-full bg-gray-100 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Patient Records</Text>
            <View className="w-10" />
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-outline" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-center text-lg font-medium text-gray-900">
            Patient Not Found
          </Text>
          <Text className="mt-2 text-center text-gray-500">Unable to load patient information</Text>
        </View>
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
        {/* Patient Profile Card */}
        <View className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <View className="mb-4 flex-row items-center">
            <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="person" size={32} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {patientProfile.profileData?.firstName && patientProfile.profileData?.lastName
                  ? `${patientProfile.profileData.firstName} ${patientProfile.profileData.lastName}`
                  : patientProfile.userName}
              </Text>
              <Text className="text-sm text-gray-500">{patientProfile.phoneNumber}</Text>
              {patientProfile.email && (
                <Text className="text-sm text-gray-500">{patientProfile.email}</Text>
              )}
            </View>
          </View>

          {/* Basic Information */}
          <View className="mb-4">
            <Text className="mb-3 text-lg font-semibold text-gray-900">Basic Information</Text>
            <View className="space-y-2">
              {patientProfile.profileData?.dateOfBirth && (
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600">
                    DOB: {new Date(patientProfile.profileData.dateOfBirth).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {patientProfile.profileData?.gender && (
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm capitalize text-gray-600">
                    Gender: {patientProfile.profileData.gender}
                  </Text>
                </View>
              )}
              {patientProfile.profileData?.address && (
                <View className="flex-row items-start">
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600">
                    Address: {formatAddress(patientProfile.profileData.address)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Medical Information */}
          {(patientProfile.profileData?.diseases ||
            patientProfile.profileData?.allergies ||
            patientProfile.profileData?.medicalNote ||
            patientProfile.profileData?.emergencyContact) && (
            <View>
              <Text className="mb-3 text-lg font-semibold text-gray-900">Medical Information</Text>
              <View className="space-y-3">
                {patientProfile.profileData?.diseases && (
                  <View className="rounded-lg bg-red-50 p-3">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="medical" size={16} color="#DC2626" />
                      <Text className="ml-2 text-sm font-medium text-red-800">
                        Medical Conditions
                      </Text>
                    </View>
                    <Text className="text-sm text-red-700">
                      {patientProfile.profileData.diseases}
                    </Text>
                  </View>
                )}

                {patientProfile.profileData?.allergies && (
                  <View className="rounded-lg bg-orange-50 p-3">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="warning" size={16} color="#EA580C" />
                      <Text className="ml-2 text-sm font-medium text-orange-800">Allergies</Text>
                    </View>
                    <Text className="text-sm text-orange-700">
                      {patientProfile.profileData.allergies}
                    </Text>
                  </View>
                )}

                {patientProfile.profileData?.medicalNote && (
                  <View className="rounded-lg bg-blue-50 p-3">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                      <Text className="ml-2 text-sm font-medium text-blue-800">Medical Notes</Text>
                    </View>
                    <Text className="text-sm text-blue-700">
                      {patientProfile.profileData.medicalNote}
                    </Text>
                  </View>
                )}

                {patientProfile.profileData?.emergencyContact && (
                  <View className="rounded-lg bg-green-50 p-3">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="call" size={16} color="#059669" />
                      <Text className="ml-2 text-sm font-medium text-green-800">
                        Emergency Contact
                      </Text>
                    </View>
                    <Text className="text-sm text-green-700">
                      {formatEmergencyContact(patientProfile.profileData.emergencyContact)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Appointment History */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            Appointment History ({patientAppointments.length})
          </Text>

          {patientAppointments.length === 0 ? (
            <View className="items-center justify-center rounded-xl bg-white py-12 shadow-sm">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text className="mt-4 text-center text-gray-500">No appointment history</Text>
            </View>
          ) : (
            patientAppointments.map((appointment) => (
              <View key={appointment.id} className="mb-3 rounded-xl bg-white p-4 shadow-sm">
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="mb-2 flex-row items-center">
                      <Ionicons name="medical" size={16} color="#6B7280" />
                      <Text className="ml-2 text-sm font-medium text-gray-900">
                        {getAppointmentTypeLabel(appointment.appointmentType)}
                      </Text>
                    </View>
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text className="ml-2 text-sm text-gray-600">
                        {formatDate(appointment.appointmentDate)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text className="ml-2 text-sm text-gray-600">
                        {formatTime(appointment.appointmentTime)} ({appointment.duration} min)
                      </Text>
                    </View>
                  </View>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: `${getStatusColor(appointment.status)}20` }}
                  >
                    <Text
                      className="text-xs font-medium capitalize"
                      style={{ color: getStatusColor(appointment.status) }}
                    >
                      {appointment.status}
                    </Text>
                  </View>
                </View>

                {appointment.notes && (
                  <View className="rounded-lg bg-gray-50 p-3">
                    <Text className="text-sm text-gray-700">{appointment.notes}</Text>
                  </View>
                )}

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-green-600">₹{appointment.fee}</Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
