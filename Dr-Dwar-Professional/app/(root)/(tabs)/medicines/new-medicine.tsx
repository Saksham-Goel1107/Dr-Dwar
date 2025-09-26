import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MedicineFormData {
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  quantity: string;
  price: string;
  description: string;
  category: string;
  dosageForm: string;
  strength: string;
}

export default function NewMedicineScreen() {
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    genericName: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    price: '',
    description: '',
    category: '',
    dosageForm: '',
    strength: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof MedicineFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields: (keyof MedicineFormData)[] = [
      'name',
      'genericName',
      'manufacturer',
      'batchNumber',
      'expiryDate',
      'quantity',
      'price',
      'category',
      'dosageForm',
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

    if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity.');
      return false;
    }

    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Here you would typically make an API call to save the medicine
      // For now, we'll just simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert('Success', 'Medicine added successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            setFormData({
              name: '',
              genericName: '',
              manufacturer: '',
              batchNumber: '',
              expiryDate: '',
              quantity: '',
              price: '',
              description: '',
              category: '',
              dosageForm: '',
              strength: '',
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
      console.error('Error adding medicine:', error);
      Alert.alert('Error', 'Failed to add medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="mb-6 text-2xl font-bold text-gray-900">Add New Medicine</Text>

        <View className="space-y-4">
          {/* Basic Information */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Basic Information</Text>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Medicine Name *"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Generic Name *"
              value={formData.genericName}
              onChangeText={(value) => handleInputChange('genericName', value)}
            />

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Manufacturer *"
              value={formData.manufacturer}
              onChangeText={(value) => handleInputChange('manufacturer', value)}
            />

            <View className="flex-row space-x-2">
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Category *"
                value={formData.category}
                onChangeText={(value) => handleInputChange('category', value)}
              />
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Dosage Form *"
                value={formData.dosageForm}
                onChangeText={(value) => handleInputChange('dosageForm', value)}
              />
            </View>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Strength (e.g., 500mg, 10ml)"
              value={formData.strength}
              onChangeText={(value) => handleInputChange('strength', value)}
            />
          </View>

          {/* Stock Information */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Stock Information</Text>

            <View className="flex-row space-x-2">
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Batch Number *"
                value={formData.batchNumber}
                onChangeText={(value) => handleInputChange('batchNumber', value)}
              />
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Expiry Date *"
                value={formData.expiryDate}
                onChangeText={(value) => handleInputChange('expiryDate', value)}
              />
            </View>

            <View className="flex-row space-x-2">
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Quantity *"
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 p-3"
                placeholder="Price per unit *"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Additional Information */}
          <View className="rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Additional Information</Text>

            <TextInput
              className="mb-4 rounded-lg border border-gray-300 p-3"
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`mt-6 rounded-xl p-4 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-center text-lg font-semibold text-white">
              {loading ? 'Adding Medicine...' : 'Add Medicine'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
