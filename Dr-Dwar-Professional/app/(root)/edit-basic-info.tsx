import '@/global.css';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfessionalInfoScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Get role from Clerk metadata
  const userRole = user?.unsafeMetadata?.role as string;
  const isProfessional = userRole === 'Doctor' || userRole === 'PharmaCist';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Step 2: Address Information
  const [permanentAddressLine1, setPermanentAddressLine1] = useState('');
  const [permanentAddressLine2, setPermanentAddressLine2] = useState('');
  const [permanentCity, setPermanentCity] = useState('');
  const [permanentState, setPermanentState] = useState('');
  const [permanentPincode, setPermanentPincode] = useState('');
  const [currentAddressLine1, setCurrentAddressLine1] = useState('');
  const [currentAddressLine2, setCurrentAddressLine2] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');

  // Step 3: Family & Emergency Contact
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');

  // Step 4: Educational Qualifications
  const [educationalQualifications, setEducationalQualifications] = useState<
    {
      degree: string;
      institution: string;
      yearOfCompletion: string;
      percentage: string;
      board: string;
    }[]
  >([]);

  // Step 5: Professional Details (Role-specific)
  // Doctor fields
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [licenseIssuingAuthority, setLicenseIssuingAuthority] = useState('');
  const [licenseIssueDate, setLicenseIssueDate] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [subSpecialization, setSubSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [councilRegistrationNumber, setCouncilRegistrationNumber] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');

  // Pharmacist fields
  const [pharmacyLicenseNumber, setPharmacyLicenseNumber] = useState('');
  const [pharmacyLicenseIssuingAuthority, setPharmacyLicenseIssuingAuthority] = useState('');
  const [pharmacyLicenseIssueDate, setPharmacyLicenseIssueDate] = useState('');
  const [pharmacyLicenseExpiryDate, setPharmacyLicenseExpiryDate] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyOwnershipType, setPharmacyOwnershipType] = useState('');
  const [yearsOfPharmacyExperience, setYearsOfPharmacyExperience] = useState('');
  const [pharmacyCouncil, setPharmacyCouncil] = useState('');
  const [pharmacyCouncilRegistrationNumber, setPharmacyCouncilRegistrationNumber] = useState('');

  // Step 6: Work Experience
  const [workExperience, setWorkExperience] = useState<
    {
      organization: string;
      position: string;
      fromDate: string;
      toDate: string;
      currentlyWorking: boolean;
      responsibilities: string;
    }[]
  >([]);

  // Step 7: Professional Memberships & Certifications
  const [professionalMemberships, setProfessionalMemberships] = useState<
    {
      organization: string;
      membershipNumber: string;
      validFrom: string;
      validTo: string;
    }[]
  >([]);

  // Step 8: Background Check
  const [criminalRecord, setCriminalRecord] = useState(false);
  const [criminalRecordDetails, setCriminalRecordDetails] = useState('');
  const [malpracticeHistory, setMalpracticeHistory] = useState(false);
  const [malpracticeDetails, setMalpracticeDetails] = useState('');

  // Step 9: References
  const [professionalReferences, setProfessionalReferences] = useState<
    {
      name: string;
      designation: string;
      organization: string;
      phone: string;
      email: string;
      relationship: string;
    }[]
  >([]);

  useEffect(() => {
    if (!user?.id || dataLoadedRef.current) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!apiUrl) {
          console.warn('EXPO_PUBLIC_API_URL not configured');
          setError('API configuration missing');
          setLoading(false);
          return;
        }

        const token = await getToken();
        const response = await fetch(`${apiUrl}/api/professionals/by-userid/${user.id}`, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'x-react-native-app': 'DrDwar',
            'User-Agent': 'DrDwar-Mobile-App/1.0',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load professional data');
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        // The response has { success: true, data: professionalData }
        const professionalData = data.data;

        if (!professionalData) {
          console.error('No professional data found in response');
          setError('No professional data found');
          return;
        }
        setFirstName(professionalData.firstName || '');
        setLastName(professionalData.lastName || '');
        setDateOfBirth(professionalData.dateOfBirth || '');
        setGender(professionalData.gender || '');
        setBloodGroup(professionalData.bloodGroup || '');
        setMaritalStatus(professionalData.maritalStatus || '');
        setNationality(professionalData.nationality || '');
        setAadharNumber(professionalData.aadharNumber || '');
        setPanNumber(professionalData.panNumber || '');

        setPermanentAddressLine1(professionalData.permanentAddressLine1 || '');
        setPermanentAddressLine2(professionalData.permanentAddressLine2 || '');
        setPermanentCity(professionalData.permanentCity || '');
        setPermanentState(professionalData.permanentState || '');
        setPermanentPincode(professionalData.permanentPincode || '');
        setCurrentAddressLine1(professionalData.currentAddressLine1 || '');
        setCurrentAddressLine2(professionalData.currentAddressLine2 || '');
        setCurrentCity(professionalData.currentCity || '');
        setCurrentState(professionalData.currentState || '');
        setCurrentPincode(professionalData.currentPincode || '');

        setFatherName(professionalData.fatherName || '');
        setMotherName(professionalData.motherName || '');
        setSpouseName(professionalData.spouseName || '');
        setEmergencyName(professionalData.emergencyName || '');
        setEmergencyRelation(professionalData.emergencyRelation || '');
        setEmergencyPhone(professionalData.emergencyPhone || '');
        setEmergencyEmail(professionalData.emergencyEmail || '');

        // Handle educational qualifications with better error handling
        try {
          const eduQualifications = professionalData.educationalQualifications;
          console.log('Raw educational qualifications:', eduQualifications);

          if (eduQualifications) {
            if (typeof eduQualifications === 'string') {
              setEducationalQualifications(JSON.parse(eduQualifications));
            } else if (Array.isArray(eduQualifications)) {
              setEducationalQualifications(eduQualifications);
            } else {
              console.warn('Educational qualifications in unexpected format:', eduQualifications);
              setEducationalQualifications([]);
            }
          } else {
            setEducationalQualifications([]);
          }
        } catch (error) {
          console.error('Error parsing educational qualifications:', error);
          setEducationalQualifications([]);
        }

        if (userRole === 'Doctor') {
          setMedicalLicenseNumber(professionalData.medicalLicenseNumber || '');
          setLicenseIssuingAuthority(professionalData.licenseIssuingAuthority || '');
          setLicenseIssueDate(professionalData.licenseIssueDate || '');
          setLicenseExpiryDate(professionalData.licenseExpiryDate || '');
          setSpecialization(professionalData.specialization || '');
          setSubSpecialization(professionalData.subSpecialization || '');
          setYearsOfExperience(professionalData.yearsOfExperience?.toString() || '');
          setMedicalCouncil(professionalData.medicalCouncil || '');
          setCouncilRegistrationNumber(professionalData.councilRegistrationNumber || '');
          setHospitalAffiliation(professionalData.hospitalAffiliation || '');
          setCurrentPosition(professionalData.currentPosition || '');
        } else if (userRole === 'PharmaCist') {
          setPharmacyLicenseNumber(professionalData.pharmacyLicenseNumber || '');
          setPharmacyLicenseIssuingAuthority(
            professionalData.pharmacyLicenseIssuingAuthority || '',
          );
          setPharmacyLicenseIssueDate(professionalData.pharmacyLicenseIssueDate || '');
          setPharmacyLicenseExpiryDate(professionalData.pharmacyLicenseExpiryDate || '');
          setPharmacyName(professionalData.pharmacyName || '');
          setPharmacyAddress(professionalData.pharmacyAddress || '');
          setPharmacyOwnershipType(professionalData.pharmacyOwnershipType || '');
          setYearsOfPharmacyExperience(
            professionalData.yearsOfPharmacyExperience?.toString() || '',
          );
          setPharmacyCouncil(professionalData.pharmacyCouncil || '');
          setPharmacyCouncilRegistrationNumber(
            professionalData.pharmacyCouncilRegistrationNumber || '',
          );
        }

        // Handle work experience with better error handling
        try {
          const workExp = professionalData.workExperience;
          if (workExp) {
            if (typeof workExp === 'string') {
              setWorkExperience(JSON.parse(workExp));
            } else if (Array.isArray(workExp)) {
              setWorkExperience(workExp);
            } else {
              setWorkExperience([]);
            }
          } else {
            setWorkExperience([]);
          }
        } catch (error) {
          console.error('Error parsing work experience:', error);
          setWorkExperience([]);
        }

        // Handle professional memberships with better error handling
        try {
          const profMemberships = professionalData.professionalMemberships;
          if (profMemberships) {
            if (typeof profMemberships === 'string') {
              setProfessionalMemberships(JSON.parse(profMemberships));
            } else if (Array.isArray(profMemberships)) {
              setProfessionalMemberships(profMemberships);
            } else {
              setProfessionalMemberships([]);
            }
          } else {
            setProfessionalMemberships([]);
          }
        } catch (error) {
          console.error('Error parsing professional memberships:', error);
          setProfessionalMemberships([]);
        }
        setCriminalRecord(professionalData.criminalRecord || false);
        setCriminalRecordDetails(professionalData.criminalRecordDetails || '');
        setMalpracticeHistory(professionalData.malpracticeHistory || false);
        setMalpracticeDetails(professionalData.malpracticeDetails || '');
        // Handle professional references with better error handling
        try {
          const profReferences = professionalData.professionalReferences;
          if (profReferences) {
            if (typeof profReferences === 'string') {
              setProfessionalReferences(JSON.parse(profReferences));
            } else if (Array.isArray(profReferences)) {
              setProfessionalReferences(profReferences);
            } else {
              setProfessionalReferences([]);
            }
          } else {
            setProfessionalReferences([]);
          }
        } catch (error) {
          console.error('Error parsing professional references:', error);
          setProfessionalReferences([]);
        }
        dataLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading professional data:', error);
        setError('Failed to load professional data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userRole]);

  // Redirect if not a professional
  useEffect(() => {
    if (!isProfessional) {
      Alert.alert('Access Denied', 'This page is only for verified healthcare professionals.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/Sign-in') },
      ]);
    }
  }, [isProfessional]);

  const renderStepIndicator = () => (
    <View className="mb-8 flex-row justify-between">
      {Array.from({ length: 9 }, (_, i) => (
        <View key={i + 1} className="flex-1 items-center">
          <TouchableOpacity
            onPress={() => setCurrentStep(i + 1)}
            className={`mb-2 h-10 w-10 items-center justify-center rounded-full ${
              currentStep === i + 1
                ? 'bg-blue-500'
                : currentStep > i + 1
                  ? 'bg-green-500'
                  : 'bg-gray-300'
            }`}
          >
            <Text className={`font-bold ${currentStep >= i + 1 ? 'text-white' : 'text-gray-600'}`}>
              {i + 1}
            </Text>
          </TouchableOpacity>
          {i < 8 && (
            <View
              className={`h-1 flex-1 ${currentStep > i + 1 ? 'bg-green-500' : 'bg-gray-300'}`}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalInformation();
      case 2:
        return renderAddressInformation();
      case 3:
        return renderFamilyEmergencyContact();
      case 4:
        return renderEducationalQualifications();
      case 5:
        return renderProfessionalDetails();
      case 6:
        return renderWorkExperience();
      case 7:
        return renderProfessionalMemberships();
      case 8:
        return renderBackgroundCheck();
      case 9:
        return renderReferences();
      default:
        return null;
    }
  };

  const renderPersonalInformation = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Personal Information
      </Text>

      <View className="space-y-4">
        <View className="flex-row space-x-2">
          <TextInput
            label="First Name"
            value={firstName}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
          <TextInput
            label="Last Name"
            value={lastName}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        </View>

        <TextInput
          label="Date of Birth"
          value={dateOfBirth}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <View className="flex-row space-x-2">
          <TextInput
            label="Gender"
            value={gender}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
          <TextInput
            label="Blood Group"
            value={bloodGroup}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        </View>

        <View className="flex-row space-x-2">
          <TextInput
            label="Marital Status"
            value={maritalStatus}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
          <TextInput
            label="Nationality"
            value={nationality}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        </View>

        <TextInput
          label="Aadhar Number"
          value={aadharNumber}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="PAN Number"
          value={panNumber}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />
      </View>
    </View>
  );

  const renderAddressInformation = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Address Information
      </Text>

      <View className="space-y-4">
        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Permanent Address
        </Text>

        <TextInput
          label="Address Line 1"
          value={permanentAddressLine1}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Address Line 2"
          value={permanentAddressLine2}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <View className="flex-row space-x-2">
          <TextInput
            label="City"
            value={permanentCity}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
          <TextInput
            label="State"
            value={permanentState}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        </View>

        <TextInput
          label="Pincode"
          value={permanentPincode}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <Divider style={{ marginVertical: 16 }} />

        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Current Address
        </Text>

        <TextInput
          label="Address Line 1"
          value={currentAddressLine1}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Address Line 2"
          value={currentAddressLine2}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <View className="flex-row space-x-2">
          <TextInput
            label="City"
            value={currentCity}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
          <TextInput
            label="State"
            value={currentState}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        </View>

        <TextInput
          label="Pincode"
          value={currentPincode}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />
      </View>
    </View>
  );

  const renderFamilyEmergencyContact = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Family & Emergency Contact
      </Text>

      <View className="space-y-4">
        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Family Information
        </Text>

        <TextInput
          label="Father's Name"
          value={fatherName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Mother's Name"
          value={motherName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        {maritalStatus === 'Married' && (
          <TextInput
            label="Spouse's Name"
            value={spouseName}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
            disabled
          />
        )}

        <Divider style={{ marginVertical: 16 }} />

        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Emergency Contact
        </Text>

        <TextInput
          label="Contact Name"
          value={emergencyName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Relationship"
          value={emergencyRelation}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Phone Number"
          value={emergencyPhone}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />

        <TextInput
          label="Email Address"
          value={emergencyEmail}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
          disabled
        />
      </View>
    </View>
  );

  const renderEducationalQualifications = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Educational Qualifications
      </Text>

      <View className="space-y-4">
        {educationalQualifications.length === 0 ? (
          <View className="rounded-lg border border-gray-300 p-4">
            <Text className="text-center text-gray-600">No educational qualifications found</Text>
          </View>
        ) : (
          educationalQualifications.map((qualification, index) => (
            <View key={index} className="space-y-2 rounded-lg border border-gray-300 p-4">
              <Text className="font-semibold text-gray-700">Qualification {index + 1}</Text>

              <TextInput
                label="Degree/Qualification"
                value={qualification.degree}
                mode="outlined"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />

              <TextInput
                label="Institution/University"
                value={qualification.institution}
                mode="outlined"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />

              <View className="flex-row space-x-2">
                <TextInput
                  label="Year of Completion"
                  value={qualification.yearOfCompletion}
                  mode="outlined"
                  className="flex-1"
                  style={{ backgroundColor: '#ffffff' }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#4a5568"
                  textColor="#1a202c"
                  disabled
                />
                <TextInput
                  label="Percentage/CGPA"
                  value={qualification.percentage}
                  mode="outlined"
                  className="flex-1"
                  style={{ backgroundColor: '#ffffff' }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#4a5568"
                  textColor="#1a202c"
                  disabled
                />
              </View>

              <TextInput
                label="Board/University"
                value={qualification.board}
                mode="outlined"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>
          ))
        )}
      </View>
    </View>
  );

  const renderProfessionalDetails = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Professional Details
      </Text>

      <View className="space-y-4">
        {userRole === 'Doctor' && (
          <>
            <TextInput
              label="Medical License Number"
              value={medicalLicenseNumber}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="License Issuing Authority"
              value={licenseIssuingAuthority}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="License Issue Date"
                value={licenseIssueDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
              <TextInput
                label="License Expiry Date"
                value={licenseExpiryDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>

            <TextInput
              label="Specialization"
              value={specialization}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Sub-Specialization"
              value={subSpecialization}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Years of Experience"
              value={yearsOfExperience}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Medical Council"
              value={medicalCouncil}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Council Registration Number"
              value={councilRegistrationNumber}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Hospital Affiliation"
              value={hospitalAffiliation}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Current Position"
              value={currentPosition}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          </>
        )}

        {userRole === 'PharmaCist' && (
          <>
            <TextInput
              label="Pharmacy License Number"
              value={pharmacyLicenseNumber}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="License Issuing Authority"
              value={pharmacyLicenseIssuingAuthority}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="License Issue Date"
                value={pharmacyLicenseIssueDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
              <TextInput
                label="License Expiry Date"
                value={pharmacyLicenseExpiryDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>

            <TextInput
              label="Pharmacy Name"
              value={pharmacyName}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Pharmacy Address"
              value={pharmacyAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Ownership Type"
              value={pharmacyOwnershipType}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Years of Experience"
              value={yearsOfPharmacyExperience}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Pharmacy Council"
              value={pharmacyCouncil}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Council Registration Number"
              value={pharmacyCouncilRegistrationNumber}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          </>
        )}
      </View>
    </View>
  );

  const renderWorkExperience = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Work Experience
      </Text>

      <View className="space-y-4">
        {workExperience.map((experience, index) => (
          <View key={index} className="space-y-2 rounded-lg border border-gray-300 p-4">
            <Text className="font-semibold text-gray-700">Experience {index + 1}</Text>

            <TextInput
              label="Organization"
              value={experience.organization}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Position"
              value={experience.position}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="From Date"
                value={experience.fromDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
              <TextInput
                label="To Date"
                value={experience.currentlyWorking ? 'Currently Working' : experience.toDate}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>

            <TextInput
              label="Responsibilities"
              value={experience.responsibilities}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderProfessionalMemberships = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Professional Memberships & Certifications
      </Text>

      <View className="space-y-4">
        {professionalMemberships.map((membership, index) => (
          <View key={index} className="space-y-2 rounded-lg border border-gray-300 p-4">
            <Text className="font-semibold text-gray-700">Membership {index + 1}</Text>

            <TextInput
              label="Organization"
              value={membership.organization}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Membership Number"
              value={membership.membershipNumber}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="Valid From"
                value={membership.validFrom}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
              <TextInput
                label="Valid To"
                value={membership.validTo}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderBackgroundCheck = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Background Check
      </Text>

      <View className="space-y-4">
        <View className="space-y-2">
          <Text className="text-base font-medium" style={{ color: '#1a202c' }}>
            Criminal Record History: {criminalRecord ? 'Yes' : 'No'}
          </Text>
          {criminalRecord && (
            <TextInput
              label="Criminal Record Details"
              value={criminalRecordDetails}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          )}
        </View>

        <View className="space-y-2">
          <Text className="text-base font-medium" style={{ color: '#1a202c' }}>
            Malpractice History: {malpracticeHistory ? 'Yes' : 'No'}
          </Text>
          {malpracticeHistory && (
            <TextInput
              label="Malpractice Details"
              value={malpracticeDetails}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderReferences = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Professional References
      </Text>

      <View className="space-y-4">
        {professionalReferences.map((reference, index) => (
          <View key={index} className="space-y-2 rounded-lg border border-gray-300 p-4">
            <Text className="font-semibold text-gray-700">Reference {index + 1}</Text>

            <TextInput
              label="Name"
              value={reference.name}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Designation"
              value={reference.designation}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <TextInput
              label="Organization"
              value={reference.organization}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="Phone"
                value={reference.phone}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
              <TextInput
                label="Email"
                value={reference.email}
                mode="outlined"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
                disabled
              />
            </View>

            <TextInput
              label="Relationship"
              value={reference.relationship}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
              disabled
            />
          </View>
        ))}
      </View>
    </View>
  );

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!isProfessional) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-center text-lg font-semibold" style={{ color: '#e53e3e' }}>
          Access Denied: This page is only for verified healthcare professionals.
        </Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-center text-lg font-semibold" style={{ color: '#1a202c' }}>
          Loading professional information...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
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
              <MaterialCommunityIcons name="account-eye" size={40} color="#667eea" />
            </View>
            <Text className="mb-2 text-center text-3xl font-bold" style={{ color: '#1a202c' }}>
              Professional Information
            </Text>
            <Text
              className="text-lg"
              style={{ color: '#1a202c', opacity: 0.9, textAlign: 'center' }}
            >
              View your {userRole === 'Doctor' ? 'Medical' : 'Pharmacy'} Professional Details
            </Text>
          </View>

          {/* Support Contact Note */}
          <View className="mb-6 rounded-xl bg-blue-50 p-4 shadow-lg">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <Text style={{ color:'#000000',fontWeight:'bold' }} className="ml-2">
                Need to update your information?
              </Text>
            </View>
            <Text style={{ color:'#000000' }} className="mt-2">
              Please contact our support team to make changes to your professional information.
            </Text>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Error Message */}
          {error && (
            <View className="mb-6 rounded-xl bg-red-500 p-4 shadow-lg">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={24} color="white" />
                <Text className="ml-2 font-semibold text-white">{error}</Text>
              </View>
            </View>
          )}

          {/* Step Content */}
          <View className="mb-8">{renderStepContent()}</View>

          {/* Navigation Buttons */}
          <View className="mb-8 flex-row justify-between">
            {currentStep > 1 && (
              <Button
                mode="outlined"
                onPress={handleBack}
                style={{
                  flex: 1,
                  marginRight: 8,
                  borderColor: '#4a5568',
                }}
                labelStyle={{ color: '#4a5568' }}
              >
                Back
              </Button>
            )}

            {currentStep < 9 ? (
              <Button
                mode="contained"
                onPress={handleNext}
                style={{
                  flex: 1,
                  marginLeft: currentStep > 1 ? 8 : 0,
                  backgroundColor: '#4a5568',
                }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => router.replace('/(root)/(tabs)/home')}
                style={{
                  flex: 1,
                  marginLeft: currentStep > 1 ? 8 : 0,
                  backgroundColor: '#10b981',
                }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Back to Home
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
