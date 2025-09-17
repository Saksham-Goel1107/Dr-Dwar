import '@/global.css';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditBasicInfoScreen() {
  const { user } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load existing user data
    if (user?.unsafeMetadata) {
      const metadata = user.unsafeMetadata as {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: {
          line1?: string;
          line2?: string;
          city?: string;
          state?: string;
          pincode?: string;
        };
        emergencyContact?: {
          name?: string;
          relation?: string;
          phone?: string;
        };
      };
      setFirstName(typeof metadata.firstName === 'string' ? metadata.firstName : '');
      setLastName(typeof metadata.lastName === 'string' ? metadata.lastName : '');
      setDateOfBirth(typeof metadata.dateOfBirth === 'string' ? metadata.dateOfBirth : '');
      setGender(typeof metadata.gender === 'string' ? metadata.gender : '');
      setAddressLine1(typeof metadata.address?.line1 === 'string' ? metadata.address.line1 : '');
      setAddressLine2(typeof metadata.address?.line2 === 'string' ? metadata.address.line2 : '');
      setCity(typeof metadata.address?.city === 'string' ? metadata.address.city : '');
      setState(typeof metadata.address?.state === 'string' ? metadata.address.state : '');
      setPincode(typeof metadata.address?.pincode === 'string' ? metadata.address.pincode : '');
      setEmergencyName(typeof metadata.emergencyContact?.name === 'string' ? metadata.emergencyContact.name : '');
      setEmergencyRelation(typeof metadata.emergencyContact?.relation === 'string' ? metadata.emergencyContact.relation : '');
      setEmergencyPhone(typeof metadata.emergencyContact?.phone === 'string' ? metadata.emergencyContact.phone : '');

      // Set selected date for date picker
      if (metadata.dateOfBirth) {
        setSelectedDate(new Date(metadata.dateOfBirth));
      }
    }
  }, [user]);

  // Validation helpers
  const validateDateOfBirth = (dob: string) => {
    const date = new Date(dob);
    const maxDate = new Date(
      new Date().getFullYear() - 18,
      new Date().getMonth(),
      new Date().getDate(),
    );
    return date <= maxDate && date >= new Date(new Date().getFullYear() - 100, 0, 1);
  };

  const validatePincode = (pin: string) => /^\d{6}$/.test(pin);
  const validatePhone = (phone: string) => /^\d{10}$/.test(phone);

  const isFormValid = () => {
    return (
      firstName &&
      lastName &&
      dateOfBirth &&
      gender &&
      addressLine1 &&
      city &&
      state &&
      pincode &&
      emergencyName &&
      emergencyRelation &&
      emergencyPhone &&
      validateDateOfBirth(dateOfBirth) &&
      validatePincode(pincode) &&
      validatePhone(emergencyPhone)
    );
  };

  // Date picker handlers
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);

    // Format date as YYYY-MM-DD
    const formattedDate = currentDate.toISOString().split('T')[0];
    setDateOfBirth(formattedDate);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!isFormValid()) {
      setError('Please fill all required fields correctly.');
      return;
    }

    setLoading(true);
    try {
      await user?.update({
        unsafeMetadata: {
          role: 'user',
          firstName,
          lastName,
          dateOfBirth,
          gender,
          address: {
            line1: addressLine1,
            line2: addressLine2,
            city,
            state,
            pincode,
          },
          emergencyContact: {
            name: emergencyName,
            relation: emergencyRelation,
            phone: emergencyPhone,
          },
        },
      });

      router.back(); // Go back to previous screen
    } catch (err: any) {
      console.error('Error updating user metadata:', err);
      setError(
        err.errors?.[0]?.message ||
          'Failed to save information. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f7fafc' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-green-600 rounded-full items-center justify-center mb-4">
              <Ionicons name="create" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold mb-2" style={{ color: '#1a202c' }}>
              Edit Profile
            </Text>
            <Text className="text-center opacity-80" style={{ color: '#4a5568' }}>
              Update your personal information
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={20} color="#e53e3e" />
                <Text className="ml-2 font-medium" style={{ color: '#e53e3e' }}>{error}</Text>
              </View>
            </View>
          )}

          {/* Personal Info */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
                <Ionicons name="person" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>Personal Information</Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-lg">
              <TextInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person" size={20} color="#4a5568" />}
                  />
                }
              />
              <TextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person-outline" size={20} color="#4a5568" />}
                  />
                }
              />
              <TouchableOpacity
                onPress={showDatePickerModal}
                style={{
                  marginBottom: 16,
                  backgroundColor: '#f8fafc',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="calendar" size={20} color="#4a5568" style={{ marginRight: 12 }} />
                <Text
                  style={{
                    flex: 1,
                    color: dateOfBirth ? '#1a202c' : '#a0aec0',
                    fontSize: 16,
                  }}
                >
                  {dateOfBirth || 'Select Date of Birth'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#4a5568" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={
                    new Date(
                      new Date().getFullYear() - 18,
                      new Date().getMonth(),
                      new Date().getDate(),
                    )
                  }
                  minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)}
                />
              )}
              <Text style={{ color: '#1a202c', marginBottom: 12, fontSize: 18, fontWeight: '600' }}>
                Gender
              </Text>
              <View className="mb-4 flex-row justify-around">
                <TouchableOpacity
                  onPress={() => setGender('male')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: gender === 'male' ? '#008000' : '#f8fafc',
                    borderColor: gender === 'male' ? '#008000' : '#e2e8f0',
                    borderWidth: 2,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    minWidth: 100,
                    justifyContent: 'center',
                    shadowColor: gender === 'male' ? '#008000' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: gender === 'male' ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: gender === 'male' ? 4 : 2,
                  }}
                >
                  <Ionicons
                    name={gender === 'male' ? 'male' : 'male-outline'}
                    size={20}
                    color={gender === 'male' ? 'white' : '#4a5568'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{
                    color: gender === 'male' ? 'white' : '#1a202c',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setGender('female')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: gender === 'female' ? '#008000' : '#f8fafc',
                    borderColor: gender === 'female' ? '#008000' : '#e2e8f0',
                    borderWidth: 2,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    minWidth: 100,
                    justifyContent: 'center',
                    shadowColor: gender === 'female' ? '#008000' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: gender === 'female' ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: gender === 'female' ? 4 : 2,
                  }}
                >
                  <Ionicons
                    name={gender === 'female' ? 'female' : 'female-outline'}
                    size={20}
                    color={gender === 'female' ? 'white' : '#4a5568'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{
                    color: gender === 'female' ? 'white' : '#1a202c',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Other Gender Option */}
              <TouchableOpacity
                onPress={() => setGender('other')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: gender === 'other' ? '#008000' : '#f8fafc',
                  borderColor: gender === 'other' ? '#008000' : '#e2e8f0',
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: 'center',
                  shadowColor: gender === 'other' ? '#008000' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: gender === 'other' ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: gender === 'other' ? 4 : 2,
                }}
              >
                <Ionicons
                  name={gender === 'other' ? 'person' : 'person-outline'}
                  size={20}
                  color={gender === 'other' ? 'white' : '#4a5568'}
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  color: gender === 'other' ? 'white' : '#1a202c',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Address Info */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-green-600 rounded-full items-center justify-center mr-3">
                <Ionicons name="home" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>Address Information</Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-lg">
              <TextInput
                label="Address Line 1"
                value={addressLine1}
                onChangeText={setAddressLine1}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="home" size={20} color="#4a5568" />}
                  />
                }
              />
              <TextInput
                label="Address Line 2 (Optional)"
                value={addressLine2}
                onChangeText={setAddressLine2}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="home-outline" size={20} color="#4a5568" />}
                  />
                }
              />
              <View className="flex-row space-x-4">
                <TextInput
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  mode="outlined"
                  style={{ flex: 1, marginRight: 8, backgroundColor: '#f8fafc' }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#4a5568"
                  textColor="#1a202c"
                  placeholderTextColor="#a0aec0"
                  left={
                    <TextInput.Icon
                      icon={() => <Ionicons name="location" size={20} color="#4a5568" />}
                    />
                  }
                />
                <TextInput
                  label="State"
                  value={state}
                  onChangeText={setState}
                  mode="outlined"
                  style={{ flex: 1, marginLeft: 8, backgroundColor: '#f8fafc' }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#4a5568"
                  textColor="#1a202c"
                  placeholderTextColor="#a0aec0"
                  left={
                    <TextInput.Icon
                      icon={() => <Ionicons name="map" size={20} color="#4a5568" />}
                    />
                  }
                />
              </View>
              <TextInput
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                mode="outlined"
                keyboardType="numeric"
                maxLength={6}
                style={{ marginTop: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="pin" size={20} color="#4a5568" />}
                  />
                }
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-red-600 rounded-full items-center justify-center mr-3">
                <Ionicons name="call" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>Emergency Contact</Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-lg">
              <TextInput
                label="Full Name"
                value={emergencyName}
                onChangeText={setEmergencyName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person-circle" size={20} color="#4a5568" />}
                  />
                }
              />
              <TextInput
                label="Relationship"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="people" size={20} color="#4a5568" />}
                  />
                }
              />
              <TextInput
                label="Phone Number"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={10}
                style={{ backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon icon={() => <Ionicons name="call" size={20} color="#4a5568" />} />
                }
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-4 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#4a5568', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !isFormValid()}
              style={{
                flex: 1,
                backgroundColor: isFormValid() ? '#008000' : '#cbd5e0',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                shadowColor: '#008000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              {loading ? (
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Saving...</Text>
              ) : (
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-center opacity-80" style={{ color: '#4a5568', textAlign: 'center' }}>
            🔒 Your information is securely stored and protected
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
