import '@/global.css';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BasicInfoScreen() {
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
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNote, setMedicalNote] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already completed
    if (
      user?.unsafeMetadata?.firstName &&
      user?.unsafeMetadata?.lastName &&
      user?.unsafeMetadata?.dateOfBirth &&
      user?.unsafeMetadata?.gender
    ) {
      router.replace('/(root)/(tabs)/home');
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
    const minDate = new Date(new Date().getFullYear() - 100, 0, 1);
    return /^\d{4}-\d{2}-\d{2}$/.test(dob) && date >= minDate && date <= maxDate;
  };

  const validatePincode = (pin: string) => /^\d{6}$/.test(pin.replace(/\D/g, ''));

  const validatePhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ''));

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

  const isFormValid = () => {
    const valid =
      firstName.trim() &&
      lastName.trim() &&
      dateOfBirth &&
      gender &&
      addressLine1.trim() &&
      city.trim() &&
      state.trim() &&
      pincode.trim() &&
      emergencyName.trim() &&
      emergencyRelation.trim() &&
      emergencyPhone.trim() &&
      validateDateOfBirth(dateOfBirth) &&
      validatePincode(pincode.trim()) &&
      validatePhone(emergencyPhone.trim());
    console.log('Form validation:', {
      firstName: !!firstName.trim(),
      lastName: !!lastName.trim(),
      dateOfBirth: !!dateOfBirth,
      gender: !!gender,
      addressLine1: !!addressLine1.trim(),
      city: !!city.trim(),
      state: !!state.trim(),
      pincode: !!pincode.trim(),
      emergencyName: !!emergencyName.trim(),
      emergencyRelation: !!emergencyRelation.trim(),
      emergencyPhone: !!emergencyPhone.trim(),
      dateValid: validateDateOfBirth(dateOfBirth),
      pincodeValid: validatePincode(pincode.trim()),
      phoneValid: validatePhone(emergencyPhone.trim()),
      overall: valid,
    });
    return valid;
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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          gender,
          address: {
            line1: addressLine1.trim(),
            line2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          },
          emergencyContact: {
            name: emergencyName.trim(),
            relation: emergencyRelation.trim(),
            phone: emergencyPhone.trim(),
          },
          diseases: diseases.trim(),
          allergies: allergies.trim(),
          medicalNote: medicalNote.trim(),
          email: email.trim(),
        },
      });

      router.replace('/(root)/(tabs)/home');
    } catch (err: any) {
      console.error('Error updating user metadata:', err);
      setError(err.errors?.[0]?.message || 'Failed to save information. Please try again.');
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
          <View className="mb-8 items-center">
            <View
              className="mb-4 h-20 w-20 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: '#4a5568' }}
            >
              <MaterialCommunityIcons name="account-plus" size={40} color="#667eea" />
            </View>
            <Text className="mb-2 text-center text-3xl font-bold" style={{ color: '#1a202c' }}>
              Complete Your Profile
            </Text>
            <Text
              className="text-lg"
              style={{ color: '#1a202c', opacity: 0.9, textAlign: 'center' }}
            >
              Help us provide personalized healthcare services
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-6 rounded-xl bg-red-500 p-4 shadow-lg">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={24} color="white" />
                <Text className="ml-2 font-semibold text-white">{error}</Text>
              </View>
            </View>
          )}

          {/* Personal Info */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#4a5568' }}
              >
                <Ionicons name="person" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#1a202c' }}>
                Personal Information
              </Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-xl">
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
                    backgroundColor: gender === 'male' ? '#4a5568' : '#f0f9ff',
                    borderColor: gender === 'male' ? '#4a5568' : '#e2e8f0',
                    borderWidth: 2,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    minWidth: 120,
                    justifyContent: 'center',
                    shadowColor: gender === 'male' ? '#4a5568' : '#000',
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
                  <Text
                    style={{
                      color: gender === 'male' ? 'white' : '#1a202c',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setGender('female')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: gender === 'female' ? '#d53f8c' : '#fdf2f8',
                    borderColor: gender === 'female' ? '#d53f8c' : '#fce7f3',
                    borderWidth: 2,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    minWidth: 120,
                    justifyContent: 'center',
                    shadowColor: gender === 'female' ? '#d53f8c' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: gender === 'female' ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: gender === 'female' ? 4 : 2,
                  }}
                >
                  <Ionicons
                    name={gender === 'female' ? 'female' : 'female-outline'}
                    size={20}
                    color={gender === 'female' ? 'white' : '#d53f8c'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: gender === 'female' ? 'white' : '#1a202c',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
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
                  backgroundColor: gender === 'other' ? '#6b46c1' : '#f8fafc',
                  borderColor: gender === 'other' ? '#6b46c1' : '#e2e8f0',
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: 'center',
                  shadowColor: gender === 'other' ? '#6b46c1' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: gender === 'other' ? 0.3 : 0.1,
                  shadowRadius: 4,
                  elevation: gender === 'other' ? 4 : 2,
                }}
              >
                <Ionicons
                  name={gender === 'other' ? 'person' : 'person-outline'}
                  size={20}
                  color={gender === 'other' ? 'white' : '#6b46c1'}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: gender === 'other' ? 'white' : '#1a202c',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Address Info */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#38a169' }}
              >
                <Ionicons name="home" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#1a202c' }}>
                Address Information
              </Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-xl">
              <TextInput
                label="Address Line 1"
                value={addressLine1}
                onChangeText={setAddressLine1}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#38a169"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon icon={() => <Ionicons name="home" size={20} color="#38a169" />} />
                }
              />
              <TextInput
                label="Address Line 2 (Optional)"
                value={addressLine2}
                onChangeText={setAddressLine2}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#38a169"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="home-outline" size={20} color="#38a169" />}
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
                  activeOutlineColor="#38a169"
                  textColor="#1a202c"
                  placeholderTextColor="#a0aec0"
                  left={
                    <TextInput.Icon
                      icon={() => <Ionicons name="location" size={20} color="#38a169" />}
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
                  activeOutlineColor="#38a169"
                  textColor="#1a202c"
                  placeholderTextColor="#a0aec0"
                  left={
                    <TextInput.Icon
                      icon={() => <Ionicons name="map" size={20} color="#38a169" />}
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
                activeOutlineColor="#38a169"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon icon={() => <Ionicons name="pin" size={20} color="#38a169" />} />
                }
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#e53e3e' }}
              >
                <Ionicons name="call" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#1a202c' }}>
                Emergency Contact
              </Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-xl">
              <TextInput
                label="Full Name"
                value={emergencyName}
                onChangeText={setEmergencyName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#e53e3e"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person-circle" size={20} color="#e53e3e" />}
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
                activeOutlineColor="#e53e3e"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="people" size={20} color="#e53e3e" />}
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
                activeOutlineColor="#e53e3e"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon icon={() => <Ionicons name="call" size={20} color="#e53e3e" />} />
                }
              />
            </View>
          </View>

          {/* Medical Info (Optional) */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: '#3182ce' }}
              >
                <MaterialCommunityIcons name="medical-bag" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold" style={{ color: '#1a202c' }}>
                Medical Information (Optional)
              </Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-xl">
              <TextInput
                label="Diseases (Optional)"
                value={diseases}
                onChangeText={setDiseases}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#3182ce"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="virus" size={20} color="#3182ce" />}
                  />
                }
              />
              <TextInput
                label="Allergies (Optional)"
                value={allergies}
                onChangeText={setAllergies}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#3182ce"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="allergy" size={20} color="#3182ce" />}
                  />
                }
              />
              <TextInput
                label="Medical History / Note (Optional)"
                value={medicalNote}
                onChangeText={setMedicalNote}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#3182ce"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons name="note-text" size={20} color="#3182ce" />
                    )}
                  />
                }
                multiline
                numberOfLines={3}
              />
              <TextInput
                label="Email (Optional)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#3182ce"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                keyboardType="email-address"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="email" size={20} color="#3182ce" />}
                  />
                }
              />
            </View>
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !isFormValid()}
            style={{
              borderRadius: 25,
              paddingVertical: 12,
              backgroundColor: isFormValid() ? '#008000' : '#cbd5e0',
              shadowColor: '#4a5568',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>

          <Text className="mt-6" style={{ color: '#1a202c', opacity: 0.8, textAlign: 'center' }}>
            🔒 Your information is securely stored and protected
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
