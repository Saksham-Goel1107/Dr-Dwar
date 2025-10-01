import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
            <Text className="text-sm font-medium capitalize text-gray-900">
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
          <View className="mb-2 flex-row items-center">
            <Ionicons name="document-text-outline" size={14} color="#6B7280" />
            <Text className="ml-2 text-sm font-semibold text-gray-700">Notes</Text>
          </View>
          <Text className="text-sm italic text-gray-600">&ldquo;{item.notes}&rdquo;</Text>
        </View>
      )}
    </View>
  );
}

export default function AppointmentHistoryScreen() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>(
    'all',
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentHistoryItem | null>(
    null,
  );
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState(new Date());
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);
  const [showRescheduleTimePicker, setShowRescheduleTimePicker] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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
        setDataLoaded(true);
      } else {
        Alert.alert('Error', 'Failed to load appointment history');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointment history');
    }
  }, [getToken]);

  useEffect(() => {
    if (networkStatus && !dataLoaded) {
      fetchAppointments().finally(() => setIsLoading(false));
    } else if (!networkStatus) {
      setIsLoading(false);
    }
  }, [networkStatus, fetchAppointments, dataLoaded]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setDataLoaded(false);
    await fetchAppointments();
    setIsRefreshing(false);
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

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

  // Reschedule functions
  const openRescheduleModal = (appointment: AppointmentHistoryItem) => {
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

    const dateString = newDate.toISOString().split('T')[0];
    const timeString = `${newTime.getHours().toString().padStart(2, '0')}:${newTime.getMinutes().toString().padStart(2, '0')}`;

    const originalDate = selectedAppointment.appointmentDate;
    const originalTime = selectedAppointment.appointmentTime;

    if (dateString === originalDate && timeString === originalTime) {
      Alert.alert('No Changes', 'Please select a different date or time');
      return;
    }

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

  const getStatusActions = (appointment: AppointmentHistoryItem) => {
    const actions = [];
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}`,
    );
    const now = new Date();
    const isFutureAppointment = appointmentDateTime > now;

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
              `Are you sure you want to cancel the appointment with ${appointment.patientName}?`,
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
              `Mark the appointment with ${appointment.patientName} as completed?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Complete',
                  onPress: () => updateAppointmentStatus(appointment.id, 'completed'),
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
              `Are you sure you want to cancel the appointment with ${appointment.patientName}?`,
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

    actions.unshift({ text: 'Close', style: 'cancel' as const });
    return actions;
  };

  // Filter appointments based on search, date, and status
  const filteredData = appointments.filter((item) => {
    // Status filter
    if (filter !== 'all' && item.status !== filter) return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = item.patientName.toLowerCase().includes(query);
      const matchesPhone = item.patientPhone.includes(query);
      const matchesEmail = item.patientEmail?.toLowerCase().includes(query);
      const matchesType = item.appointmentType.toLowerCase().includes(query);

      if (!matchesName && !matchesPhone && !matchesEmail && !matchesType) {
        return false;
      }
    }

    // Date filter
    if (dateFilter) {
      const filterDateStr = dateFilter.toISOString().split('T')[0];
      if (item.appointmentDate !== filterDateStr) return false;
    }

    return true;
  });

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
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="p-6">
          <Text className="mb-6 text-2xl font-bold text-gray-900">Appointment History</Text>

          {/* Search Bar */}
          <View className="mb-4 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="ml-2 flex-1 text-base text-gray-900"
              placeholder="Search by name, phone, email, or type..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Filter */}
          <View className="mb-4 flex-row items-center">
            <TouchableOpacity
              className="mr-3 flex-1 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-sm text-gray-700">
                  {dateFilter
                    ? dateFilter.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Filter by date'}
                </Text>
              </View>
              {dateFilter && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setDateFilter(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Clear All Filters */}
            {(searchQuery || dateFilter || filter !== 'all') && (
              <TouchableOpacity
                className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => {
                  setSearchQuery('');
                  setDateFilter(null);
                  setFilter('all');
                }}
              >
                <Text className="text-sm font-medium text-red-600">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <FilterButton title="All" value="all" />
            <FilterButton title="Pending" value="pending" />
            <FilterButton title="Confirmed" value="confirmed" />
            <FilterButton title="Completed" value="completed" />
            <FilterButton title="Cancelled" value="cancelled" />
          </ScrollView>

          {/* Results Count */}
          {(searchQuery || dateFilter || filter !== 'all') && (
            <View className="mb-4 rounded-lg bg-blue-50 px-4 py-2">
              <Text className="text-sm text-blue-700">
                Found {filteredData.length} appointment{filteredData.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* History List */}
          {filteredData.length > 0 ? (
            <View>
              {filteredData.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    Alert.alert(
                      'Appointment Actions',
                      `What would you like to do with this appointment?`,
                      getStatusActions(item),
                    );
                  }}
                >
                  <HistoryItem item={item} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
              <Text className="mt-4 text-lg font-medium text-gray-500">No appointments found</Text>
              <Text className="mt-2 text-center text-sm text-gray-400">
                {searchQuery || dateFilter
                  ? 'Try adjusting your filters'
                  : filter === 'all'
                    ? 'No appointment history available yet.'
                    : `No ${filter} appointments found.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDateFilter(selectedDate);
            }
          }}
        />
      )}

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRescheduleModal}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-5">
          <View className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-gray-900">Reschedule Appointment</Text>
              <TouchableOpacity onPress={closeRescheduleModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View className="mb-5 rounded-lg bg-gray-50 p-4">
                <Text className="mb-2 text-base font-medium text-gray-900">
                  {selectedAppointment.patientName}
                </Text>
                <Text className="mb-1 text-sm text-gray-600">
                  Current: {formatDate(selectedAppointment.appointmentDate)} at{' '}
                  {formatTime(selectedAppointment.appointmentTime)}
                </Text>
                <Text className="text-sm text-gray-600">
                  Duration: {selectedAppointment.duration} minutes
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">New Date</Text>
              <TouchableOpacity
                onPress={() => setShowRescheduleDatePicker(true)}
                className="rounded-lg border border-gray-300 bg-gray-50 p-3"
              >
                <Text className="text-base text-gray-900">
                  {newDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-base font-medium text-gray-700">New Time</Text>
              <TouchableOpacity
                onPress={() => setShowRescheduleTimePicker(true)}
                className="rounded-lg border border-gray-300 bg-gray-50 p-3"
              >
                <Text className="text-base text-gray-900">
                  {newTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  if (selectedAppointment) {
                    Alert.alert(
                      'Cancel Appointment',
                      `Are you sure you want to cancel the appointment with ${selectedAppointment.patientName}?`,
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
                className="flex-1 items-center rounded-lg border border-red-300 bg-red-50 py-3"
              >
                <Text className="text-sm font-medium text-red-600">Cancel Appointment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeRescheduleModal}
                className="flex-1 items-center rounded-lg bg-gray-200 py-3"
              >
                <Text className="text-base font-medium text-gray-700">Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReschedule}
                disabled={rescheduleLoading}
                className={`flex-1 items-center rounded-lg py-3 ${rescheduleLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
              >
                {rescheduleLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-base font-medium text-white">Reschedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        {showRescheduleDatePicker && (
          <DateTimePicker
            value={newDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowRescheduleDatePicker(false);
              if (selectedDate) {
                setNewDate(selectedDate);
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showRescheduleTimePicker && (
          <DateTimePicker
            value={newTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowRescheduleTimePicker(false);
              if (selectedTime) {
                setNewTime(selectedTime);
              }
            }}
          />
        )}
      </Modal>
    </View>
  );
}
