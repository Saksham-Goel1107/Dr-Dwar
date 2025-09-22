import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReminderType = 'medicine' | 'health-check' | 'appointment' | 'exercise' | 'meal' | 'other';

interface DoseTime {
  id: string;
  time: Date;
  notificationId?: string;
}

interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  description: string;
  isActive: boolean;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'custom';
  customFrequency?: {
    type: 'specific-days' | 'interval-days';
    days?: number[]; // For specific days: 0=Sunday, 1=Monday, etc.
    interval?: number; // For interval: every N days
  };
  doses: DoseTime[];
  medicineAmount?: string; // e.g., "500mg", "2 tablets"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReminderFormProps {
  onSubmit: (reminder: Omit<Reminder, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  editingReminder?: Reminder | null;
}

function ReminderForm({
  onSubmit,
  onCancel,
  isProcessing = false,
  editingReminder,
}: ReminderFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('medicine');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'custom'>('daily');
  const [customFrequencyType, setCustomFrequencyType] = useState<'specific-days' | 'interval-days'>(
    'specific-days',
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState('2');
  const [doses, setDoses] = useState<DoseTime[]>([{ id: '1', time: new Date() }]);
  const [medicineAmount, setMedicineAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDoseIndex, setSelectedDoseIndex] = useState<number | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setType(editingReminder.type);
      setDescription(editingReminder.description);
      setFrequency(editingReminder.frequency);
      setMedicineAmount(editingReminder.medicineAmount || '');
      setNotes(editingReminder.notes || '');
      setDoses(
        editingReminder.doses.length > 0 ? editingReminder.doses : [{ id: '1', time: new Date() }],
      );

      if (editingReminder.customFrequency) {
        setCustomFrequencyType(editingReminder.customFrequency.type);
        if (editingReminder.customFrequency.type === 'specific-days') {
          setSelectedDays(editingReminder.customFrequency.days || []);
        } else {
          setIntervalDays(editingReminder.customFrequency.interval?.toString() || '2');
        }
      }
    } else {
      // Reset form for new reminder
      setTitle('');
      setType('medicine');
      setDescription('');
      setFrequency('daily');
      setCustomFrequencyType('specific-days');
      setSelectedDays([]);
      setIntervalDays('2');
      setDoses([{ id: '1', time: new Date() }]);
      setMedicineAmount('');
      setNotes('');
    }
  }, [editingReminder]);

  const reminderTypeOptions: { label: string; value: ReminderType; icon: string }[] = [
    { label: 'Medicine', value: 'medicine', icon: 'medical' },
    { label: 'Health Check', value: 'health-check', icon: 'heart' },
    { label: 'Appointment', value: 'appointment', icon: 'calendar' },
    { label: 'Exercise', value: 'exercise', icon: 'fitness' },
    { label: 'Meal', value: 'meal', icon: 'restaurant' },
    { label: 'Other', value: 'other', icon: 'list' },
  ];

  const addDose = () => {
    const newDose: DoseTime = {
      id: Date.now().toString(),
      time: new Date(),
    };
    setDoses([...doses, newDose]);
  };

  const removeDose = (index: number) => {
    if (doses.length > 1) {
      setDoses(doses.filter((_, i) => i !== index));
    }
  };

  const updateDoseTime = (index: number, time: Date) => {
    const updatedDoses = [...doses];
    updatedDoses[index].time = time;
    setDoses(updatedDoses);
  };

  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the reminder');
      return;
    }

    if (title.trim().length < 2) {
      Alert.alert('Validation Error', 'Title must be at least 2 characters long');
      return;
    }

    if (type === 'medicine' && doses.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one dose time for medicine reminders');
      return;
    }

    if (doses.length === 0) {
      Alert.alert('Validation Error', 'Please select a reminder time');
      return;
    }

    if (type === 'medicine' && medicineAmount.trim() && medicineAmount.trim().length > 50) {
      Alert.alert('Validation Error', 'Medicine amount should be less than 50 characters');
      return;
    }

    if (description.trim().length > 200) {
      Alert.alert('Validation Error', 'Description should be less than 200 characters');
      return;
    }

    if (notes.trim().length > 150) {
      Alert.alert('Validation Error', 'Notes should be less than 150 characters');
      return;
    }

    // Check for duplicate times in medicine reminders
    if (type === 'medicine' && doses.length > 1) {
      const times = doses.map((dose) => dose.time.getHours() * 60 + dose.time.getMinutes());
      const uniqueTimes = new Set(times);
      if (uniqueTimes.size !== times.length) {
        Alert.alert('Validation Error', 'Please ensure all dose times are unique');
        return;
      }
    }

    // Validate custom frequency settings
    if (frequency === 'custom') {
      if (customFrequencyType === 'specific-days' && selectedDays.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one day for the custom schedule');
        return;
      }
      if (
        customFrequencyType === 'interval-days' &&
        (!intervalDays || parseInt(intervalDays) < 1)
      ) {
        Alert.alert('Validation Error', 'Please enter a valid interval (at least 1 day)');
        return;
      }
    }

    onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      frequency,
      customFrequency:
        frequency === 'custom'
          ? {
              type: customFrequencyType,
              days: customFrequencyType === 'specific-days' ? selectedDays : undefined,
              interval:
                customFrequencyType === 'interval-days' ? parseInt(intervalDays) || 2 : undefined,
            }
          : undefined,
      doses,
      medicineAmount: medicineAmount.trim(),
      notes: notes.trim(),
    });

    // Reset form only if not editing
    if (!editingReminder) {
      setTitle('');
      setType('medicine');
      setDescription('');
      setFrequency('daily');
      setCustomFrequencyType('specific-days');
      setSelectedDays([]);
      setIntervalDays('2');
      setDoses([{ id: '1', time: new Date() }]);
      setMedicineAmount('');
      setNotes('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card style={{ margin: 16, borderRadius: 16, elevation: 4, backgroundColor: '#ffffff' }}>
      <Card.Content style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
        </Text>
        {/* Title */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title"
            style={{
              borderWidth: 2,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: '#f9fafb',
              color: '#1f2937',
            }}
          />
        </View>
        {/* Type Selection */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            Reminder Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {reminderTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setType(option.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: type === option.value ? '#059669' : '#e5e7eb',
                  backgroundColor: type === option.value ? '#ecfdf5' : '#ffffff',
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={16}
                  color={type === option.value ? '#059669' : '#6b7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: type === option.value ? '#059669' : '#374151',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Description */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            multiline
            numberOfLines={2}
            style={{
              borderWidth: 2,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              textAlignVertical: 'top',
              minHeight: 60,
            }}
          />
        </View>
        {/* Medicine Amount (only for medicine type) */}
        {type === 'medicine' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
              Medicine Amount
            </Text>
            <TextInput
              value={medicineAmount}
              onChangeText={setMedicineAmount}
              placeholder="e.g., 500mg, 2 tablets"
              style={{
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                backgroundColor: '#f9fafb',
                color: '#1f2937',
              }}
            />
          </View>
        )}
        {/* Time Selection (for all reminder types) */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Reminder Time
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedDoseIndex(0);
              setShowTimePicker(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: '#f9fafb',
              borderWidth: 2,
              borderColor: '#e5e7eb',
            }}
          >
            <Ionicons name="time-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>
              {formatTime(doses[0]?.time || new Date())}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        {/* Dose Times (only for medicine type) */}
        {type === 'medicine' && (
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                Additional Dose Times ({doses.length - 1})
              </Text>
              <TouchableOpacity
                onPress={addDose}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: '#059669',
                }}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={{ color: 'white', fontWeight: '500', marginLeft: 4 }}>Add Time</Text>
              </TouchableOpacity>
            </View>

            {doses.slice(1).map((dose, index) => (
              <View
                key={dose.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDoseIndex(index + 1);
                    setShowTimePicker(true);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#6b7280"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 16, color: '#1f2937', flex: 1 }}>
                    {formatTime(dose.time)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeDose(index + 1)}
                  style={{
                    marginLeft: 8,
                    padding: 8,
                    borderRadius: 20,
                    backgroundColor: '#fef2f2',
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Frequency */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Frequency
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Daily', value: 'daily' as const },
              { label: 'Weekly', value: 'weekly' as const },
              { label: 'Bi-weekly', value: 'bi-weekly' as const },
              { label: 'Custom', value: 'custom' as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setFrequency(option.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: frequency === option.value ? '#059669' : '#e5e7eb',
                  backgroundColor: frequency === option.value ? '#ecfdf5' : '#ffffff',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: frequency === option.value ? '#059669' : '#374151',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Frequency Options */}
          {frequency === 'custom' && (
            <View
              style={{ marginTop: 12, padding: 16, backgroundColor: '#f8fafc', borderRadius: 12 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                Custom Schedule
              </Text>

              {/* Custom Frequency Type Selection */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => setCustomFrequencyType('specific-days')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: customFrequencyType === 'specific-days' ? '#059669' : '#e5e7eb',
                    backgroundColor:
                      customFrequencyType === 'specific-days' ? '#ecfdf5' : '#ffffff',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: customFrequencyType === 'specific-days' ? '#059669' : '#374151',
                    }}
                  >
                    Specific Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCustomFrequencyType('interval-days')}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: customFrequencyType === 'interval-days' ? '#059669' : '#e5e7eb',
                    backgroundColor:
                      customFrequencyType === 'interval-days' ? '#ecfdf5' : '#ffffff',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: customFrequencyType === 'interval-days' ? '#059669' : '#374151',
                    }}
                  >
                    Every N Days
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Specific Days Selection */}
              {customFrequencyType === 'specific-days' && (
                <View>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}
                  >
                    Select Days:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => {
                          if (selectedDays.includes(index)) {
                            setSelectedDays(selectedDays.filter((d) => d !== index));
                          } else {
                            setSelectedDays([...selectedDays, index]);
                          }
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: selectedDays.includes(index) ? '#059669' : '#e5e7eb',
                          backgroundColor: selectedDays.includes(index) ? '#ecfdf5' : '#ffffff',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: selectedDays.includes(index) ? '#059669' : '#374151',
                          }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Interval Days Selection */}
              {customFrequencyType === 'interval-days' && (
                <View>
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}
                  >
                    Repeat every:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      value={intervalDays}
                      onChangeText={(text) => {
                        // Only allow numbers
                        const numericText = text.replace(/[^0-9]/g, '');
                        if (
                          numericText === '' ||
                          (parseInt(numericText) > 0 && parseInt(numericText) <= 365)
                        ) {
                          setIntervalDays(numericText);
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="2"
                      style={{
                        flex: 1,
                        borderWidth: 2,
                        borderColor: '#e5e7eb',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        backgroundColor: '#ffffff',
                        color: '#1f2937',
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ fontSize: 16, color: '#374151' }}>days</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>{' '}
        {/* Notes */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Notes (Optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            multiline
            numberOfLines={2}
            style={{
              borderWidth: 2,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              backgroundColor: '#f9fafb',
              color: '#1f2937',
              textAlignVertical: 'top',
              minHeight: 60,
            }}
          />
        </View>
        {/* Time Picker */}
        {showTimePicker && selectedDoseIndex !== null && (
          <DateTimePicker
            value={doses[selectedDoseIndex].time}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowTimePicker(false);
              if (date && selectedDoseIndex !== null) {
                updateDoseTime(selectedDoseIndex, date);
              }
              setSelectedDoseIndex(null);
            }}
          />
        )}
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <TouchableOpacity
            onPress={onCancel}
            disabled={isProcessing}
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#d1d5db',
              backgroundColor: isProcessing ? '#f3f4f6' : '#ffffff',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isProcessing ? '#9ca3af' : '#6b7280',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isProcessing}
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: isProcessing ? '#6b7280' : '#059669',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {isProcessing && (
              <Ionicons
                name="hourglass-outline"
                size={16}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>
              {isProcessing
                ? editingReminder
                  ? 'Updating...'
                  : 'Creating...'
                : editingReminder
                  ? 'Update Reminder'
                  : 'Create Reminder'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
}

interface ReminderItemProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
}

function ReminderItem({ reminder, onToggle, onDelete, onEdit }: ReminderItemProps) {
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);

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
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTypeIcon = (type: ReminderType) => {
    const icons = {
      medicine: 'medical',
      'health-check': 'heart',
      appointment: 'calendar',
      exercise: 'fitness',
      meal: 'restaurant',
      other: 'list',
    };
    return icons[type] || 'list';
  };

  const getTypeColor = (type: ReminderType) => {
    const colors = {
      medicine: '#059669',
      'health-check': '#dc2626',
      appointment: '#7c3aed',
      exercise: '#ea580c',
      meal: '#0891b2',
      other: '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  const handleDelete = () => {
    Alert.alert('Delete Reminder', `Are you sure you want to delete "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(reminder.id) },
    ]);
  };

  return (
    <TouchableOpacity onPress={() => onEdit(reminder)} activeOpacity={0.7}>
      <Card
        style={{
          marginHorizontal: 16,
          marginVertical: 6,
          borderRadius: 16,
          elevation: 2,
          backgroundColor: reminder.isActive ? '#ffffff' : '#f8fafc',
          borderWidth: 1,
          borderColor: reminder.isActive ? '#e5e7eb' : '#d1d5db',
        }}
      >
        <Card.Content style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Type Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: getTypeColor(reminder.type) + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons
                name={getTypeIcon(reminder.type) as any}
                size={20}
                color={getTypeColor(reminder.type)}
              />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: reminder.isActive ? '#1e293b' : '#6b7280',
                    flex: 1,
                  }}
                >
                  {reminder.title}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: getTypeColor(reminder.type) + '20',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: getTypeColor(reminder.type),
                      textTransform: 'capitalize',
                    }}
                  >
                    {reminder.type.replace('-', ' ')}
                  </Text>
                </View>
              </View>

              {reminder.description && (
                <Text
                  style={{
                    fontSize: 14,
                    color: reminder.isActive ? '#64748b' : '#9ca3af',
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                >
                  {reminder.description}
                </Text>
              )}

              {/* Medicine Amount */}
              {reminder.type === 'medicine' && reminder.medicineAmount && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="medical-outline" size={14} color="#059669" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#059669',
                      fontWeight: '500',
                      marginLeft: 4,
                    }}
                  >
                    {reminder.medicineAmount}
                  </Text>
                </View>
              )}

              {/* Time for all reminders */}
              {reminder.doses.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={reminder.isActive ? '#64748b' : '#9ca3af'}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: reminder.isActive ? '#64748b' : '#9ca3af',
                      marginLeft: 4,
                    }}
                  >
                    {formatTime(reminder.doses[0].time)}
                  </Text>
                </View>
              )}

              {/* Frequency */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons
                  name="repeat-outline"
                  size={14}
                  color={reminder.isActive ? '#64748b' : '#9ca3af'}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: reminder.isActive ? '#64748b' : '#9ca3af',
                    marginLeft: 4,
                    textTransform: 'capitalize',
                  }}
                >
                  {reminder.frequency === 'custom' && reminder.customFrequency
                    ? reminder.customFrequency.type === 'specific-days'
                      ? `Custom: ${reminder.customFrequency.days?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'No days'}`
                      : `Every ${reminder.customFrequency.interval} days`
                    : reminder.frequency}
                </Text>
              </View>

              {/* Notes */}
              {reminder.notes && (
                <Text
                  style={{
                    fontSize: 13,
                    color: reminder.isActive ? '#64748b' : '#9ca3af',
                    fontStyle: 'italic',
                    lineHeight: 18,
                  }}
                >
                  Note: {reminder.notes}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  // Provide vibration feedback if enabled
                  if (vibrationsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onToggle(reminder.id);
                }}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: reminder.isActive ? '#dcfce7' : '#f3f4f6',
                }}
              >
                <Ionicons
                  name={reminder.isActive ? 'notifications' : 'notifications-off'}
                  size={18}
                  color={reminder.isActive ? '#16a34a' : '#6b7280'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  // Provide vibration feedback if enabled
                  if (vibrationsEnabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  handleDelete();
                }}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: '#fef2f2',
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export default function MedicineReminderScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    initializeNotifications();
    loadReminders();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Check user preference from secure storage
      const userPreference = await SecureStore.getItemAsync('NOTIFICATIONS');
      const enabled = userPreference !== 'false' && finalStatus === 'granted';

      setNotificationsEnabled(enabled);

      if (!enabled && finalStatus !== 'granted') {
        Alert.alert(
          'Notifications Disabled',
          'Notifications are required for medicine reminders. Please enable them in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const stored = await SecureStore.getItemAsync('MEDICINE_REMINDERS');
      if (stored) {
        const parsedReminders = JSON.parse(stored);
        // Convert time strings back to Date objects and handle migration
        const remindersWithDates = parsedReminders.map((r: any) => {
          // Handle migration from old format
          if (r.time) {
            // Old format
            return {
              id: r.id,
              title: r.medicineName || 'Migrated Reminder',
              type: 'medicine' as ReminderType,
              description: r.message || '',
              isActive: r.isActive,
              frequency: 'daily' as const,
              doses: [{ id: '1', time: new Date(r.time), notificationId: r.notificationId }],
              medicineAmount: '',
              notes: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          } else {
            // New format
            return {
              ...r,
              doses: r.doses.map((dose: any) => ({
                ...dose,
                time: new Date(dose.time),
              })),
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
            };
          }
        });
        setReminders(remindersWithDates);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      await SecureStore.setItemAsync('MEDICINE_REMINDERS', JSON.stringify(newReminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const scheduleNotification = async (reminder: Reminder, doseIndex?: number) => {
    try {
      if (!notificationsEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your profile settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => router.push('/(root)/(tabs)/profile') },
          ],
        );
        return null;
      }

      const notificationIds: string[] = [];

      if (reminder.type === 'medicine' && reminder.doses.length > 0) {
        // Schedule notifications for each dose
        for (let i = 0; i < reminder.doses.length; i++) {
          if (doseIndex !== undefined && doseIndex !== i) continue;

          const dose = reminder.doses[i];
          const now = new Date();
          const reminderTime = new Date(dose.time);

          // Set the reminder for today if the time hasn't passed, otherwise tomorrow
          let scheduledTime = new Date(reminderTime);
          if (reminder.frequency === 'bi-weekly') {
            // For bi-weekly, schedule for 2 weeks from now
            scheduledTime.setDate(scheduledTime.getDate() + 14);
          } else if (reminderTime <= now) {
            // For other frequencies, if time has passed, schedule for tomorrow
            scheduledTime.setDate(scheduledTime.getDate() + 1);
          }

          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `${reminder.title}`,
              body: (() => {
                let bodyParts = [];
                if (reminder.description) bodyParts.push(reminder.description);
                if (reminder.type === 'medicine' && reminder.medicineAmount) {
                  bodyParts.push(`Amount: ${reminder.medicineAmount}`);
                }
                if (reminder.notes) bodyParts.push(`Note: ${reminder.notes}`);
                if (reminder.frequency !== 'daily') {
                  bodyParts.push(
                    `Frequency: ${
                      reminder.frequency === 'custom' && reminder.customFrequency
                        ? reminder.customFrequency.type === 'specific-days'
                          ? `Custom: ${reminder.customFrequency.days?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'No days'}`
                          : `Every ${reminder.customFrequency.interval} days`
                        : reminder.frequency
                    }`,
                  );
                }
                return bodyParts.length > 0
                  ? bodyParts.join(' • ')
                  : `Time for your ${reminder.type.replace('-', ' ')} reminder`;
              })(),
              sound: 'default',
              data: { reminderId: reminder.id, doseId: dose.id },
            },
            trigger:
              Platform.OS === 'ios'
                ? // iOS supports CALENDAR trigger
                  reminder.frequency === 'daily'
                  ? {
                      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                      hour: scheduledTime.getHours(),
                      minute: scheduledTime.getMinutes(),
                      repeats: true,
                    }
                  : reminder.frequency === 'weekly'
                    ? {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        hour: scheduledTime.getHours(),
                        minute: scheduledTime.getMinutes(),
                        weekday: new Date().getDay() + 1, // 1 = Sunday, 2 = Monday, etc.
                        repeats: true,
                      }
                    : reminder.frequency === 'bi-weekly'
                      ? {
                          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                          hour: scheduledTime.getHours(),
                          minute: scheduledTime.getMinutes(),
                          repeats: false, // We'll handle bi-weekly manually by scheduling two weeks ahead
                        }
                      : reminder.frequency === 'custom' && reminder.customFrequency
                        ? {
                            // Handle custom frequency
                            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                            hour: scheduledTime.getHours(),
                            minute: scheduledTime.getMinutes(),
                            repeats: reminder.customFrequency.type === 'specific-days',
                            ...(reminder.customFrequency.type === 'specific-days' &&
                            reminder.customFrequency.days &&
                            reminder.customFrequency.days.length > 0
                              ? { weekday: reminder.customFrequency.days[0] + 1 }
                              : {}),
                          }
                        : {
                            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                            hour: scheduledTime.getHours(),
                            minute: scheduledTime.getMinutes(),
                            repeats: true,
                          }
                : // Android uses DATE trigger with timestamp - schedule multiple for recurring
                  (() => {
                    const now = new Date();
                    let targetTime = new Date(scheduledTime);

                    // If the target time has passed today, schedule for tomorrow
                    if (targetTime <= now) {
                      targetTime.setDate(targetTime.getDate() + 1);
                    }

                    // For recurring reminders on Android, schedule multiple instances
                    if (reminder.frequency === 'daily') {
                      // Schedule for next 7 days
                      const dates = [];
                      for (let i = 0; i < 7; i++) {
                        const date = new Date(targetTime);
                        date.setDate(date.getDate() + i);
                        dates.push(date.getTime());
                      }
                      return {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: dates[0], // First occurrence
                      };
                    } else if (reminder.frequency === 'weekly') {
                      // Schedule for next 4 weeks
                      const dates = [];
                      for (let i = 0; i < 4; i++) {
                        const date = new Date(targetTime);
                        date.setDate(date.getDate() + i * 7);
                        dates.push(date.getTime());
                      }
                      return {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: dates[0], // First occurrence
                      };
                    } else {
                      // For bi-weekly and custom, just schedule the next occurrence
                      return {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: targetTime.getTime(),
                      };
                    }
                  })(),
          });

          notificationIds.push(notificationId);
        }
      } else {
        // For non-medicine reminders, schedule a single notification
        const reminderTime = new Date(); // Use current time for now, can be enhanced later

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: (() => {
              let bodyParts = [];
              if (reminder.description) bodyParts.push(reminder.description);
              if (reminder.type === 'medicine' && reminder.medicineAmount) {
                bodyParts.push(`Amount: ${reminder.medicineAmount}`);
              }
              if (reminder.notes) bodyParts.push(`Note: ${reminder.notes}`);
              if (reminder.frequency !== 'daily') {
                bodyParts.push(
                  `Frequency: ${
                    reminder.frequency === 'custom' && reminder.customFrequency
                      ? reminder.customFrequency.type === 'specific-days'
                        ? `Custom: ${reminder.customFrequency.days?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'No days'}`
                        : `Every ${reminder.customFrequency.interval} days`
                      : reminder.frequency
                  }`,
                );
              }
              return bodyParts.length > 0
                ? bodyParts.join(' • ')
                : `Time for your ${reminder.type.replace('-', ' ')} reminder`;
            })(),
            sound: 'default',
            data: { reminderId: reminder.id },
          },
          trigger:
            Platform.OS === 'ios'
              ? // iOS supports CALENDAR trigger
                reminder.frequency === 'daily'
                ? {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: reminderTime.getHours(),
                    minute: reminderTime.getMinutes(),
                    repeats: true,
                  }
                : reminder.frequency === 'weekly'
                  ? {
                      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                      hour: reminderTime.getHours(),
                      minute: reminderTime.getMinutes(),
                      weekday: new Date().getDay() + 1,
                      repeats: true,
                    }
                  : reminder.frequency === 'bi-weekly'
                    ? {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        hour: reminderTime.getHours(),
                        minute: reminderTime.getMinutes(),
                        repeats: false,
                      }
                    : reminder.frequency === 'custom' && reminder.customFrequency
                      ? {
                          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                          hour: reminderTime.getHours(),
                          minute: reminderTime.getMinutes(),
                          repeats: reminder.customFrequency.type === 'specific-days',
                          ...(reminder.customFrequency.type === 'specific-days' &&
                          reminder.customFrequency.days &&
                          reminder.customFrequency.days.length > 0
                            ? { weekday: reminder.customFrequency.days[0] + 1 }
                            : {}),
                        }
                      : {
                          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                          hour: reminderTime.getHours(),
                          minute: reminderTime.getMinutes(),
                          repeats: true,
                        }
              : // Android uses DATE trigger with timestamp - schedule multiple for recurring
                (() => {
                  const now = new Date();
                  let targetTime = new Date(reminderTime);

                  // If the target time has passed today, schedule for tomorrow
                  if (targetTime <= now) {
                    targetTime.setDate(targetTime.getDate() + 1);
                  }

                  // For recurring reminders on Android, schedule multiple instances
                  if (reminder.frequency === 'daily') {
                    // Schedule for next 7 days
                    const dates = [];
                    for (let i = 0; i < 7; i++) {
                      const date = new Date(targetTime);
                      date.setDate(date.getDate() + i);
                      dates.push(date.getTime());
                    }
                    return {
                      type: Notifications.SchedulableTriggerInputTypes.DATE,
                      date: dates[0], // First occurrence
                    };
                  } else if (reminder.frequency === 'weekly') {
                    // Schedule for next 4 weeks
                    const dates = [];
                    for (let i = 0; i < 4; i++) {
                      const date = new Date(targetTime);
                      date.setDate(date.getDate() + i * 7);
                      dates.push(date.getTime());
                    }
                    return {
                      type: Notifications.SchedulableTriggerInputTypes.DATE,
                      date: dates[0], // First occurrence
                    };
                  } else {
                    // For bi-weekly and custom, just schedule the next occurrence
                    return {
                      type: Notifications.SchedulableTriggerInputTypes.DATE,
                      date: targetTime.getTime(),
                    };
                  }
                })(),
        });

        notificationIds.push(notificationId);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const addReminder = async (
    reminderData: Omit<Reminder, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ) => {
    setProcessingAction(true);
    try {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        ...reminderData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Schedule notifications for all doses
      const notificationIds = await scheduleNotification(newReminder);
      if (notificationIds && notificationIds.length > 0) {
        // Store notification IDs in the doses
        if (newReminder.type === 'medicine') {
          newReminder.doses = newReminder.doses.map((dose, index) => ({
            ...dose,
            notificationId: notificationIds[index] || notificationIds[0],
          }));
        } else {
          // For non-medicine reminders, store in the first dose or create one
          if (newReminder.doses.length === 0) {
            newReminder.doses = [{ id: '1', time: new Date(), notificationId: notificationIds[0] }];
          } else {
            newReminder.doses[0].notificationId = notificationIds[0];
          }
        }
      }

      const updatedReminders = [...reminders, newReminder];
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert(
        'Error',
        'Failed to create reminder. Please check your notification permissions and try again.',
      );
    } finally {
      setProcessingAction(false);
    }
  };

  const toggleReminder = async (id: string) => {
    const updatedReminders = reminders.map(async (reminder) => {
      if (reminder.id === id) {
        const newActiveState = !reminder.isActive;

        if (newActiveState) {
          // Schedule notifications for all doses
          const notificationIds = await scheduleNotification(reminder);
          if (notificationIds) {
            // Update notification IDs in doses
            reminder.doses = reminder.doses.map((dose, index) => ({
              ...dose,
              notificationId: notificationIds[index] || notificationIds[0],
            }));
          }
        } else {
          // Cancel all notifications for this reminder
          for (const dose of reminder.doses) {
            if (dose.notificationId) {
              await cancelNotification(dose.notificationId);
              dose.notificationId = undefined;
            }
          }
        }

        return { ...reminder, isActive: newActiveState, updatedAt: new Date() };
      }
      return reminder;
    });

    const resolvedReminders = await Promise.all(updatedReminders);
    setReminders(resolvedReminders);
    await saveReminders(resolvedReminders);
  };

  const deleteReminder = async (id: string) => {
    const reminderToDelete = reminders.find((r) => r.id === id);
    if (reminderToDelete) {
      // Cancel all notifications for this reminder
      for (const dose of reminderToDelete.doses) {
        if (dose.notificationId) {
          await cancelNotification(dose.notificationId);
        }
      }
    }

    const updatedReminders = reminders.filter((r) => r.id !== id);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const editReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const updateReminder = async (
    reminderData: Omit<Reminder, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!editingReminder) return;

    setProcessingAction(true);
    try {
      // Cancel old notifications
      for (const dose of editingReminder.doses) {
        if (dose.notificationId) {
          await cancelNotification(dose.notificationId);
        }
      }

      const updatedReminder: Reminder = {
        ...editingReminder,
        ...reminderData,
        updatedAt: new Date(),
      };

      // Schedule new notifications
      const notificationIds = await scheduleNotification(updatedReminder);
      if (notificationIds && notificationIds.length > 0) {
        // Store notification IDs in the doses
        if (updatedReminder.type === 'medicine') {
          updatedReminder.doses = updatedReminder.doses.map((dose, index) => ({
            ...dose,
            notificationId: notificationIds[index] || notificationIds[0],
          }));
        } else {
          // For non-medicine reminders, store in the first dose or create one
          if (updatedReminder.doses.length === 0) {
            updatedReminder.doses = [
              { id: '1', time: new Date(), notificationId: notificationIds[0] },
            ];
          } else {
            updatedReminder.doses[0].notificationId = notificationIds[0];
          }
        }
      }

      const updatedReminders = reminders.map((r) =>
        r.id === editingReminder.id ? updatedReminder : r,
      );
      setReminders(updatedReminders);
      await saveReminders(updatedReminders);
      setShowForm(false);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert(
        'Error',
        'Failed to update reminder. Please check your notification permissions and try again.',
      );
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, color: '#64748b' }}>Loading reminders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
          {editingReminder ? 'Edit Reminder' : 'Health Reminders'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (showForm) {
              setShowForm(false);
              setEditingReminder(null);
            } else {
              setShowForm(true);
            }
          }}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: '#059669',
          }}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showForm && (
          <ReminderForm
            onSubmit={editingReminder ? updateReminder : addReminder}
            onCancel={() => {
              setShowForm(false);
              setEditingReminder(null);
            }}
            isProcessing={processingAction}
            editingReminder={editingReminder}
          />
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 32,
              paddingVertical: 40,
              minHeight: 400,
            }}
          >
            <Ionicons name="medical-outline" size={80} color="#cbd5e1" />
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#64748b',
                marginTop: 16,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              No reminders yet
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              Set up health reminders to stay on top of your medication schedule and health
              check-ups
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowForm(true)}
              style={{
                backgroundColor: '#059669',
                borderRadius: 12,
                paddingHorizontal: 16,
              }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              Add First Reminder
            </Button>
          </View>
        ) : (
          <View style={{ paddingVertical: 16 }}>
            {reminders.map((reminder) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                onToggle={toggleReminder}
                onDelete={deleteReminder}
                onEdit={editReminder}
              />
            ))}
          </View>
        )}

        {/* Notification Status */}
        {!notificationsEnabled && (
          <View
            style={{
              backgroundColor: '#fef3c7',
              padding: 16,
              margin: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#f59e0b',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="warning-outline" size={20} color="#f59e0b" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#92400e', marginLeft: 8 }}>
                Notifications Disabled
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#92400e', marginBottom: 12 }}>
              Enable notifications to receive health reminders. You can change this in your profile
              settings.
            </Text>
            <Button
              mode="outlined"
              onPress={() => router.push('/(root)/(tabs)/profile')}
              style={{ borderColor: '#f59e0b' }}
              labelStyle={{ color: '#f59e0b' }}
            >
              Go to Settings
            </Button>
          </View>
        )}
      </ScrollView>
    </>
  );
}
