import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

interface AppointmentHistoryItem {
  id: string;
  patientName: string;
  appointmentType: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled' | 'no_show' | 'upcoming';
  notes?: string;
  diagnosis?: string;
}

const mockAppointmentData: AppointmentHistoryItem[] = [
  {
    id: '1',
    patientName: 'John Doe',
    appointmentType: 'General Consultation',
    date: '2025-09-26',
    time: '10:00 AM',
    status: 'completed',
    diagnosis: 'Common cold',
    notes: 'Prescribed rest and fluids',
  },
  {
    id: '2',
    patientName: 'Jane Smith',
    appointmentType: 'Follow-up',
    date: '2025-09-25',
    time: '2:30 PM',
    status: 'completed',
    diagnosis: 'Hypertension check',
    notes: 'Blood pressure stable, continue medication',
  },
  {
    id: '3',
    patientName: 'Bob Johnson',
    appointmentType: 'Consultation',
    date: '2025-09-24',
    time: '11:15 AM',
    status: 'cancelled',
    notes: 'Patient cancelled due to emergency',
  },
  {
    id: '4',
    patientName: 'Alice Brown',
    appointmentType: 'Check-up',
    date: '2025-09-28',
    time: '9:00 AM',
    status: 'upcoming',
    notes: 'Annual health check-up',
  },
];

function HistoryItem({ item }: { item: AppointmentHistoryItem }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'no_show':
        return 'text-orange-600 bg-orange-100';
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
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
      case 'no_show':
        return 'alert-circle';
      case 'upcoming':
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
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-1 text-lg font-bold text-gray-900">{item.patientName}</Text>
          <Text className="mb-2 text-sm text-gray-600">{item.appointmentType}</Text>
        </View>

        <View className={`rounded-full px-3 py-1 ${getStatusColor(item.status)}`}>
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
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

      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-600">
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-600">{item.time}</Text>
        </View>
      </View>

      {item.diagnosis && (
        <View className="mb-2">
          <Text className="text-sm font-medium text-gray-700">Diagnosis:</Text>
          <Text className="text-sm text-gray-600">{item.diagnosis}</Text>
        </View>
      )}

      {item.notes && (
        <View>
          <Text className="text-sm font-medium text-gray-700">Notes:</Text>
          <Text className="text-sm italic text-gray-600">&quot;{item.notes}&quot;</Text>
        </View>
      )}
    </View>
  );
}

export default function AppointmentHistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'no_show' | 'upcoming'>(
    'all',
  );

  const filteredData =
    filter === 'all'
      ? mockAppointmentData
      : mockAppointmentData.filter((item) => item.status === filter);

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

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-gray-900">Appointment History</Text>

        {/* Filter Buttons */}
        <View className="mb-6 flex-row">
          <FilterButton title="All" value="all" />
          <FilterButton title="Completed" value="completed" />
          <FilterButton title="Upcoming" value="upcoming" />
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
