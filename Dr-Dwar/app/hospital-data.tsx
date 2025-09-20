import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';

interface Hospital {
  Sr_No: number;
  Hospital_Name: string;
  Hospital_Category: string;
  State: string;
  District: string;
  Address_Original_First_Line: string;
  Telephone: string;
  Mobile_Number: string;
  Emergency_Num: string;
  Hospital_Primary_Email_Id: string;
  Website: string;
  Specialties: string;
  Total_Num_Beds: string;
  Emergency_Services: string;
}

export default function HospitalDataScreen() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitalData();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [searchQuery, hospitals]);

  const loadHospitalData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('facilities.db', {
        useNewConnection: true,
      });
      
      const result = await db.getAllAsync(`
        SELECT 
          Sr_No,
          Hospital_Name,
          Hospital_Category,
          State,
          District,
          Address_Original_First_Line,
          Telephone,
          Mobile_Number,
          Emergency_Num,
          Hospital_Primary_Email_Id,
          Website,
          Specialties,
          Total_Num_Beds,
          Emergency_Services
        FROM facilities 
        ORDER BY Hospital_Name
      `);
      
      setHospitals(result as Hospital[]);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load hospital data');
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    if (!searchQuery.trim()) {
      setFilteredHospitals(hospitals);
      return;
    }

    const filtered = hospitals.filter(hospital =>
      hospital.Hospital_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.State?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.District?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.Hospital_Category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHospitals(filtered);
  };

  const renderHospital = ({ item }: { item: Hospital }) => (
    <View className="bg-white p-4 m-2 rounded-lg shadow-sm border border-gray-200">
      <Text className="text-lg font-bold text-gray-800 mb-2">{item.Hospital_Name}</Text>
      <Text className="text-sm text-gray-600 mb-1">Category: {item.Hospital_Category}</Text>
      <Text className="text-sm text-gray-600 mb-1">Location: {item.District}, {item.State}</Text>
      <Text className="text-sm text-gray-600 mb-1">Address: {item.Address_Original_First_Line}</Text>
      {item.Telephone && <Text className="text-sm text-blue-600 mb-1">Phone: {item.Telephone}</Text>}
      {item.Emergency_Num && <Text className="text-sm text-red-600 mb-1">Emergency: {item.Emergency_Num}</Text>}
      {item.Total_Num_Beds && <Text className="text-sm text-gray-600 mb-1">Beds: {item.Total_Num_Beds}</Text>}
      {item.Specialties && <Text className="text-sm text-green-600">Specialties: {item.Specialties}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg">Loading hospital data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Hospital Directory</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
          placeholder="Search hospitals, states, districts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text className="text-sm text-gray-600 mt-2">
          Showing {filteredHospitals.length} of {hospitals.length} hospitals
        </Text>
      </View>
      
      <FlatList
        data={filteredHospitals}
        renderItem={renderHospital}
        keyExtractor={(item) => item.Sr_No.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}