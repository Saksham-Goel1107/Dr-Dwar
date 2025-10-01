import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CalendarAppointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  duration: number;
  fee: number;
  notes?: string;
}

export default function CalendarViewScreen() {
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState<Record<string, CalendarAppointment[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
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

  // Fetch appointments for current month
  const fetchAppointments = useCallback(async () => {
    if (!networkStatus || dataLoaded) return;

    setIsLoading(true);
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
        // Group appointments by date
        const appointmentsByDate: Record<string, CalendarAppointment[]> = {};
        data.data.forEach((appointment: any) => {
          const dateKey = appointment.appointmentDate;
          if (!appointmentsByDate[dateKey]) {
            appointmentsByDate[dateKey] = [];
          }
          appointmentsByDate[dateKey].push({
            id: appointment.id,
            patientName: appointment.patientName,
            patientPhone: appointment.patientPhone,
            patientEmail: appointment.patientEmail,
            time: appointment.appointmentTime,
            type: appointment.appointmentType,
            status: appointment.status,
            duration: appointment.duration,
            fee: appointment.fee,
            notes: appointment.notes,
          });
        });
        setAppointments(appointmentsByDate);
        setDataLoaded(true);
      } else {
        Alert.alert('Error', 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, networkStatus, dataLoaded]);

  useEffect(() => {
    if (networkStatus && !dataLoaded) {
      fetchAppointments();
    }
  }, [networkStatus, fetchAppointments, dataLoaded]);

  function CalendarDay({
    date,
    appointments,
    isSelected,
    onPress,
  }: {
    date: Date;
    appointments: CalendarAppointment[];
    isSelected: boolean;
    onPress: () => void;
  }) {
    const dayNumber = date.getDate();
    const hasAppointments = appointments.length > 0;

    return (
      <TouchableOpacity
        className={`m-1 h-12 w-12 items-center justify-center rounded-full ${
          isSelected ? 'bg-green-600' : hasAppointments ? 'bg-blue-100' : 'bg-transparent'
        }`}
        onPress={onPress}
      >
        <Text
          className={`text-sm font-medium ${
            isSelected ? 'text-white' : hasAppointments ? 'text-blue-600' : 'text-gray-700'
          }`}
        >
          {dayNumber}
        </Text>
        {hasAppointments && !isSelected && (
          <View className="absolute -bottom-1 h-1 w-1 rounded-full bg-blue-600" />
        )}
      </TouchableOpacity>
    );
  }

  function AppointmentItem({
    appointment,
    onPress,
  }: {
    appointment: CalendarAppointment;
    onPress: () => void;
  }) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'confirmed':
          return 'text-green-600';
        case 'pending':
          return 'text-orange-600';
        case 'cancelled':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <TouchableOpacity
        className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        onPress={onPress}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">{appointment.patientName}</Text>
            <Text className="text-sm text-gray-600">{appointment.type}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-medium text-gray-900">{appointment.time}</Text>
            <Text className={`text-xs capitalize ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        appointments: appointments[dateKey] || [],
      });
    }

    return days;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateAppointments = appointments[selectedDateKey] || [];

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
        <Text className="mt-4 text-lg font-medium text-gray-500">Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="p-6">
          <Text className="mb-6 text-2xl font-bold text-gray-900">Calendar View</Text>

          {/* Calendar Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => changeMonth('prev')}
              className="rounded-full bg-white p-2 shadow-sm"
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth('next')}
              className="rounded-full bg-white p-2 shadow-sm"
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View className="mb-2 flex-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-medium text-gray-500">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <View className="flex-row flex-wrap">
              {getDaysInMonth(currentMonth).map((dayData, index) => (
                <View key={index} className="h-12 w-12 items-center justify-center">
                  {dayData ? (
                    <CalendarDay
                      date={dayData.date}
                      appointments={dayData.appointments}
                      isSelected={dayData.date.toDateString() === selectedDate.toDateString()}
                      onPress={() => setSelectedDate(dayData.date)}
                    />
                  ) : (
                    <View className="h-12 w-12" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Selected Date Appointments */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {selectedDateAppointments.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedDateAppointments.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => {
                      setSelectedAppointment(appointment);
                      setModalVisible(true);
                    }}
                  />
                ))}
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text className="mt-2 text-gray-500">No appointments scheduled</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Appointment Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Appointment Details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="rounded-full bg-gray-100 p-2"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Patient Information */}
                <View className="mb-6 rounded-lg bg-gray-50 p-4">
                  <Text className="mb-3 text-lg font-semibold text-gray-900">
                    {selectedAppointment.patientName}
                  </Text>

                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="call-outline" size={16} color="#6B7280" />
                      <Text className="ml-2 text-sm text-gray-600">
                        {selectedAppointment.patientPhone}
                      </Text>
                    </View>

                    {selectedAppointment.patientEmail && (
                      <View className="flex-row items-center">
                        <Ionicons name="mail-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-sm text-gray-600">
                          {selectedAppointment.patientEmail}
                        </Text>
                      </View>
                    )}

                    <View className="mt-2 flex-row items-center">
                      <View
                        className={`rounded-full px-3 py-1 ${
                          selectedAppointment.status === 'confirmed'
                            ? 'bg-green-100'
                            : selectedAppointment.status === 'pending'
                              ? 'bg-yellow-100'
                              : 'bg-red-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium capitalize ${
                            selectedAppointment.status === 'confirmed'
                              ? 'text-green-700'
                              : selectedAppointment.status === 'pending'
                                ? 'text-yellow-700'
                                : 'text-red-700'
                          }`}
                        >
                          {selectedAppointment.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Appointment Details */}
                <View className="mb-6 rounded-lg bg-blue-50 p-4">
                  <Text className="mb-3 text-sm font-semibold text-gray-700">
                    Appointment Details
                  </Text>

                  <View className="space-y-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-sm text-gray-600">Time</Text>
                      </View>
                      <Text className="text-sm font-medium text-gray-900">
                        {selectedAppointment.time} ({selectedAppointment.duration} min)
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="medical-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-sm text-gray-600">Type</Text>
                      </View>
                      <Text className="text-sm font-medium capitalize text-gray-900">
                        {selectedAppointment.type.replace('_', ' ')}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="cash-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-sm text-gray-600">Fee</Text>
                      </View>
                      <Text className="text-sm font-bold text-green-600">
                        ₹{selectedAppointment.fee}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <View className="mb-6 rounded-lg bg-yellow-50 p-4">
                    <View className="mb-2 flex-row items-center">
                      <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                      <Text className="ml-2 text-sm font-semibold text-gray-700">Notes</Text>
                    </View>
                    <Text className="text-sm italic text-gray-600">
                      &ldquo;{selectedAppointment.notes}&rdquo;
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  className="mt-4 rounded-lg bg-green-600 py-3"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-center font-semibold text-white">Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
