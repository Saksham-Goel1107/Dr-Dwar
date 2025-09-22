import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getDistance } from 'geolib';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hospital, hospitalDB } from '../../utils/load-db';

export default function HospitalsScreen() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [radiusFilter, setRadiusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      return (
        getDistance({ latitude: lat1, longitude: lon1 }, { latitude: lat2, longitude: lon2 }) / 1000
      );
    },
    [],
  );

  const filterHospitals = useCallback(() => {
    let result = hospitals.filter(
      (h) =>
        h.Hospital_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.State?.toLowerCase().includes(searchQuery.toLowerCase()),
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

    setFilteredHospitals(result);
  }, [searchQuery, hospitals, radiusFilter, categoryFilter, userLocation, calculateDistance]);

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      await hospitalDB.initializeDatabase();
      setDbInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Database Error', 'Failed to initialize hospital database. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllHospitals = async () => {
    try {
      setLoading(true);
      const allHospitals = await hospitalDB.getAllHospitals();
      setHospitals(allHospitals);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
      Alert.alert('Load Error', 'Failed to load hospital data. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location.coords);
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to use distance-based filtering and directions.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your location settings.',
        [{ text: 'OK' }],
      );
    }
  };

  const openDirections = async (hospital: Hospital) => {

    if (!hospital.Location_Coordinates) {
      Alert.alert('Error', 'Location coordinates not available for this hospital');
      return;
    }

    // Parse coordinates from Location_Coordinates (assuming format like "lat,lng")
    const coords = hospital.Location_Coordinates.split(',');
    if (coords.length !== 2) {
      Alert.alert('Error', 'Invalid location coordinates format');
      return;
    }

    const latitude = parseFloat(coords[0].trim());
    const longitude = parseFloat(coords[1].trim());


    if (isNaN(latitude) || isNaN(longitude)) {
      Alert.alert('Error', 'Invalid latitude or longitude values');
      return;
    }

    // Try to get current location for directions
    let origin = '';
    if (userLocation) {
      origin = `${userLocation.latitude},${userLocation.longitude}`;
    }

    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${latitude},${longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open maps application');
    }
  };

  useEffect(() => {
    initializeDatabase();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (dbInitialized) {
      loadAllHospitals();
    }
  }, [dbInitialized]);

  useEffect(() => {
    filterHospitals();
  }, [filterHospitals]);

  const renderHospitalItem = ({ item }: { item: Hospital }) => (
    <TouchableOpacity style={styles.hospitalItem} onPress={() => setSelectedHospital(item)}>
      <View style={styles.hospitalContent}>
        <View style={styles.hospitalHeader}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {item.Hospital_Name || 'N/A'}
          </Text>
          {userLocation &&
            item.Location_Coordinates &&
            (() => {
              const [lat, lon] = item.Location_Coordinates.split(',').map(Number);
              if (lat && lon) {
                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  lat,
                  lon,
                );
                return <Text style={styles.distanceText}>{distance.toFixed(1)} km</Text>;
              }
              return null;
            })()}
        </View>

        <View style={styles.hospitalLocation}>
          <Text style={styles.locationText}>
            📍 {item.District || 'N/A'}, {item.State || 'N/A'}
          </Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {item.Address_Original_First_Line || 'N/A'}
          </Text>
        </View>

        <View style={styles.hospitalTags}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.Hospital_Category || 'N/A'}</Text>
          </View>
          {item.Hospital_Care_Type && item.Hospital_Care_Type !== '0' && (
            <View style={styles.careTypeTag}>
              <Text style={styles.careTypeText}>{item.Hospital_Care_Type}</Text>
            </View>
          )}
        </View>

        <View style={styles.hospitalActions}>
          <TouchableOpacity style={styles.detailsButton} onPress={() => setSelectedHospital(item)}>
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(item)}>
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medical" size={64} color="#CCC" />
      <Text style={styles.emptyStateText}>
        {loading ? 'Loading hospitals...' : 'No hospitals found'}
      </Text>
      {searchQuery && !loading && (
        <Text style={styles.emptyStateSubtext}>Try adjusting your search query</Text>
      )}
    </View>
  );

  if (loading && !dbInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing hospital database...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hospital Directory</Text>
          <Text style={styles.headerSubtitle}>Found {filteredHospitals.length} hospitals</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Radius</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                const options = ['all', '5', '10', '25', '50'];
                const current = options.indexOf(radiusFilter);
                const next = (current + 1) % options.length;
                setRadiusFilter(options[next]);
              }}
            >
              <Text style={styles.filterButtonText}>
                {radiusFilter === 'all' ? 'All' : `${radiusFilter} km`}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Category</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                const categories = [
                  'all',
                  ...new Set(
                    hospitals
                      .map((h) => h.Hospital_Category)
                      .filter((cat): cat is string => cat != null),
                  ),
                ];
                const current = categories.indexOf(categoryFilter);
                const next = (current + 1) % categories.length;
                setCategoryFilter(categories[next]);
              }}
            >
              <Text style={styles.filterButtonText}>
                {categoryFilter === 'all' ? 'All' : categoryFilter}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals by name or state..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredHospitals}
        renderItem={renderHospitalItem}
        keyExtractor={(item, index) => item.Sr_No?.toString() || index.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredHospitals.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedHospital} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedHospital(null)}
              style={styles.modalBackButton}
            >
              <Text style={styles.modalBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hospital Details</Text>
          </View>

          {selectedHospital && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.hospitalDetailName}>{selectedHospital.Hospital_Name}</Text>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Contact Information</Text>
                {selectedHospital.Telephone && selectedHospital.Telephone !== '0' && (
                  <Text style={styles.detailText}>📞 Phone: {selectedHospital.Telephone}</Text>
                )}
                {selectedHospital.Emergency_Num && selectedHospital.Emergency_Num !== '0' && (
                  <Text style={styles.emergencyText}>
                    🚨 Emergency: {selectedHospital.Emergency_Num}
                  </Text>
                )}
                {selectedHospital.Hospital_Primary_Email_Id &&
                  selectedHospital.Hospital_Primary_Email_Id !== '0' && (
                    <Text style={styles.detailText}>
                      📧 Email: {selectedHospital.Hospital_Primary_Email_Id}
                    </Text>
                  )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Hospital Information</Text>
                <Text style={styles.detailText}>
                  Category: {selectedHospital.Hospital_Category || 'N/A'}
                </Text>
                <Text style={styles.detailText}>
                  Address: {selectedHospital.Address_Original_First_Line || 'N/A'}
                </Text>
                <Text style={styles.detailText}>
                  District: {selectedHospital.District || 'N/A'}
                </Text>
                <Text style={styles.detailText}>State: {selectedHospital.State || 'N/A'}</Text>
                {selectedHospital.Total_Num_Beds && selectedHospital.Total_Num_Beds !== '0' && (
                  <Text style={styles.detailText}>🛏️ Beds: {selectedHospital.Total_Num_Beds}</Text>
                )}
                {selectedHospital.Specialties && selectedHospital.Specialties !== '0' && (
                  <Text style={styles.specialtiesText}>
                    🏥 Specialties: {selectedHospital.Specialties}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.directionsModalButton}
                onPress={() => openDirections(selectedHospital)}
              >
                <Text style={styles.directionsModalButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hospitalContent: {
    flex: 1,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
    lineHeight: 20,
  },
  hospitalCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 36,
    marginTop: 4,
  },
  hospitalPhone: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  hospitalLocation: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  hospitalTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  careTypeTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  careTypeText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '500',
  },
  hospitalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  detailsButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  directionsButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginRight: 12,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  modalBackButton: {
    marginRight: 16,
    padding: 8,
  },
  modalBackText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  hospitalDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  emergencyText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 8,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  specialtiesText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  directionsModalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  directionsModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
