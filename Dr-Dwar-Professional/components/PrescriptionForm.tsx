import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PrescriptionFormProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  patientName: string;
  onSuccess?: () => void;
}

interface Medicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
}

export default function PrescriptionForm({
  visible,
  onClose,
  appointmentId,
  patientName,
  onSuccess,
}: PrescriptionFormProps) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 },
  ]);

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 },
    ]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string | number) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setMedicines(updatedMedicines);
  };

  const validateForm = () => {
    if (!diagnosis.trim()) {
      Alert.alert('Error', 'Please enter a diagnosis');
      return false;
    }

    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i];
      if (
        !medicine.medicineName.trim() ||
        !medicine.dosage.trim() ||
        !medicine.frequency.trim() ||
        !medicine.duration.trim()
      ) {
        Alert.alert('Error', `Please fill all required fields for medicine ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          appointmentId,
          diagnosis,
          notes,
          medicines,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Prescription created successfully');
        onClose();
        onSuccess?.();
        // Reset form
        setDiagnosis('');
        setNotes('');
        setMedicines([
          {
            medicineName: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: 1,
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="h-[95%] rounded-t-3xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 p-6">
            <Text className="text-xl font-bold text-gray-900">Create Prescription</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Patient Info */}
            <View className="mb-6 rounded-lg bg-blue-50 p-4">
              <Text className="mb-1 text-sm font-medium text-blue-800">Patient</Text>
              <Text className="text-lg font-semibold text-blue-900">{patientName}</Text>
            </View>

            {/* Diagnosis */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Diagnosis <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Medicines */}
            <View className="mb-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">Medicines</Text>
                <TouchableOpacity
                  onPress={addMedicine}
                  className="rounded-lg bg-green-600 px-3 py-2"
                >
                  <Text className="font-medium text-white">+ Add Medicine</Text>
                </TouchableOpacity>
              </View>

              {medicines.map((medicine, index) => (
                <View key={index} className="mb-4 rounded-lg border border-gray-200 p-4">
                  <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-700">Medicine {index + 1}</Text>
                    {medicines.length > 1 && (
                      <TouchableOpacity onPress={() => removeMedicine(index)} className="p-1">
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    className="mb-3 rounded-lg border border-gray-300 p-3 text-gray-900"
                    placeholder="Medicine name *"
                    value={medicine.medicineName}
                    onChangeText={(value) => updateMedicine(index, 'medicineName', value)}
                  />

                  <View className="mb-3 flex-row space-x-2">
                    <TextInput
                      className="flex-1 rounded-lg border border-gray-300 p-3 text-gray-900"
                      placeholder="Dosage *"
                      value={medicine.dosage}
                      onChangeText={(value) => updateMedicine(index, 'dosage', value)}
                    />
                    <TextInput
                      className="flex-1 rounded-lg border border-gray-300 p-3 text-gray-900"
                      placeholder="Frequency *"
                      value={medicine.frequency}
                      onChangeText={(value) => updateMedicine(index, 'frequency', value)}
                    />
                  </View>

                  <View className="mb-3 flex-row space-x-2">
                    <TextInput
                      className="flex-1 rounded-lg border border-gray-300 p-3 text-gray-900"
                      placeholder="Duration *"
                      value={medicine.duration}
                      onChangeText={(value) => updateMedicine(index, 'duration', value)}
                    />
                    <TextInput
                      className="flex-1 rounded-lg border border-gray-300 p-3 text-gray-900"
                      placeholder="Quantity"
                      value={medicine.quantity?.toString() || ''}
                      onChangeText={(value) =>
                        updateMedicine(index, 'quantity', parseInt(value) || 1)
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  <TextInput
                    className="rounded-lg border border-gray-300 p-3 text-gray-900"
                    placeholder="Instructions (optional)"
                    value={medicine.instructions}
                    onChangeText={(value) => updateMedicine(index, 'instructions', value)}
                  />
                </View>
              ))}
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Additional Notes (optional)
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                placeholder="Any additional notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row space-x-3 border-t border-gray-200 p-6">
            <TouchableOpacity onPress={onClose} className="flex-1 rounded-lg bg-gray-200 py-3">
              <Text className="text-center font-medium text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 py-3 disabled:bg-blue-300"
            >
              <Text className="text-center font-medium text-white">
                {isLoading ? 'Creating...' : 'Create Prescription'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
