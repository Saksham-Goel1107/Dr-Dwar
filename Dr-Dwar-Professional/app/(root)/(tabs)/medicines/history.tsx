import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface MedicineHistoryItem {
  id: string;
  medicineName: string;
  action: 'added' | 'dispensed' | 'expired' | 'low_stock';
  quantity: number;
  date: string;
  batchNumber?: string;
  patientName?: string;
  notes?: string;
}

const mockHistoryData: MedicineHistoryItem[] = [
  {
    id: '1',
    medicineName: 'Paracetamol 500mg',
    action: 'dispensed',
    quantity: 10,
    date: '2025-09-26',
    batchNumber: 'BATCH001',
    patientName: 'John Doe',
    notes: 'Fever medication',
  },
  {
    id: '2',
    medicineName: 'Amoxicillin 250mg',
    action: 'added',
    quantity: 50,
    date: '2025-09-25',
    batchNumber: 'BATCH002',
    notes: 'New stock arrival',
  },
  {
    id: '3',
    medicineName: 'Ibuprofen 200mg',
    action: 'low_stock',
    quantity: 5,
    date: '2025-09-24',
    batchNumber: 'BATCH003',
    notes: 'Only 5 tablets remaining',
  },
  {
    id: '4',
    medicineName: 'Aspirin 75mg',
    action: 'expired',
    quantity: 20,
    date: '2025-09-23',
    batchNumber: 'BATCH004',
    notes: 'Batch expired, removed from inventory',
  },
];

function HistoryItem({ item }: { item: MedicineHistoryItem }) {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'added':
        return 'text-green-600';
      case 'dispensed':
        return 'text-blue-600';
      case 'expired':
        return 'text-red-600';
      case 'low_stock':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added':
        return 'add-circle';
      case 'dispensed':
        return 'remove-circle';
      case 'expired':
        return 'alert-circle';
      case 'low_stock':
        return 'warning';
      default:
        return 'ellipse';
    }
  };

  const formatAction = (action: string) => {
    return action.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Ionicons
              name={getActionIcon(item.action) as any}
              size={20}
              color={getActionColor(item.action).replace('text-', '').replace('-600', '')}
              className="mr-2"
            />
            <Text className={`font-semibold ${getActionColor(item.action)}`}>
              {formatAction(item.action)}
            </Text>
          </View>

          <Text className="mb-1 text-lg font-bold text-gray-900">{item.medicineName}</Text>

          <View className="mb-2 flex-row items-center">
            <Text className="mr-4 text-sm text-gray-600">Quantity: {item.quantity}</Text>
            {item.batchNumber && (
              <Text className="text-sm text-gray-600">Batch: {item.batchNumber}</Text>
            )}
          </View>

          {item.patientName && (
            <Text className="mb-2 text-sm text-gray-600">Patient: {item.patientName}</Text>
          )}

          {item.notes && (
            <Text className="text-sm italic text-gray-500">&quot;{item.notes}&quot;</Text>
          )}
        </View>

        <Text className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

export default function MedicineHistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'added' | 'dispensed' | 'expired' | 'low_stock'>(
    'all',
  );

  const filteredData =
    filter === 'all' ? mockHistoryData : mockHistoryData.filter((item) => item.action === filter);

  const FilterButton = ({ title, value }: { title: string; value: typeof filter }) => (
    <TouchableOpacity
      className={`mr-3 rounded-full px-4 py-2 ${filter === value ? 'bg-blue-600' : 'bg-gray-200'}`}
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
        <Text className="mb-6 text-2xl font-bold text-gray-900">Medicine History</Text>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row">
            <FilterButton title="All" value="all" />
            <FilterButton title="Added" value="added" />
            <FilterButton title="Dispensed" value="dispensed" />
            <FilterButton title="Expired" value="expired" />
            <FilterButton title="Low Stock" value="low_stock" />
          </View>
        </ScrollView>

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
            <Text className="mt-4 text-lg font-medium text-gray-500">No history found</Text>
            <Text className="mt-2 text-center text-sm text-gray-400">
              {filter === 'all'
                ? 'No medicine history available yet.'
                : `No ${filter.replace('_', ' ')} records found.`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
