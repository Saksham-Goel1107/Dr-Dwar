import '@/global.css';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditBasicInfoScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();

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
  const [networkStatus, setNetworkStatus] = React.useState<boolean | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!user?.id || !networkStatus || dataLoaded) return;

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/users/profile/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.profileData) {
          const profile = result.data.profileData;

          // Set form data from decrypted backend data
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setDateOfBirth(profile.dateOfBirth || '');
          setGender(profile.gender || '');
          setAddressLine1(profile.address?.line1 || '');
          setAddressLine2(profile.address?.line2 || '');
          setCity(profile.address?.city || '');
          setState(profile.address?.state || '');
          setPincode(profile.address?.pincode || '');
          setEmergencyName(profile.emergencyContact?.name || '');
          setEmergencyRelation(profile.emergencyContact?.relation || '');
          setEmergencyPhone(profile.emergencyContact?.phone || '');
          setDiseases(profile.diseases || '');
          setAllergies(profile.allergies || '');
          setMedicalNote(profile.medicalNote || '');
          setEmail(profile.email || '');

          // Set selected date for date picker
          if (profile.dateOfBirth) {
            setSelectedDate(new Date(profile.dateOfBirth));
          }

          setDataLoaded(true);
        }
      } else {
        console.error('Failed to load user profile from backend');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [user?.id, networkStatus, dataLoaded, getToken]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Custom network detection using NetInfo
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
      console.log('NetInfo status:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOnline: isConnected,
      });
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Alternative simple network check
  const simpleNetworkCheck = async () => {
    try {
      const state = await NetInfo.fetch();
      // Simple check: if connected to any network, assume internet access
      const isOnline = state.isConnected === true;
      console.log('Simple network check:', {
        isConnected: state.isConnected,
        type: state.type,
      });
      return isOnline;
    } catch (error) {
      console.error('Simple network check failed:', error);
      return false;
    }
  };

  // Use simple check as fallback
  React.useEffect(() => {
    const checkNetwork = async () => {
      const isOnline = await simpleNetworkCheck();
      if (networkStatus === null) {
        setNetworkStatus(isOnline);
      }
    };

    if (networkStatus === null) {
      checkNetwork();
    }
  }, [networkStatus]);

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

    // Validate required fields before submission
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !dateOfBirth ||
      !gender ||
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim() ||
      !emergencyName.trim() ||
      !emergencyRelation.trim() ||
      !emergencyPhone.trim()
    ) {
      setError('Please fill all required fields.');
      return;
    }

    // Validate date of birth
    if (!validateDateOfBirth(dateOfBirth)) {
      setError('Please enter a valid date of birth (between 18 and 100 years old).');
      return;
    }

    // Validate pincode
    if (!validatePincode(pincode.trim())) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }

    // Validate emergency phone
    if (!validatePhone(emergencyPhone.trim())) {
      setError('Please enter a valid 10-digit emergency phone number.');
      return;
    }

    setLoading(true);
    try {
      // Send updated data to backend (backend will encrypt and store)
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        setError('API URL not configured');
        return;
      }

      const userData = {
        userId: user?.id,
        userName: user?.username,
        phoneNumber: user?.phoneNumbers[0]?.phoneNumber,
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
        diseases: diseases.trim(),
        allergies: allergies.trim(),
        medicalNote: medicalNote.trim(),
        emergencyContact: {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        },
        email: email.trim() || undefined,
      };

      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Backend sync failed:', result);
        setError(result.message || 'Failed to save changes. Please try again.');
      } else {
        console.log('Profile updated successfully:', result);
        router.back(); // Go back to previous screen
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
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
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <Ionicons name="create" size={32} color="white" />
            </View>
            <Text className="mb-2 text-2xl font-bold" style={{ color: '#1a202c' }}>
              Edit Profile
            </Text>
            <Text className="text-center opacity-80" style={{ color: '#4a5568' }}>
              Update your personal information
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={20} color="#e53e3e" />
                <Text className="ml-2 font-medium" style={{ color: '#e53e3e' }}>
                  {error}
                </Text>
              </View>
            </View>
          )}

          {/* Personal Info */}
          <View className="mb-6">
            <View className="mb-4 flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <Ionicons name="person" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
                Personal Information
              </Text>
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
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-green-600">
                <Ionicons name="home" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
                Address Information
              </Text>
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
                  <TextInput.Icon icon={() => <Ionicons name="home" size={20} color="#4a5568" />} />
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
                  <TextInput.Icon icon={() => <Ionicons name="pin" size={20} color="#4a5568" />} />
                }
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-red-600">
                <Ionicons name="call" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
                Emergency Contact
              </Text>
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

          {/* Medical Info (Optional) */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <MaterialCommunityIcons name="medical-bag" size={16} color="white" />
              </View>
              <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
                Medical Information (Optional)
              </Text>
            </View>
            <View className="rounded-2xl bg-white p-6 shadow-lg">
              <TextInput
                label="Diseases (Optional)"
                value={diseases}
                onChangeText={setDiseases}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="virus" size={20} color="#4a5568" />}
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
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="allergy" size={20} color="#4a5568" />}
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
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                left={
                  <TextInput.Icon
                    icon={() => (
                      <MaterialCommunityIcons name="note-text" size={20} color="#4a5568" />
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
                mode="outlined"
                autoCapitalize="none"
                style={{ marginBottom: 16, backgroundColor: '#f8fafc' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                placeholderTextColor="#a0aec0"
                keyboardType="email-address"
                left={
                  <TextInput.Icon
                    icon={() => <MaterialCommunityIcons name="email" size={20} color="#4a5568" />}
                  />
                }
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mb-6 flex-row space-x-4">
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

            {networkStatus ? (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
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
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e2e8f0',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#4a5568', fontSize: 16, fontWeight: '600' }}>
                  You are offline
                </Text>
              </View>
            )}
          </View>

          <Text
            className="text-center opacity-80"
            style={{ color: '#4a5568', textAlign: 'center' }}
          >
            🔒 Your information is securely stored and protected
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
