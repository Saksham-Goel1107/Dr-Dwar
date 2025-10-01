import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30',
];

export default function DoctorAvailabilityScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled] = useState(true);

  // Time picker modal state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDayForTime, setSelectedDayForTime] = useState<number | null>(null);
  const [selectedTimeField, setSelectedTimeField] = useState<'startTime' | 'endTime' | null>(null);

  // Ref to track if data has been loaded
  const dataLoadedRef = useRef(false);

  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DAYS_OF_WEEK.map((day) => ({
      dayOfWeek: day.id,
      startTime: '09:00',
      endTime: '17:00',
      isActive: false,
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

  // Fetch current availability
  const fetchAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/availability`,
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
        const existingAvailability = data.data || [];
        const updatedAvailability = DAYS_OF_WEEK.map((day) => {
          const existing = existingAvailability.find(
            (slot: AvailabilitySlot) => slot.dayOfWeek === day.id,
          );
          return existing
            ? { ...existing, isActive: true }
            : {
                dayOfWeek: day.id,
                startTime: '09:00',
                endTime: '17:00',
                isActive: false,
              };
        });
        setAvailability(updatedAvailability);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      Alert.alert('Error', 'Failed to load availability settings');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Track previous network status to detect changes
  const prevNetworkStatusRef = useRef<boolean | null>(null);

  // Load data when network becomes available (only once)
  useEffect(() => {
    const prevStatus = prevNetworkStatusRef.current;
    prevNetworkStatusRef.current = networkStatus;

    // Only load if network just became available and we haven't loaded data yet
    if (networkStatus && !prevStatus && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      fetchAvailability();
    }
  }, [networkStatus, fetchAvailability]);

  const updateAvailability = (dayOfWeek: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailability((prev) =>
      prev.map((slot) => (slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot)),
    );
  };

  const handleSaveAvailability = async () => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    const activeSlots = availability.filter((slot) => slot.isActive);

    if (activeSlots.length === 0) {
      Alert.alert('No Availability', 'Please enable at least one day for appointments.');
      return;
    }

    // Validate time slots
    for (const slot of activeSlots) {
      if (slot.startTime >= slot.endTime) {
        Alert.alert(
          'Invalid Time',
          `End time must be after start time for ${DAYS_OF_WEEK[slot.dayOfWeek].name}.`,
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
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/availability`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            availability: activeSlots.map((slot) => ({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Availability settings saved successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Save Failed', data.message || 'Failed to save availability settings');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTimePicker = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime',
    currentValue: string,
  ) => {
    const currentSlot = availability.find((slot) => slot.dayOfWeek === dayOfWeek);
    if (!currentSlot?.isActive) return null;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedDayForTime(dayOfWeek);
          setSelectedTimeField(field);
          setShowTimePicker(true);
        }}
        style={{
          flex: 1,
          padding: 12,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          marginHorizontal: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={16}
          color="#6b7280"
          style={{ marginRight: 6 }}
        />
        <Text style={{ fontSize: 16, color: '#1e293b' }}>{currentValue}</Text>
      </TouchableOpacity>
    );
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDayForTime !== null && selectedTimeField) {
      const currentSlot = availability.find((slot) => slot.dayOfWeek === selectedDayForTime);
      if (currentSlot) {
        let newStartTime = currentSlot.startTime;
        let newEndTime = currentSlot.endTime;

        if (selectedTimeField === 'startTime') {
          newStartTime = time;
          // Validate that start time is before end time
          if (time >= currentSlot.endTime) {
            Alert.alert('Invalid Time', 'Start time must be before end time.');
            return;
          }
        } else {
          newEndTime = time;
          // Validate that end time is after start time
          if (time <= currentSlot.startTime) {
            Alert.alert('Invalid Time', 'End time must be after start time.');
            return;
          }
        }

        updateAvailability(selectedDayForTime, 'startTime', newStartTime);
        updateAvailability(selectedDayForTime, 'endTime', newEndTime);
      }
    }
    setShowTimePicker(false);
    setSelectedDayForTime(null);
    setSelectedTimeField(null);
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
          Loading availability...
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
            Set Availability
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            Configure your working hours for appointments
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
            Enable days and set your working hours. Patients can only book appointments during your
            available times.
          </Text>

          {/* Weekly Overview */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 }}>
              Weekly Overview
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {DAYS_OF_WEEK.map((day) => {
                const slot = availability.find((s) => s.dayOfWeek === day.id);
                const isActive = slot?.isActive || false;
                return (
                  <View
                    key={day.id}
                    style={{
                      alignItems: 'center',
                      padding: 8,
                      backgroundColor: isActive ? '#dcfce7' : '#f3f4f6',
                      borderRadius: 8,
                      minWidth: 45,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isActive ? '#166534' : '#6b7280',
                        marginBottom: 4,
                      }}
                    >
                      {day.short}
                    </Text>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isActive ? '#16a34a' : '#d1d5db',
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {DAYS_OF_WEEK.map((day) => {
            const slot = availability.find((s) => s.dayOfWeek === day.id);
            if (!slot) return null;

            return (
              <View
                key={day.id}
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
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b' }}>
                    {day.name}
                  </Text>
                  <Switch
                    value={slot.isActive}
                    onValueChange={(value) => updateAvailability(day.id, 'isActive', value)}
                    trackColor={{ false: '#d1d5db', true: '#86efac' }}
                    thumbColor={slot.isActive ? '#16a34a' : '#f3f4f6'}
                  />
                </View>

                {slot.isActive && (
                  <View>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                      Working Hours
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#374151', marginRight: 8 }}>From:</Text>
                      {renderTimePicker(day.id, 'startTime', slot.startTime)}
                      <Text style={{ fontSize: 14, color: '#374151', marginHorizontal: 8 }}>
                        To:
                      </Text>
                      {renderTimePicker(day.id, 'endTime', slot.endTime)}
                    </View>

                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                      Appointments will be available in 30-minute slots during this time.
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
            onPress={handleSaveAvailability}
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
                Save Availability
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>
                Select {selectedTimeField === 'startTime' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                style={{
                  padding: 8,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 20,
                }}
              >
                <MaterialCommunityIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleTimeSelect(item)}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e7eb',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#1e293b',
                      textAlign: 'center',
                      fontWeight: '500',
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
