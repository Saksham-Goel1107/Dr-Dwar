import '@/global.css';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

export default function BasicInfoScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Step management
  const [step, setStep] = useState(1); // 1..3

  // Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');

  // Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Emergency
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Medical (optional)
  const [diseases, setDiseases] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNote, setMedicalNote] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((s) => {
      const isConnected = s.isConnected && s.isInternetReachable;
      setNetworkStatus(isConnected);
    });
    NetInfo.fetch().then((s) => setNetworkStatus(s.isConnected && s.isInternetReachable));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.unsafeMetadata?.basicInfoCompleted) {
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
  const showDatePickerModal = () => setShowDatePicker(true);
  const onDateChange = (event: any, selected?: Date) => {
    const current = selected || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(current);
    setDateOfBirth(current.toISOString().split('T')[0]);
  };

  // Step-level validators
  const isStep1Valid = () =>
    firstName.trim() &&
    lastName.trim() &&
    dateOfBirth &&
    gender &&
    validateDateOfBirth(dateOfBirth);
  const isStep2Valid = () =>
    addressLine1.trim() &&
    city.trim() &&
    state.trim() &&
    validatePincode(pincode.trim()) &&
    emergencyName.trim() &&
    emergencyRelation.trim() &&
    validatePhone(emergencyPhone.trim());
  // Step 3 is mostly optional; always valid

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!isStep1Valid()) return setError('Please complete personal information correctly.');
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!isStep2Valid())
        return setError('Please complete address & emergency contact correctly.');
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!networkStatus) return setError('No internet connection.');

    // final validation: ensure step1 and step2 are valid (user might have jumped)
    if (!isStep1Valid() || !isStep2Valid())
      return setError('Please complete required fields before submitting.');

    setLoading(true);
    try {
      const userData = {
        userId: user?.id,
        userName: user?.username,
        phoneNumber: user?.phoneNumbers?.[0]?.phoneNumber,
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

      const clerkData = { basicInfoCompleted: true, role: 'User' };
      await user?.update({ unsafeMetadata: clerkData });

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        console.warn('EXPO_PUBLIC_API_URL not configured, skipping backend sync');
        router.replace('/(root)/(tabs)/home');
        return;
      }

      const token = await getToken();
      const resp = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!resp.ok) console.warn('Backend sync failed', await resp.text());
      router.replace('/(root)/(tabs)/home');
    } catch (err: any) {
      console.error(err);
      setError('Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Small UI pieces
  const renderProgress = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 6,
            backgroundColor: i <= step ? '#2563eb' : '#e6eefc',
          }}
        />
      ))}
    </View>
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 12, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                height: 72,
                width: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0f7ff',
              }}
            >
              <MaterialCommunityIcons name="account-plus" size={34} color="#2563eb" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', marginTop: 12, color: '#0f172a' }}>
              Complete your profile
            </Text>
            <Text style={{ color: '#334155', marginTop: 6, textAlign: 'center' }}>
              We&apos;ll ask a few details across 3 steps. You can go back and edit at any time.
            </Text>
          </View>

          {renderProgress()}

          {/* Error */}
          {error ? (
            <View
              style={{
                backgroundColor: '#fee2e2',
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning" size={20} color="#b91c1c" />
                <Text style={{ color: '#b91c1c', marginLeft: 8, fontWeight: '600' }}>{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Step content */}
          {step === 1 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0f172a' }}>
                Personal information
              </Text>
              <TextInput
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person" size={20} color="#2563eb" />}
                  />
                }
              />
              <TextInput
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person-outline" size={20} color="#2563eb" />}
                  />
                }
              />

              <TouchableOpacity
                onPress={showDatePickerModal}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e6eefc',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="calendar" size={18} color="#2563eb" style={{ marginRight: 10 }} />
                <Text style={{ color: dateOfBirth ? '#0f172a' : '#94a3b8' }}>
                  {dateOfBirth || 'Select date of birth'}
                </Text>
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

              <Text style={{ marginBottom: 8, fontWeight: '600', color: '#0f172a' }}>Gender</Text>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
              >
                {['male', 'female', 'other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={{
                      flex: 1,
                      marginHorizontal: 4,
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: gender === g ? '#2563eb' : '#e6eefc',
                      backgroundColor: gender === g ? '#eff6ff' : '#fff',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: '#0f172a', fontWeight: '600', textTransform: 'capitalize' }}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0f172a' }}>
                Address & Emergency
              </Text>
              <TextInput
                label="Address line 1"
                value={addressLine1}
                onChangeText={setAddressLine1}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
                left={
                  <TextInput.Icon icon={() => <Ionicons name="home" size={20} color="#0ea5e9" />} />
                }
              />
              <TextInput
                label="Address line 2 (optional)"
                value={addressLine2}
                onChangeText={setAddressLine2}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TextInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    mode="outlined"
                    style={{ backgroundColor: '#ffffff' }}
                    textColor="#1a202c"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="State"
                    value={state}
                    onChangeText={setState}
                    mode="outlined"
                    style={{ backgroundColor: '#ffffff' }}
                    textColor="#1a202c"
                  />
                </View>
              </View>
              <TextInput
                label="Pincode"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
                mode="outlined"
                style={{ marginTop: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />

              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 }} />

              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#0f172a' }}>
                Emergency contact
              </Text>
              <TextInput
                label="Full name"
                value={emergencyName}
                onChangeText={setEmergencyName}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
                left={
                  <TextInput.Icon
                    icon={() => <Ionicons name="person-circle" size={20} color="#ef4444" />}
                  />
                }
              />
              <TextInput
                label="Relationship"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
              <TextInput
                label="Phone"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
                maxLength={10}
                mode="outlined"
                style={{ backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
            </View>
          )}

          {step === 3 && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#0f172a' }}>
                Medical (optional) & Review
              </Text>
              <TextInput
                label="Diseases (optional)"
                value={diseases}
                onChangeText={setDiseases}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
              <TextInput
                label="Allergies (optional)"
                value={allergies}
                onChangeText={setAllergies}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
              <TextInput
                label="Medical note (optional)"
                value={medicalNote}
                onChangeText={setMedicalNote}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 12, backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />
              <TextInput
                label="Email (optional)"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                style={{ backgroundColor: '#ffffff' }}
                textColor="#1a202c"
              />

              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 }} />
              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#0f172a' }}>Summary</Text>
              <Text style={{ color: '#334155', marginBottom: 6 }}>
                {firstName} {lastName} • {gender}
              </Text>
              <Text style={{ color: '#334155', marginBottom: 6 }}>
                {addressLine1}
                {addressLine2 ? ', ' + addressLine2 : ''} • {city}, {state} • {pincode}
              </Text>
              <Text style={{ color: '#334155', marginBottom: 6 }}>
                Emergency: {emergencyName} ({emergencyRelation}) • {emergencyPhone}
              </Text>
            </View>
          )}

          {/* Navigation */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: step === 1 ? 'flex-end' : 'space-between',
              marginTop: 18,
            }}
          >
            {step > 1 && (
              <Button
                mode="outlined"
                onPress={handleBack}
                disabled={loading}
                style={{ borderColor: '#cbd5e1' }}
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                mode="contained"
                onPress={handleNext}
                loading={loading}
                style={{ backgroundColor: '#2563eb' }}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={{ backgroundColor: '#0ea5e9' }}
              >
                {loading ? 'Saving...' : 'Save & Finish'}
              </Button>
            )}
          </View>

          <Text style={{ marginTop: 14, textAlign: 'center', color: '#94a3b8' }}>
            🔒 Your information is securely stored
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
