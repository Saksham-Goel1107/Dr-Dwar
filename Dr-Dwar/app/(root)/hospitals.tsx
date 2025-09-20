import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useRouter } from 'expo-router';

type Hospital = {
  Sr_No: number;
  Hospital_Name?: string;
  Hospital_Category?: string;
  State?: string;
  District?: string;
  Address_Original_First_Line?: string;
  Telephone?: string;
  Emergency_Num?: string;
  Total_Num_Beds?: string;
  Specialties?: string;
  Hospital_Care_Type?: string;
  Number_Doctor?: number;
  Website?: string;
};

export default function Hospitals() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filtered, setFiltered] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFiltered(hospitals.filter(h =>
      h.Hospital_Name?.toLowerCase().includes(search.toLowerCase()) ||
      h.State?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, hospitals]);

  const loadData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('facilities.db', {
        useNewConnection: true,
      });
      const result = await db.getAllAsync('SELECT * FROM facilities ORDER BY Hospital_Name');
      setHospitals(result as Hospital[]);
      console.log('Loaded hospitals:', (result as Hospital[]).length);
    } catch (error) {
      console.log('Error loading database:', error);
      // Create empty database with sample data for testing
      const db = await SQLite.openDatabaseAsync('test.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS facilities (
          Sr_No INTEGER,
          Hospital_Name TEXT,
          Hospital_Category TEXT,
          State TEXT,
          District TEXT,
          Address_Original_First_Line TEXT,
          Telephone TEXT,
          Emergency_Num TEXT,
          Total_Num_Beds TEXT,
          Specialties TEXT
        );
        INSERT INTO facilities VALUES (1, 'Test Hospital', 'Government', 'Delhi', 'Central Delhi', '123 Test Street', '011-12345678', '102', '100', 'General Medicine');
      `);
      const result = await db.getAllAsync('SELECT * FROM facilities ORDER BY Hospital_Name');
      setHospitals(result as Hospital[]);
    }
  };

  const renderHospital = ({ item }: { item: Hospital }) => (
    <View className="bg-white p-4 m-2 rounded-lg shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-blue-800 mb-2">{item.Hospital_Name || 'N/A'}</Text>

      <View className="mb-3">
        <Text className="text-sm text-gray-600 mb-1">📍 {item.District || 'N/A'}, {item.State || 'N/A'}</Text>
        <Text className="text-sm text-gray-600">{item.Address_Original_First_Line || 'N/A'}</Text>
      </View>

      <View className="flex-row flex-wrap mb-2">
        <View className="bg-blue-50 px-2 py-1 rounded mr-2 mb-1">
          <Text className="text-xs text-blue-700">{item.Hospital_Category || 'N/A'}</Text>
        </View>
        {item.Hospital_Care_Type && item.Hospital_Care_Type !== '0' && (
          <View className="bg-green-50 px-2 py-1 rounded mr-2 mb-1">
            <Text className="text-xs text-green-700">{item.Hospital_Care_Type}</Text>
          </View>
        )}
      </View>

      <View className="space-y-1">
        {item.Telephone && item.Telephone !== '0' && (
          <Text className="text-sm text-gray-700">📞 {item.Telephone}</Text>
        )}
        {item.Emergency_Num && item.Emergency_Num !== '0' && (
          <Text className="text-sm text-red-600 font-medium">🚨 Emergency: {item.Emergency_Num}</Text>
        )}
        {item.Total_Num_Beds && item.Total_Num_Beds !== '0' && (
          <Text className="text-sm text-gray-700">🛏️ {item.Total_Num_Beds} beds</Text>
        )}
        {item.Number_Doctor && item.Number_Doctor !== 0 && (
          <Text className="text-sm text-gray-700">👨‍⚕️ {item.Number_Doctor} doctors</Text>
        )}
        {item.Specialties && item.Specialties !== '0' && (
          <Text className="text-sm text-green-600 mt-2">🏥 {item.Specialties}</Text>
        )}
        {item.Website && item.Website !== '0' && (
          <Text className="text-sm text-blue-600">🌐 Website available</Text>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white shadow-sm">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Hospital Directory</Text>
            <Text className="text-sm text-gray-600">Found {filtered.length} hospitals</Text>
          </View>
        </View>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          placeholder="Search by hospital name or state..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        renderItem={renderHospital}
        keyExtractor={item => item.Sr_No.toString()}
      />
    </View>
  );
}
