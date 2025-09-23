import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pharmacy, pharmacyDB } from '../../utils/load-pharmacy-db';

export default function PharmacyScreen() {
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const filterPharmacies = useCallback(() => {
    let result = pharmacies.filter(
      (pharmacy) =>
        pharmacy.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy.Address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy['State Name']?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pharmacy['District Name']?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (selectedState) {
      result = result.filter((pharmacy) => pharmacy['State Name'] === selectedState);
    }

    if (selectedDistrict) {
      result = result.filter((pharmacy) => pharmacy['District Name'] === selectedDistrict);
    }

    setFilteredPharmacies(result);
  }, [searchQuery, pharmacies, selectedState, selectedDistrict]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    if (dbInitialized) {
      loadAllPharmacies();
    }
  }, [dbInitialized]);

  useEffect(() => {
    filterPharmacies();
  }, [filterPharmacies]);

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      console.log('Initializing pharmacy database...');
      await pharmacyDB.initializeDatabase();
      setDbInitialized(true);
      console.log('Pharmacy database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize pharmacy database:', error);
      Alert.alert('Database Error', 'Failed to initialize pharmacy database. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPharmacies = async () => {
    try {
      setLoading(true);
      const allPharmacies = await pharmacyDB.getAllPharmacies();
      setPharmacies(allPharmacies);

      const uniqueStates = [...new Set(allPharmacies.map((p) => p['State Name']))].filter(
        (s): s is string => typeof s === 'string',
      );
      const uniqueDistricts = [...new Set(allPharmacies.map((p) => p['District Name']))].filter(
        (d): d is string => typeof d === 'string',
      );
      setStates(uniqueStates.sort());
      setDistricts(uniqueDistricts.sort());

      console.log(`Loaded ${allPharmacies.length} pharmacies`);
    } catch (error) {
      console.error('Failed to load pharmacies:', error);
      Alert.alert('Load Error', 'Failed to load pharmacy data. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: number) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening phone app:', err));
  };

  const handleOpenMaps = (address: string, name: string) => {
    const query = encodeURIComponent(`${name}, ${address}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          Alert.alert('Error', 'Maps app is not available');
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${type} copied to clipboard`);
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity style={styles.pharmacyItem} onPress={() => setSelectedPharmacy(item)}>
      <View style={styles.pharmacyContent}>
        <Text style={styles.pharmacyName} numberOfLines={2}>
          {item.Name || 'N/A'}
        </Text>
        <Text style={styles.pharmacyAddress} numberOfLines={2}>
          {item.Address || 'N/A'}
        </Text>
        <View style={styles.pharmacyDetails}>
          <Text style={styles.pharmacyLocation}>
            {item['District Name'] || 'N/A'}, {item['State Name'] || 'N/A'}
          </Text>
          <View style={styles.actionButtons}>
            {item.Contact && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(item.Contact!)}
              >
                <Ionicons name="call" size={16} color="#007AFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenMaps(item.Address || '', item.Name || '')}
            >
              <Ionicons name="location" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No pharmacies found' : 'No pharmacies available'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Try adjusting your search terms' : 'Please check back later'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading pharmacies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pharmacy Directory</Text>
          <Text style={styles.headerSubtitle}>Found {filteredPharmacies.length} pharmacies</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
        >
          <Ionicons name="filter" size={24} color={showFilters ? '#FFF' : '#007AFF'} />
          {(selectedState || selectedDistrict) && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search pharmacies, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Ionicons name="location-outline" size={16} color="#007AFF" />
              <Text style={styles.filterLabel}>States</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[styles.filterChip, selectedState === '' && styles.filterChipActive]}
                onPress={() => setSelectedState('')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedState === '' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
                {selectedState === '' && (
                  <Ionicons name="checkmark" size={14} color="#FFF" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
              {states.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[styles.filterChip, selectedState === state && styles.filterChipActive]}
                  onPress={() => setSelectedState(state)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedState === state && styles.filterChipTextActive,
                    ]}
                  >
                    {state}
                  </Text>
                  {selectedState === state && (
                    <Ionicons name="checkmark" size={14} color="#FFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Ionicons name="business-outline" size={16} color="#007AFF" />
              <Text style={styles.filterLabel}>Districts</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[styles.filterChip, selectedDistrict === '' && styles.filterChipActive]}
                onPress={() => setSelectedDistrict('')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDistrict === '' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
                {selectedDistrict === '' && (
                  <Ionicons name="checkmark" size={14} color="#FFF" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
              {districts.map((district) => (
                <TouchableOpacity
                  key={district}
                  style={[
                    styles.filterChip,
                    selectedDistrict === district && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedDistrict(district)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDistrict === district && styles.filterChipTextActive,
                    ]}
                  >
                    {district}
                  </Text>
                  {selectedDistrict === district && (
                    <Ionicons name="checkmark" size={14} color="#FFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {(selectedState || selectedDistrict) && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedState('');
                setSelectedDistrict('');
              }}
            >
              <Ionicons name="close-circle" size={16} color="#FF3B30" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filteredPharmacies}
        renderItem={renderPharmacyItem}
        keyExtractor={(item, index) => item['Sr.No']?.toString() || index.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredPharmacies.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selectedPharmacy} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedPharmacy(null)}
              style={styles.modalBackButton}
            >
              <Text style={styles.modalBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pharmacy Details</Text>
          </View>

          {selectedPharmacy && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.pharmacyDetailName}>{selectedPharmacy.Name}</Text>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Contact Information</Text>
                {selectedPharmacy.Contact && (
                  <View style={styles.contactItem}>
                    <Text style={styles.detailText}>📞 Phone: {selectedPharmacy.Contact}</Text>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() =>
                          copyToClipboard(selectedPharmacy.Contact!.toString(), 'Phone number')
                        }
                      >
                        <Ionicons name="copy" size={14} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(selectedPharmacy.Contact!)}
                      >
                        <Ionicons name="call" size={14} color="#FFF" />
                        <Text style={styles.callButtonText}>Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View style={styles.contactItem}>
                  <Text style={styles.detailText}>
                    📍 Address: {selectedPharmacy.Address || 'N/A'}
                  </Text>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(selectedPharmacy.Address || '', 'Address')}
                    >
                      <Ionicons name="copy" size={14} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.mapsButton}
                      onPress={() =>
                        handleOpenMaps(selectedPharmacy.Address || '', selectedPharmacy.Name || '')
                      }
                    >
                      <Ionicons name="location" size={14} color="#FFF" />
                      <Text style={styles.mapsButtonText}>Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Location Information</Text>
                <Text style={styles.detailText}>
                  State: {selectedPharmacy['State Name'] || 'N/A'}
                </Text>
                <Text style={styles.detailText}>
                  District: {selectedPharmacy['District Name'] || 'N/A'}
                </Text>
                {selectedPharmacy['Pin Code'] && (
                  <Text style={styles.detailText}>📮 Pin Code: {selectedPharmacy['Pin Code']}</Text>
                )}
                {selectedPharmacy['Kendra Code'] && (
                  <Text style={styles.detailText}>
                    🏢 Kendra Code: {selectedPharmacy['Kendra Code']}
                  </Text>
                )}
              </View>
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
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  pharmacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  pharmacyContent: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 22,
    fontWeight: '400',
  },
  pharmacyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacyLocation: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  pharmacyContact: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  pharmacyDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  detailSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  filtersContainer: {
    backgroundColor: 'linear-gradient(135deg, #F8F9FA 0%, #E3F2FD 100%)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  filterScrollContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#E8F4FD',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  checkIcon: {
    marginLeft: 6,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF3B30',
    marginTop: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactItem: {
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  copyButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mapsButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
