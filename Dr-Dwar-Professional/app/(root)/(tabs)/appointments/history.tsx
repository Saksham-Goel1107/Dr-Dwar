import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

interface AppointmentHistoryItem {
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
}

function HistoryItem({ item }: { item: AppointmentHistoryItem }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'pending':
        return 'time';
      default:
        return 'ellipse';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header with Patient Name and Status */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-lg font-bold text-gray-900">{item.patientName}</Text>
          <View className={`inline-flex rounded-full px-2 py-1 ${getStatusColor(item.status)}`}>
            <View className="flex-row items-center">
              <Ionicons
                name={getStatusIcon(item.status) as any}
                size={12}
                color={getStatusColor(item.status)
                  .split(' ')[0]
                  .replace('text-', '')
                  .replace('-600', '')}
              />
              <Text
                className={`ml-1 text-xs font-medium ${getStatusColor(item.status).split(' ')[0]}`}
              >
                {formatStatus(item.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Information */}
      <View className="mb-4 rounded-lg bg-gray-50 p-3">
        <Text className="mb-2 text-sm font-semibold text-gray-700">Contact Information</Text>
        <View className="space-y-1">
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={14} color="#6B7280" />
            <Text className="ml-2 text-sm text-gray-600">{item.patientPhone}</Text>
          </View>
          {item.patientEmail && (
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-600">{item.patientEmail}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Appointment Details */}
      <View className="mb-4 rounded-lg bg-blue-50 p-3">
        <Text className="mb-2 text-sm font-semibold text-gray-700">Appointment Details</Text>
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-600">Date</Text>
            </View>
            <Text className="text-sm font-medium text-gray-900">
              {new Date(item.appointmentDate).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-600">Time</Text>
            </View>
            <Text className="text-sm font-medium text-gray-900">
              {item.appointmentTime} ({item.duration} min)
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="medical-outline" size={14} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-600">Type</Text>
            </View>
            <Text className="text-sm font-medium text-gray-900 capitalize">
              {item.appointmentType.replace('_', ' ')}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={14} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-600">Fee</Text>
            </View>
            <Text className="text-sm font-bold text-green-600">₹{item.fee}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {item.notes && (
        <View className="rounded-lg bg-yellow-50 p-3">
          <View className="flex-row items-center mb-2">
            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
            <Text className="ml-2 text-sm font-semibold text-gray-700">Notes</Text>
          </View>
          <Text className="text-sm text-gray-600 italic">&ldquo;{item.notes}&rdquo;</Text>
        </View>
      )}
    </View>
  );
}

export default function AppointmentHistoryScreen() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>(
    'all',
  );
  const [dataLoaded, setDataLoaded] = useState(false);

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
    if (dataLoaded) return; // Don't fetch if already loaded

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
        setDataLoaded(true); // Mark as loaded to prevent further calls
      } else {
        Alert.alert('Error', 'Failed to load appointment history');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointment history');
    }
  }, [getToken, dataLoaded]);

  useEffect(() => {
    // Only load if network is available and we haven't loaded data yet
    if (networkStatus && !dataLoaded) {
      fetchAppointments().finally(() => setIsLoading(false));
    } else if (!networkStatus) {
      setIsLoading(false);
    }
  }, [networkStatus, fetchAppointments, dataLoaded]);

  const filteredData =
    filter === 'all' ? appointments : appointments.filter((item) => item.status === filter);

  const FilterButton = ({ title, value }: { title: string; value: typeof filter }) => (
    <TouchableOpacity
      className={`mr-3 rounded-full px-4 py-2 ${filter === value ? 'bg-green-600' : 'bg-gray-200'}`}
      onPress={() => setFilter(value)}
    >
      <Text className={`text-sm font-medium ${filter === value ? 'text-white' : 'text-gray-700'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (!networkStatus) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="wifi" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-medium text-gray-500">No Internet Connection</Text>
        <Text className="mt-2 text-center text-sm text-gray-400">
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-4 text-lg font-medium text-gray-500">
          Loading appointment history...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-gray-900">Appointment History</Text>

        {/* Filter Buttons */}
        <View className="mb-6 flex-row">
          <FilterButton title="All" value="all" />
          <FilterButton title="Pending" value="pending" />
          <FilterButton title="Confirmed" value="confirmed" />
          <FilterButton title="Completed" value="completed" />
          <FilterButton title="Cancelled" value="cancelled" />
        </View>

        {/* History List */}
        {filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryItem item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-medium text-gray-500">No appointments found</Text>
            <Text className="mt-2 text-center text-sm text-gray-400">
              {filter === 'all'
                ? 'No appointment history available yet.'
                : `No ${filter} appointments found.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
