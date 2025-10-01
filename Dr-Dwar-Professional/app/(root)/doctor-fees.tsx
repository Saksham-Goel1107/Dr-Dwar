import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface FeeStructure {
  id?: string;
  consultationType: string;
  fee: number;
  duration: number; // in minutes
  isActive: boolean;
}

const CONSULTATION_TYPES = [
  { id: 'general', name: 'General Consultation', defaultFee: 500, duration: 30 },
  { id: 'followup', name: 'Follow-up Visit', defaultFee: 300, duration: 15 },
  { id: 'emergency', name: 'Emergency Consultation', defaultFee: 1000, duration: 60 },
  { id: 'telemedicine', name: 'Telemedicine', defaultFee: 400, duration: 20 },
  { id: 'home_visit', name: 'Home Visit', defaultFee: 800, duration: 45 },
];

export default function DoctorFeesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);

  // Refs to prevent infinite loading
  const dataLoadedRef = useRef(false);
  const prevNetworkStatusRef = useRef<boolean | null>(null);

    useEffect(() => {
    const loadVibrationSettings = async () => {
      try {
        const vib = await SecureStore.getItemAsync('VIBRATIONS');
        setVibrationsEnabled(vib !== 'false'); // Default to true
      } catch (error) {
        console.error('Error loading vibration settings:', error);
        setVibrationsEnabled(true); // Default to true on error
      }
    };

    loadVibrationSettings();
  }, []);

  const [fees, setFees] = useState<FeeStructure[]>(
    CONSULTATION_TYPES.map((type) => ({
      consultationType: type.id,
      fee: type.defaultFee,
      duration: type.duration,
      isActive: type.id === 'general', // General consultation is active by default
    })),
  );

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

  // Fetch current fees
  const fetchFees = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/appointments/fees`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = await response.json();
      if (data.success) {
        const existingFees = data.data;
        const updatedFees = CONSULTATION_TYPES.map((type) => {
          let fee = type.defaultFee;
          let isActive = type.id === 'general';

          if (existingFees) {
            switch (type.id) {
              case 'general':
                fee = existingFees.consultationFee || type.defaultFee;
                isActive = true;
                break;
              case 'followup':
                fee = existingFees.followUpFee || type.defaultFee;
                isActive =
                  existingFees.followUpFee !== null && existingFees.followUpFee !== undefined;
                break;
              case 'emergency':
                fee = existingFees.emergencyFee || type.defaultFee;
                isActive =
                  existingFees.emergencyFee !== null && existingFees.emergencyFee !== undefined;
                break;
              case 'telemedicine':
                fee = existingFees.telemedicineFee || type.defaultFee;
                isActive =
                  existingFees.telemedicineFee !== null &&
                  existingFees.telemedicineFee !== undefined;
                break;
              case 'home_visit':
                fee = existingFees.homeVisitFee || type.defaultFee;
                isActive =
                  existingFees.homeVisitFee !== null && existingFees.homeVisitFee !== undefined;
                break;
            }
          }

          return {
            consultationType: type.id,
            fee,
            duration: type.duration,
            isActive,
          };
        });
        setFees(updatedFees);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      Alert.alert('Error', 'Failed to load fee settings');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const prevStatus = prevNetworkStatusRef.current;
    prevNetworkStatusRef.current = networkStatus;

    // Only load if network just became available and we haven't loaded data yet
    if (networkStatus && !prevStatus && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      fetchFees();
    }
  }, [networkStatus, fetchFees]);

  const updateFee = (consultationType: string, field: keyof FeeStructure, value: any) => {
    setFees((prev) =>
      prev.map((fee) =>
        fee.consultationType === consultationType ? { ...fee, [field]: value } : fee,
      ),
    );
  };

  const handleSaveFees = async () => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    const activeFees = fees.filter((fee) => fee.isActive);

    if (activeFees.length === 0) {
      Alert.alert('No Services', 'Please enable at least one consultation type.');
      return;
    }

    // Validate fees
    for (const fee of activeFees) {
      if (fee.fee <= 0) {
        Alert.alert(
          'Invalid Fee',
          `Fee must be greater than 0 for ${CONSULTATION_TYPES.find((t) => t.id === fee.consultationType)?.name}.`,
        );
        return;
      }
      if (fee.duration <= 0) {
        Alert.alert(
          'Invalid Duration',
          `Duration must be greater than 0 for ${CONSULTATION_TYPES.find((t) => t.id === fee.consultationType)?.name}.`,
        );
        return;
      }
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/appointments/fees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          consultationFee: activeFees.find((f) => f.consultationType === 'general')?.fee || 500,
          followUpFee: activeFees.find((f) => f.consultationType === 'followup')?.fee || 300,
          emergencyFee: activeFees.find((f) => f.consultationType === 'emergency')?.fee || 1000,
          telemedicineFee:
            activeFees.find((f) => f.consultationType === 'telemedicine')?.fee || 400,
          homeVisitFee: activeFees.find((f) => f.consultationType === 'home_visit')?.fee || 800,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Fee settings saved successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Save Failed', data.message || 'Failed to save fee settings');
      }
    } catch (error) {
      console.error('Error saving fees:', error);
      Alert.alert('Error', 'Failed to save fee settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!networkStatus) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="wifi-off" size={48} color="#6b7280" />
        <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          No Internet Connection
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ fontSize: 16, color: '#64748b', marginTop: 16 }}>
          Loading fee settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#16a34a',
          paddingTop: 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 45,
            left: 20,
            zIndex: 1,
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
          }}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
            Set Consultation Fees
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            Configure your fees and consultation durations
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 20, textAlign: 'center' }}>
            Set your consultation fees and durations. Patients will see these prices when booking
            appointments.
          </Text>

          {CONSULTATION_TYPES.map((type) => {
            const fee = fees.find((f) => f.consultationType === type.id);
            if (!fee) return null;

            return (
              <View
                key={type.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                    {type.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateFee(type.id, 'isActive', !fee.isActive)}
                    style={{
                      padding: 8,
                      backgroundColor: fee.isActive ? '#dcfce7' : '#f3f4f6',
                      borderRadius: 20,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={fee.isActive ? 'check-circle' : 'circle-outline'}
                      size={20}
                      color={fee.isActive ? '#16a34a' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                </View>

                {fee.isActive && (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Text
                        style={{ fontSize: 16, color: '#374151', marginRight: 12, minWidth: 60 }}
                      >
                        Fee:
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 16, color: '#6b7280', marginRight: 8 }}>₹</Text>
                        <TextInput
                          value={fee.fee.toString()}
                          onChangeText={(text) => {
                            const numValue = parseInt(text) || 0;
                            updateFee(type.id, 'fee', numValue);
                          }}
                          keyboardType="numeric"
                          style={{
                            flex: 1,
                            padding: 12,
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            fontSize: 16,
                            color: '#1e293b',
                          }}
                          placeholder="Enter fee"
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text
                        style={{ fontSize: 16, color: '#374151', marginRight: 12, minWidth: 60 }}
                      >
                        Duration:
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TextInput
                          value={fee.duration.toString()}
                          onChangeText={(text) => {
                            const numValue = parseInt(text) || 0;
                            updateFee(type.id, 'duration', numValue);
                          }}
                          keyboardType="numeric"
                          style={{
                            flex: 1,
                            padding: 12,
                            backgroundColor: '#f9fafb',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#e5e7eb',
                            fontSize: 16,
                            color: '#1e293b',
                          }}
                          placeholder="Minutes"
                        />
                        <Text style={{ fontSize: 16, color: '#6b7280', marginLeft: 8 }}>min</Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                      Default: ₹{type.defaultFee} for {type.duration} minutes
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleSaveFees}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? '#94a3b8' : '#16a34a',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>
                Save Fee Settings
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
