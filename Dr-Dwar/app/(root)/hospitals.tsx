import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getDistance } from 'geolib';

interface Hospital {
  Sr_No: number;
  Hospital_Name: string;
  Hospital_Category: string;
  Hospital_Care_Type?: string;
  State: string;
  District: string;
  Address_Original_First_Line: string;
  Telephone?: string;
  Emergency_Num?: string;
  Total_Num_Beds?: string;
  Specialties?: string;
  Location_Coordinates?: string;
  Hospital_Primary_Email_Id?: string;
}

export default function Hospitals() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filtered, setFiltered] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [radiusFilter, setRadiusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const calculateDistance = React.useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      return (
        getDistance({ latitude: lat1, longitude: lon1 }, { latitude: lat2, longitude: lon2 }) / 1000
      ); // Convert meters to kilometers
    },
    [],
  );

  const filterHospitals = React.useCallback(() => {
    let result = hospitals.filter(
      (h) =>
        h.Hospital_Name?.toLowerCase().includes(search.toLowerCase()) ||
        h.State?.toLowerCase().includes(search.toLowerCase()),
    );

    if (categoryFilter !== 'all') {
      result = result.filter((h) => h.Hospital_Category === categoryFilter);
    }

    if (radiusFilter !== 'all' && userLocation) {
      const radius = parseInt(radiusFilter);
      result = result.filter((h) => {
        if (h.Location_Coordinates) {
          const [lat, lon] = h.Location_Coordinates.split(',').map(Number);
          if (lat && lon) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              lat,
              lon,
            );
            return distance <= radius;
          }
        }
        return false;
      });
    }

    setFiltered(result);
  }, [search, hospitals, radiusFilter, categoryFilter, userLocation, calculateDistance]);

  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [search, hospitals, radiusFilter, categoryFilter, userLocation, filterHospitals]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const openDirections = (hospital: Hospital) => {
    const address = `${hospital.Hospital_Name}, ${hospital.Address_Original_First_Line}, ${hospital.District}, ${hospital.State}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

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
          Specialties TEXT,
          Location_Coordinates TEXT
        );
        INSERT INTO facilities VALUES (1, 'Test Hospital', 'Government', 'Delhi', 'Central Delhi', '123 Test Street', '011-12345678', '102', '100', 'General Medicine', '28.6139,77.2090');
      `);
      const result = await db.getAllAsync('SELECT * FROM facilities ORDER BY Hospital_Name');
      setHospitals(result as Hospital[]);
    }
    setLoading(false);
  };

  const renderHospital = ({ item }: { item: Hospital }) => {
    let distance = null;
    if (userLocation && item.Location_Coordinates) {
      const [lat, lon] = item.Location_Coordinates.split(',').map(Number);
      if (lat && lon) {
        distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
      }
    }

    return (
      <TouchableOpacity
        className="m-2 rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
        onPress={() => setSelectedHospital(item)}
      >
        <View className="mb-2 flex-row items-start justify-between">
          <Text className="flex-1 text-lg font-bold text-blue-800">
            {item.Hospital_Name || 'N/A'}
          </Text>
          {distance && <Text className="text-xs text-gray-500">{distance.toFixed(1)} km</Text>}
        </View>

        <View className="mb-3">
          <Text className="mb-1 text-sm text-gray-600">
            📍 {item.District || 'N/A'}, {item.State || 'N/A'}
          </Text>
          <Text className="text-sm text-gray-600">{item.Address_Original_First_Line || 'N/A'}</Text>
        </View>

        <View className="mb-3 flex-row flex-wrap">
          <View className="mb-1 mr-2 rounded bg-blue-50 px-2 py-1">
            <Text className="text-xs text-blue-700">{item.Hospital_Category || 'N/A'}</Text>
          </View>
          {item.Hospital_Care_Type && item.Hospital_Care_Type !== '0' && (
            <View className="mb-1 mr-2 rounded bg-green-50 px-2 py-1">
              <Text className="text-xs text-green-700">{item.Hospital_Care_Type}</Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity
            className="mr-2 flex-1 rounded bg-blue-500 px-3 py-2"
            onPress={() => setSelectedHospital(item)}
          >
            <Text className="text-center text-sm font-medium text-white">View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded bg-green-500 px-3 py-2"
            onPress={() => openDirections(item)}
          >
            <Text className="text-center text-sm font-medium text-white">Directions</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading hospitals...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 shadow-sm">
        <View className="mb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">Hospital Directory</Text>
            <Text className="text-sm text-gray-600">Found {filtered.length} hospitals</Text>
          </View>
        </View>

        <TextInput
          className="mb-3 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3"
          placeholder="Search by hospital name or state..."
          value={search}
          onChangeText={setSearch}
        />

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-600">Radius</Text>
            <TouchableOpacity
              className="rounded border border-gray-300 bg-white px-3 py-2"
              onPress={() => {
                const options = ['all', '5', '10', '25', '50'];
                const current = options.indexOf(radiusFilter);
                const next = (current + 1) % options.length;
                setRadiusFilter(options[next]);
              }}
            >
              <Text className="text-sm">
                {radiusFilter === 'all' ? 'All' : `${radiusFilter} km`}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-600">Category</Text>
            <TouchableOpacity
              className="rounded border border-gray-300 bg-white px-3 py-2"
              onPress={() => {
                const categories = [
                  'all',
                  ...new Set(hospitals.map((h) => h.Hospital_Category).filter(Boolean)),
                ];
                const current = categories.indexOf(categoryFilter);
                const next = (current + 1) % categories.length;
                setCategoryFilter(categories[next]);
              }}
            >
              <Text className="text-sm">{categoryFilter === 'all' ? 'All' : categoryFilter}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="mb-2 text-center text-xl text-gray-500">No hospitals available</Text>
          <Text className="text-center text-sm text-gray-400">
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderHospital}
          keyExtractor={(item) => item.Sr_No.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!selectedHospital} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="bg-blue-500 p-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setSelectedHospital(null)} className="mr-3">
                <Text className="text-2xl text-white">←</Text>
              </TouchableOpacity>
              <Text className="flex-1 text-xl font-bold text-white">Hospital Details</Text>
            </View>
          </View>

          {selectedHospital && (
            <ScrollView className="flex-1 p-4">
              <Text className="mb-4 text-2xl font-bold text-blue-800">
                {selectedHospital.Hospital_Name}
              </Text>

              <View className="mb-4 rounded-lg bg-gray-50 p-4">
                <Text className="mb-2 text-lg font-semibold">Contact Information</Text>
                {selectedHospital.Telephone && selectedHospital.Telephone !== '0' && (
                  <Text className="mb-1 text-gray-700">📞 Phone: {selectedHospital.Telephone}</Text>
                )}
                {selectedHospital.Emergency_Num && selectedHospital.Emergency_Num !== '0' && (
                  <Text className="mb-1 text-red-600">
                    🚨 Emergency: {selectedHospital.Emergency_Num}
                  </Text>
                )}
                {selectedHospital.Hospital_Primary_Email_Id &&
                  selectedHospital.Hospital_Primary_Email_Id !== '0' && (
                    <Text className="mb-1 text-gray-700">
                      📧 Email: {selectedHospital.Hospital_Primary_Email_Id}
                    </Text>
                  )}
              </View>

              <View className="mb-4 rounded-lg bg-gray-50 p-4">
                <Text className="mb-2 text-lg font-semibold">Hospital Information</Text>
                <Text className="mb-1 text-gray-700">
                  Category: {selectedHospital.Hospital_Category || 'N/A'}
                </Text>
                <Text className="mb-1 text-gray-700">
                  Address: {selectedHospital.Address_Original_First_Line || 'N/A'}
                </Text>
                <Text className="mb-1 text-gray-700">
                  District: {selectedHospital.District || 'N/A'}
                </Text>
                <Text className="mb-1 text-gray-700">State: {selectedHospital.State || 'N/A'}</Text>
                {selectedHospital.Total_Num_Beds && selectedHospital.Total_Num_Beds !== '0' && (
                  <Text className="mb-1 text-gray-700">
                    🛏️ Beds: {selectedHospital.Total_Num_Beds}
                  </Text>
                )}
                {selectedHospital.Specialties && selectedHospital.Specialties !== '0' && (
                  <Text className="mt-2 text-green-600">
                    🏥 Specialties: {selectedHospital.Specialties}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="rounded-lg bg-green-500 p-4"
                onPress={() => openDirections(selectedHospital)}
              >
                <Text className="text-center text-lg font-bold text-white">Get Directions</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
