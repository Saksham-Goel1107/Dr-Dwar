import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AppointmentFormData {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

export default function ScheduleAppointmentScreen() {
  const [formData, setFormData] = useState<AppointmentFormData>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: '',
    notes: '',
    priority: 'medium',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields: (keyof AppointmentFormData)[] = [
      'patientName',
      'patientPhone',
      'appointmentDate',
      'appointmentTime',
      'appointmentType',
    ];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Here you would typically make an API call to schedule the appointment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert('Success', 'Appointment scheduled successfully!', [
        {
          text: 'Schedule Another',
          onPress: () => {
            setFormData({
              patientName: '',
              patientPhone: '',
              patientEmail: '',
              appointmentDate: '',
              appointmentTime: '',
              appointmentType: '',
              notes: '',
              priority: 'medium',
            });
          },
        },
        {
          text: 'Go Back',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      Alert.alert('Error', 'Failed to schedule appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PriorityButton = ({ title, value }: { title: string; value: typeof formData.priority }) => (
    <TouchableOpacity
      className={`mr-3 rounded-full px-4 py-2 ${
        formData.priority === value ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      onPress={() => handleInputChange('priority', value)}
    >
      <Text
        className={`text-sm font-medium ${
          formData.priority === value ? 'text-white' : 'text-gray-700'
        }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

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

            <View className="mb-4 flex-row space-x-2">
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Date * (YYYY-MM-DD)"
                value={formData.appointmentDate}
                onChangeText={(value) => handleInputChange('appointmentDate', value)}
              />
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Time * (HH:MM)"
                value={formData.appointmentTime}
                onChangeText={(value) => handleInputChange('appointmentTime', value)}
              />
            </View>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Appointment Type * (e.g., Consultation, Follow-up)"
              value={formData.appointmentType}
              onChangeText={(value) => handleInputChange('appointmentType', value)}
            />

            <Text className="mb-2 text-sm font-medium text-gray-700">Priority Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row">
                <PriorityButton title="Low" value="low" />
                <PriorityButton title="Medium" value="medium" />
                <PriorityButton title="High" value="high" />
              </View>
            </ScrollView>
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
