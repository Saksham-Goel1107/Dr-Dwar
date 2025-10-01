import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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

interface AppointmentFormData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'telemedicine';
  notes: string;
  duration: number;
  fee: number;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function ScheduleAppointmentScreen() {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: new Date(),
    appointmentTime: '',
    appointmentType: 'consultation',
    notes: '',
    duration: 30,
    fee: 500,
  });

  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());

  // Haptics setting
  const vibrationsEnabled = true;

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

  // Check availability for selected date
  const checkAvailability = useCallback(
    async (date: Date) => {
      if (!networkStatus || checkingAvailability) return;

      const dateString = date.toISOString().split('T')[0];

      // Don't check if already checked this date
      if (checkedDates.has(dateString)) return;

      setCheckingAvailability(true);
      try {
        const token = await getToken();

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/availability?date=${dateString}`,
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
          setAvailableSlots(data.data || []);
          setCheckedDates((prev) => new Set([...prev, dateString])); // Mark as checked
        } else {
          console.error('Failed to fetch availability:', data.message);
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailableSlots([]);
      } finally {
        setCheckingAvailability(false);
      }
    },
    [getToken, networkStatus, checkingAvailability, checkedDates],
  );

  // Check availability when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      checkAvailability(formData.appointmentDate);
    }
  }, [formData.appointmentDate, checkAvailability]);

  const handleInputChange = (field: keyof AppointmentFormData, value: string | number | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // Always close the picker
    if (selectedDate && event.type !== 'dismissed') {
      handleInputChange('appointmentDate', selectedDate);
      handleInputChange('appointmentTime', ''); // Reset time when date changes
      setAvailableSlots([]); // Clear previous availability
      setCheckedDates(new Set()); // Reset checked dates to allow re-checking
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false); // Always close the picker
    if (selectedTime && event.type !== 'dismissed') {
      const timeString = selectedTime.toTimeString().substring(0, 5); // HH:MM format
      handleInputChange('appointmentTime', timeString);
    }
  };

  const isTimeSlotAvailable = (timeString: string) => {
    // Check if the selected time slot is available
    const selectedHour = parseInt(timeString.split(':')[0]);
    const selectedMinute = parseInt(timeString.split(':')[1]);

    return availableSlots.some((slot) => {
      const startTime = slot.startTime.split(':');
      const endTime = slot.endTime.split(':');
      const startHour = parseInt(startTime[0]);
      const startMinute = parseInt(startTime[1]);
      const endHour = parseInt(endTime[0]);
      const endMinute = parseInt(endTime[1]);

      const slotStart = startHour * 60 + startMinute;
      const slotEnd = endHour * 60 + endMinute;
      const selectedTime = selectedHour * 60 + selectedMinute;

      return selectedTime >= slotStart && selectedTime < slotEnd && slot.available;
    });
  };

  const validateForm = () => {
    const requiredFields: (keyof AppointmentFormData)[] = [
      'patientName',
      'patientPhone',
      'appointmentTime',
    ];

    for (const field of requiredFields) {
      if (
        !formData[field] ||
        (typeof formData[field] === 'string' && !formData[field].toString().trim())
      ) {
        Alert.alert(
          'Validation Error',
          `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
        );
        return false;
      }
    }

    // Validate phone number
    if (!/^\d{10}$/.test(formData.patientPhone.replace(/\D/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number.');
      return false;
    }

    // Validate email if provided
    if (formData.patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.patientEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }

    // Check if selected time is available
    if (!isTimeSlotAvailable(formData.appointmentTime)) {
      Alert.alert(
        'Time Unavailable',
        'The selected time slot is not available. Please choose a different time.',
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      const token = await getToken();

      const appointmentData = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        patientEmail: formData.patientEmail || null,
        appointmentDate: formData.appointmentDate.toISOString().split('T')[0],
        appointmentTime: formData.appointmentTime,
        appointmentType: formData.appointmentType.toUpperCase(),
        duration: formData.duration,
        fee: formData.fee,
        notes: formData.notes || null,
      };

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/appointments/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Appointment scheduled successfully!', [
          {
            text: 'Schedule Another',
            onPress: () => {
              setFormData({
                patientName: '',
                patientPhone: '',
                patientEmail: '',
                appointmentDate: new Date(),
                appointmentTime: '',
                appointmentType: 'consultation',
                notes: '',
                duration: 30,
                fee: 500,
              });
              setAvailableSlots([]);
              setCheckedDates(new Set()); // Reset checked dates for new appointment
            },
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      Alert.alert('Error', 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!networkStatus) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="wifi" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-medium text-gray-500">No Internet Connection</Text>
        <Text className="mt-2 text-center text-sm text-gray-400">
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-gray-900">Schedule Appointment</Text>

        <View className="space-y-4">
          {/* Patient Information */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Patient Information</Text>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Patient Full Name *"
              value={formData.patientName}
              onChangeText={(value) => handleInputChange('patientName', value)}
            />

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Phone Number *"
              value={formData.patientPhone}
              onChangeText={(value) => handleInputChange('patientPhone', value)}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Email Address (optional)"
              value={formData.patientEmail}
              onChangeText={(value) => handleInputChange('patientEmail', value)}
              keyboardType="email-address"
            />
          </View>

          {/* Appointment Details */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Appointment Details</Text>

            {/* Date Picker */}
            <TouchableOpacity
              className="mb-4 rounded-lg border border-gray-300 p-3"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="flex-row items-center justify-between">
                <Text className={formData.appointmentDate ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.appointmentDate
                    ? formData.appointmentDate.toLocaleDateString()
                    : 'Select Date *'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>

            {/* Time Picker */}
            <TouchableOpacity
              className="mb-4 rounded-lg border border-gray-300 p-3"
              onPress={() => setShowTimePicker(true)}
            >
              <View className="flex-row items-center justify-between">
                <Text className={formData.appointmentTime ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.appointmentTime || 'Select Time *'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>

            {/* DateTime Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={formData.appointmentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={formData.appointmentDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Availability Status */}
            {checkingAvailability && (
              <View className="mb-4 flex-row items-center">
                <ActivityIndicator size="small" color="#16a34a" />
                <Text className="ml-2 text-sm text-gray-600">Checking availability...</Text>
              </View>
            )}

            {formData.appointmentTime && !isTimeSlotAvailable(formData.appointmentTime) && (
              <Text className="mb-4 text-sm text-red-600">
                ⚠️ This time slot is not available. Please select a different time.
              </Text>
            )}

            {/* Appointment Type */}
            <Text className="mb-2 text-sm font-medium text-gray-700">Appointment Type</Text>
            <View className="mb-4 flex-row flex-wrap">
              {[
                { label: 'Consultation', value: 'consultation' },
                { label: 'Follow-up', value: 'follow_up' },
                { label: 'Emergency', value: 'emergency' },
                { label: 'Telemedicine', value: 'telemedicine' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                    formData.appointmentType === type.value ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  onPress={() => handleInputChange('appointmentType', type.value)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.appointmentType === type.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration and Fee */}
            <View className="mb-4 flex-row space-x-2">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-gray-700">Duration (minutes)</Text>
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="30"
                  value={formData.duration.toString()}
                  onChangeText={(value) => handleInputChange('duration', parseInt(value) || 30)}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-gray-700">Fee (₹)</Text>
                <TextInput
                  className="rounded-lg border border-gray-300 p-3"
                  placeholder="500"
                  value={formData.fee.toString()}
                  onChangeText={(value) => handleInputChange('fee', parseInt(value) || 500)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Additional Notes</Text>

            <TextInput
              className="rounded-lg border border-gray-300 p-3"
              placeholder="Any additional notes or special requirements..."
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`mt-6 rounded-xl p-4 ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-center text-lg font-semibold text-white">
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
