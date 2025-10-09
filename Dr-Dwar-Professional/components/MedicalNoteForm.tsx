import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MedicalNoteFormProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  onSuccess?: () => void;
}

const NOTE_TYPES = [
  { value: 'INSTRUCTION', label: 'Instructions' },
  { value: 'OBSERVATION', label: 'Observations' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'WARNING', label: 'Warnings' },
  { value: 'PROGRESS', label: 'Progress Notes' },
  { value: 'GENERAL', label: 'General Notes' },
];

export default function MedicalNoteForm({
  visible,
  onClose,
  patientId,
  patientName,
  appointmentId,
  onSuccess,
}: MedicalNoteFormProps) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [noteType, setNoteType] = useState('GENERAL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter note content');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/medical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          patientId,
          appointmentId,
          noteType,
          title,
          content,
          isPrivate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Medical note created successfully');
        onClose();
        onSuccess?.();
        // Reset form
        setNoteType('GENERAL');
        setTitle('');
        setContent('');
        setIsPrivate(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to create medical note');
      }
    } catch (error) {
      console.error('Error creating medical note:', error);
      Alert.alert('Error', 'Failed to create medical note. Please try again.');
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
            <Text className="text-xl font-bold text-gray-900">Add Medical Note</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Patient Info */}
            <View className="mb-6 rounded-lg bg-green-50 p-4">
              <Text className="mb-1 text-sm font-medium text-green-800">Patient</Text>
              <Text className="text-lg font-semibold text-green-900">{patientName}</Text>
            </View>

            {/* Note Type */}
            <View className="mb-6">
              <Text className="mb-3 text-sm font-medium text-gray-700">
                Note Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap">
                {NOTE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setNoteType(type.value)}
                    className={`mb-2 mr-2 rounded-full border px-3 py-2 ${
                      noteType === type.value
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        noteType === type.value ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                placeholder="Enter note title..."
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Content */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Content <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                placeholder="Enter note content..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Privacy Setting */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setIsPrivate(!isPrivate)}
                className="flex-row items-center"
              >
                <View
                  className={`mr-3 h-5 w-5 items-center justify-center rounded border-2 ${
                    isPrivate ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isPrivate && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text className="text-sm text-gray-700">
                  Make this note private (only you can see it)
                </Text>
              </TouchableOpacity>
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
              className="flex-1 rounded-lg bg-green-600 py-3 disabled:bg-green-300"
            >
              <Text className="text-center font-medium text-white">
                {isLoading ? 'Creating...' : 'Add Note'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
