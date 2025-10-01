import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  fees: {
    consultationFee: number;
    followUpFee: number;
    emergencyFee: number;
    telemedicineFee: number;
  };
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled] = useState(true); // For now, enable vibrations

  // If no doctorId is provided, redirect to appointments screen
  useEffect(() => {
    if (!doctorId && !isLoading) {
      router.back();
      return;
    }
  }, [doctorId, isLoading, router]);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<
    'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'TELEMEDICINE'
  >('CONSULTATION');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

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

  // Fetch doctor details
  const fetchDoctorDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctors/${doctorId}`,
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
        setDoctor(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load doctor details');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      Alert.alert('Error', 'Failed to load doctor details. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, getToken, router]);

  useEffect(() => {
    if (networkStatus && doctorId) {
      fetchDoctorDetails();
    }
  }, [networkStatus, doctorId, fetchDoctorDetails]);

  // Generate available time slots for selected date
  const generateTimeSlots = (date: Date) => {
    if (!doctor) return [];

    const dayOfWeek = date.getDay();
    const dayAvailability = doctor.availability.find((slot) => slot.dayOfWeek === dayOfWeek);

    if (!dayAvailability) return [];

    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = dayAvailability.startTime.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push({
        time: timeString,
        available: true, // In a real app, you'd check against existing appointments
      });

      currentMinute += 30; // 30-minute slots
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    return slots;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    const slots = generateTimeSlots(date);
    setAvailableSlots(slots);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const getAppointmentFee = () => {
    if (!doctor) return 0;

    switch (appointmentType) {
      case 'FOLLOW_UP':
        return doctor.fees.followUpFee;
      case 'EMERGENCY':
        return doctor.fees.emergencyFee;
      case 'TELEMEDICINE':
        return doctor.fees.telemedicineFee;
      default:
        return doctor.fees.consultationFee;
    }
  };

  const handleBookAppointment = async () => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time for your appointment.');
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert('Missing Information', 'Please describe your symptoms.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const fee = getAppointmentFee();

    Alert.alert(
      'Confirm Booking',
      `Book appointment with Dr. ${doctor?.name} on ${selectedDate.toDateString()} at ${selectedTime}?\n\nFee: ₹${fee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: async () => {
            setIsBooking(true);

            try {
              const token = await getToken();
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/book`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                  },
                  body: JSON.stringify({
                    professionalId: doctorId,
                    appointmentType,
                    scheduledDate: selectedDate.toISOString().split('T')[0],
                    startTime: selectedTime,
                    symptoms: symptoms.trim(),
                    notes: notes.trim(),
                  }),
                },
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Appointment booked successfully!', [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert('Booking Failed', data.message || 'Failed to book appointment');
              }
            } catch (error) {
              console.error('Error booking appointment:', error);
              Alert.alert('Error', 'Failed to book appointment. Please try again.');
            } finally {
              setIsBooking(false);
            }
          },
        },
      ],
    );
  };

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
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
          Loading doctor details...
        </Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="medical-bag" size={48} color="#d1d5db" />
        <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          Doctor not found
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
            Book Appointment
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>Dr. {doctor.name}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            {doctor.specialization}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Appointment Type */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>
            Appointment Type
          </Text>

          <View style={{ gap: 12 }}>
            {[
              {
                type: 'CONSULTATION',
                label: 'Initial Consultation',
                fee: doctor.fees.consultationFee,
              },
              { type: 'FOLLOW_UP', label: 'Follow-up Visit', fee: doctor.fees.followUpFee },
              { type: 'EMERGENCY', label: 'Emergency', fee: doctor.fees.emergencyFee },
              { type: 'TELEMEDICINE', label: 'Telemedicine', fee: doctor.fees.telemedicineFee },
            ].map((option) => (
              <TouchableOpacity
                key={option.type}
                onPress={() => setAppointmentType(option.type as any)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: appointmentType === option.type ? '#dcfce7' : '#ffffff',
                  borderRadius: 12,
                  borderWidth: appointmentType === option.type ? 2 : 1,
                  borderColor: appointmentType === option.type ? '#16a34a' : '#e5e7eb',
                }}
              >
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                    {option.label}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                    ₹{option.fee}
                  </Text>
                </View>
                {appointmentType === option.type && (
                  <MaterialCommunityIcons name="check-circle" size={24} color="#16a34a" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>
            Select Date
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {getNext7Days().map((date, index) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = date.getDate();

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleDateSelect(date)}
                    style={{
                      alignItems: 'center',
                      padding: 16,
                      backgroundColor: isSelected ? '#16a34a' : '#ffffff',
                      borderRadius: 12,
                      minWidth: 70,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: isSelected ? '#ffffff' : '#64748b',
                        marginBottom: 4,
                      }}
                    >
                      {isToday ? 'Today' : dayName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: isSelected ? '#ffffff' : '#1e293b',
                      }}
                    >
                      {dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && availableSlots.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>
              Select Time
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor:
                      selectedTime === slot.time
                        ? '#16a34a'
                        : slot.available
                          ? '#ffffff'
                          : '#f3f4f6',
                    borderRadius: 8,
                    borderWidth: selectedTime === slot.time ? 2 : 1,
                    borderColor:
                      selectedTime === slot.time
                        ? '#16a34a'
                        : slot.available
                          ? '#e5e7eb'
                          : '#d1d5db',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color:
                        selectedTime === slot.time
                          ? '#ffffff'
                          : slot.available
                            ? '#1e293b'
                            : '#9ca3af',
                    }}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Symptoms and Notes */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}>
            Appointment Details
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Symptoms/Reason for visit *
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Describe your symptoms or reason for consultation..."
              multiline
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Additional Notes (Optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
              placeholder="Any additional information..."
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}
              >
                Booking Summary
              </Text>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>Doctor</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
                    Dr. {doctor.name}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>Date & Time</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
                    {selectedDate.toDateString()} at {selectedTime}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>Type</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>
                    {appointmentType.replace('_', ' ')}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingTop: 8,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                    Total Fee
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16a34a' }}>
                    ₹{getAppointmentFee()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Book Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleBookAppointment}
            disabled={isBooking || !selectedDate || !selectedTime || !symptoms.trim()}
            style={{
              backgroundColor:
                isBooking || !selectedDate || !selectedTime || !symptoms.trim()
                  ? '#94a3b8'
                  : '#16a34a',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            {isBooking ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>
                Book Appointment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
