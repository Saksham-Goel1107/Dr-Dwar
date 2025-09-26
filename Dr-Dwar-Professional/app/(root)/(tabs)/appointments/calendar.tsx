import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CalendarAppointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const mockCalendarData: Record<string, CalendarAppointment[]> = {
  '2025-09-26': [
    {
      id: '1',
      patientName: 'John Doe',
      time: '10:00 AM',
      type: 'Consultation',
      status: 'confirmed',
    },
    { id: '2', patientName: 'Jane Smith', time: '2:30 PM', type: 'Follow-up', status: 'confirmed' },
  ],
  '2025-09-27': [
    { id: '3', patientName: 'Bob Johnson', time: '11:00 AM', type: 'Check-up', status: 'pending' },
  ],
  '2025-09-28': [
    {
      id: '4',
      patientName: 'Alice Brown',
      time: '9:00 AM',
      type: 'Consultation',
      status: 'confirmed',
    },
    {
      id: '5',
      patientName: 'Charlie Wilson',
      time: '3:00 PM',
      type: 'Follow-up',
      status: 'confirmed',
    },
  ],
};

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

function AppointmentItem({ appointment }: { appointment: CalendarAppointment }) {
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
    <View className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
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
    </View>
  );
}

export default function CalendarViewScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        appointments: mockCalendarData[dateKey] || [],
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
  const selectedDateAppointments = mockCalendarData[selectedDateKey] || [];

  return (
    <View className="flex-1 bg-gray-50">
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
                <AppointmentItem key={appointment.id} appointment={appointment} />
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
    </View>
  );
}
