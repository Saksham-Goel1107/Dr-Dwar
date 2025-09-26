import '@/global.css';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfessionalRegistrationScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Get role from Clerk metadata
  const userRole = user?.unsafeMetadata?.role as string;
  const isProfessional = userRole === 'Doctor' || userRole === 'PharmaCist';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [nationality, setNationality] = useState('Indian');
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
  >([{ degree: '', institution: '', yearOfCompletion: '', percentage: '', board: '' }]);

  // Step 5: Professional Details (Role-specific)
  // Doctor fields
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState('');
  const [licenseIssuingAuthority, setLicenseIssuingAuthority] = useState('');
  const [licenseIssueDate, setLicenseIssueDate] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [selectedLicenseIssueDate, setSelectedLicenseIssueDate] = useState(new Date());
  const [showLicenseIssueDatePicker, setShowLicenseIssueDatePicker] = useState(false);
  const [selectedLicenseExpiryDate, setSelectedLicenseExpiryDate] = useState(new Date());
  const [showLicenseExpiryDatePicker, setShowLicenseExpiryDatePicker] = useState(false);
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
  const [selectedPharmacyLicenseIssueDate, setSelectedPharmacyLicenseIssueDate] = useState(
    new Date(),
  );
  const [showPharmacyLicenseIssueDatePicker, setShowPharmacyLicenseIssueDatePicker] =
    useState(false);
  const [selectedPharmacyLicenseExpiryDate, setSelectedPharmacyLicenseExpiryDate] = useState(
    new Date(),
  );
  const [showPharmacyLicenseExpiryDatePicker, setShowPharmacyLicenseExpiryDatePicker] =
    useState(false);
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
  >([
    {
      organization: '',
      position: '',
      fromDate: '',
      toDate: '',
      currentlyWorking: false,
      responsibilities: '',
    },
  ]);

  // Work experience date picker states
  const [workExpDatePickerIndex, setWorkExpDatePickerIndex] = useState<number | null>(null);
  const [workExpDatePickerType, setWorkExpDatePickerType] = useState<'from' | 'to' | null>(null);
  const [showWorkExpDatePicker, setShowWorkExpDatePicker] = useState(false);
  const [selectedWorkExpDate, setSelectedWorkExpDate] = useState(new Date());

  // Professional Memberships date picker states
  const [membershipDatePickerIndex, setMembershipDatePickerIndex] = useState<number | null>(null);
  const [membershipDatePickerType, setMembershipDatePickerType] = useState<'from' | 'to' | null>(
    null,
  );
  const [showMembershipDatePicker, setShowMembershipDatePicker] = useState(false);
  const [selectedMembershipDate, setSelectedMembershipDate] = useState(new Date());

  // Step 7: Professional Memberships & Certifications
  const [professionalMemberships, setProfessionalMemberships] = useState<
    {
      organization: string;
      membershipNumber: string;
      validFrom: string;
      validTo: string;
    }[]
  >([{ organization: '', membershipNumber: '', validFrom: '', validTo: '' }]);

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
  >([{ name: '', designation: '', organization: '', phone: '', email: '', relationship: '' }]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.unsafeMetadata?.basicInfoCompleted) {
      router.replace('/(root)/(tabs)/home');
    }
  }, [user]);

  // Redirect if not a professional
  useEffect(() => {
    if (!isProfessional) {
      Alert.alert(
        'Access Denied',
        'This registration is only for verified healthcare professionals.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/Sign-in') }],
      );
    }
  }, [isProfessional]);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const savedData = await AsyncStorage.getItem('professionalRegistrationProgress');
        if (savedData) {
          const formData = JSON.parse(savedData);
          setCurrentStep(formData.currentStep);
          setFirstName(formData.firstName);
          setLastName(formData.lastName);
          setDateOfBirth(formData.dateOfBirth);
          setSelectedDate(new Date(formData.selectedDate));
          setShowDatePicker(formData.showDatePicker);
          setGender(formData.gender);
          setBloodGroup(formData.bloodGroup);
          setMaritalStatus(formData.maritalStatus);
          setNationality(formData.nationality);
          setAadharNumber(formData.aadharNumber);
          setPanNumber(formData.panNumber);
          setPermanentAddressLine1(formData.permanentAddressLine1);
          setPermanentAddressLine2(formData.permanentAddressLine2);
          setPermanentCity(formData.permanentCity);
          setPermanentState(formData.permanentState);
          setPermanentPincode(formData.permanentPincode);
          setCurrentAddressLine1(formData.currentAddressLine1);
          setCurrentAddressLine2(formData.currentAddressLine2);
          setCurrentCity(formData.currentCity);
          setCurrentState(formData.currentState);
          setCurrentPincode(formData.currentPincode);
          setFatherName(formData.fatherName);
          setMotherName(formData.motherName);
          setSpouseName(formData.spouseName);
          setEmergencyName(formData.emergencyName);
          setEmergencyRelation(formData.emergencyRelation);
          setEmergencyPhone(formData.emergencyPhone);
          setEmergencyEmail(formData.emergencyEmail);
          setEducationalQualifications(formData.educationalQualifications);
          setMedicalLicenseNumber(formData.medicalLicenseNumber);
          setLicenseIssuingAuthority(formData.licenseIssuingAuthority);
          setLicenseIssueDate(formData.licenseIssueDate);
          setLicenseExpiryDate(formData.licenseExpiryDate);
          setSelectedLicenseIssueDate(new Date(formData.selectedLicenseIssueDate));
          setShowLicenseIssueDatePicker(formData.showLicenseIssueDatePicker);
          setSelectedLicenseExpiryDate(new Date(formData.selectedLicenseExpiryDate));
          setShowLicenseExpiryDatePicker(formData.showLicenseExpiryDatePicker);
          setSpecialization(formData.specialization);
          setSubSpecialization(formData.subSpecialization);
          setYearsOfExperience(formData.yearsOfExperience);
          setMedicalCouncil(formData.medicalCouncil);
          setCouncilRegistrationNumber(formData.councilRegistrationNumber);
          setHospitalAffiliation(formData.hospitalAffiliation);
          setCurrentPosition(formData.currentPosition);
          setPharmacyLicenseNumber(formData.pharmacyLicenseNumber);
          setPharmacyLicenseIssuingAuthority(formData.pharmacyLicenseIssuingAuthority);
          setPharmacyLicenseIssueDate(formData.pharmacyLicenseIssueDate);
          setPharmacyLicenseExpiryDate(formData.pharmacyLicenseExpiryDate);
          setSelectedPharmacyLicenseIssueDate(new Date(formData.selectedPharmacyLicenseIssueDate));
          setShowPharmacyLicenseIssueDatePicker(formData.showPharmacyLicenseIssueDatePicker);
          setSelectedPharmacyLicenseExpiryDate(
            new Date(formData.selectedPharmacyLicenseExpiryDate),
          );
          setShowPharmacyLicenseExpiryDatePicker(formData.showPharmacyLicenseExpiryDatePicker);
          setPharmacyName(formData.pharmacyName);
          setPharmacyAddress(formData.pharmacyAddress);
          setPharmacyOwnershipType(formData.pharmacyOwnershipType);
          setYearsOfPharmacyExperience(formData.yearsOfPharmacyExperience);
          setPharmacyCouncil(formData.pharmacyCouncil);
          setPharmacyCouncilRegistrationNumber(formData.pharmacyCouncilRegistrationNumber);
          setWorkExperience(formData.workExperience);
          setWorkExpDatePickerIndex(formData.workExpDatePickerIndex);
          setWorkExpDatePickerType(formData.workExpDatePickerType);
          setShowWorkExpDatePicker(formData.showWorkExpDatePicker);
          setSelectedWorkExpDate(new Date(formData.selectedWorkExpDate));
          setMembershipDatePickerIndex(formData.membershipDatePickerIndex);
          setMembershipDatePickerType(formData.membershipDatePickerType);
          setShowMembershipDatePicker(formData.showMembershipDatePicker);
          setSelectedMembershipDate(new Date(formData.selectedMembershipDate));
          setProfessionalMemberships(formData.professionalMemberships);
          setCriminalRecord(formData.criminalRecord);
          setCriminalRecordDetails(formData.criminalRecordDetails);
          setMalpracticeHistory(formData.malpracticeHistory);
          setMalpracticeDetails(formData.malpracticeDetails);
          setProfessionalReferences(formData.professionalReferences);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };
    loadProgress();
  }, []);

  // Save progress function
  const saveProgress = async () => {
    const formData = {
      currentStep,
      firstName,
      lastName,
      dateOfBirth,
      selectedDate: selectedDate.toISOString(),
      showDatePicker,
      gender,
      bloodGroup,
      maritalStatus,
      nationality,
      aadharNumber,
      panNumber,
      permanentAddressLine1,
      permanentAddressLine2,
      permanentCity,
      permanentState,
      permanentPincode,
      currentAddressLine1,
      currentAddressLine2,
      currentCity,
      currentState,
      currentPincode,
      fatherName,
      motherName,
      spouseName,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      emergencyEmail,
      educationalQualifications,
      medicalLicenseNumber,
      licenseIssuingAuthority,
      licenseIssueDate,
      licenseExpiryDate,
      selectedLicenseIssueDate: selectedLicenseIssueDate.toISOString(),
      showLicenseIssueDatePicker,
      selectedLicenseExpiryDate: selectedLicenseExpiryDate.toISOString(),
      showLicenseExpiryDatePicker,
      specialization,
      subSpecialization,
      yearsOfExperience,
      medicalCouncil,
      councilRegistrationNumber,
      hospitalAffiliation,
      currentPosition,
      pharmacyLicenseNumber,
      pharmacyLicenseIssuingAuthority,
      pharmacyLicenseIssueDate,
      pharmacyLicenseExpiryDate,
      selectedPharmacyLicenseIssueDate: selectedPharmacyLicenseIssueDate.toISOString(),
      showPharmacyLicenseIssueDatePicker,
      selectedPharmacyLicenseExpiryDate: selectedPharmacyLicenseExpiryDate.toISOString(),
      showPharmacyLicenseExpiryDatePicker,
      pharmacyName,
      pharmacyAddress,
      pharmacyOwnershipType,
      yearsOfPharmacyExperience,
      pharmacyCouncil,
      pharmacyCouncilRegistrationNumber,
      workExperience,
      workExpDatePickerIndex,
      workExpDatePickerType,
      showWorkExpDatePicker,
      selectedWorkExpDate: selectedWorkExpDate.toISOString(),
      membershipDatePickerIndex,
      membershipDatePickerType,
      showMembershipDatePicker,
      selectedMembershipDate: selectedMembershipDate.toISOString(),
      professionalMemberships,
      criminalRecord,
      criminalRecordDetails,
      malpracticeHistory,
      malpracticeDetails,
      professionalReferences,
    };
    try {
      await AsyncStorage.setItem('professionalRegistrationProgress', JSON.stringify(formData));
      Alert.alert('Progress Saved', 'Your progress has been saved locally.');
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'Failed to save progress.');
    }
  };

  // Validation functions
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
  const validateAadhar = (aadhar: string) => /^\d{12}$/.test(aadhar.replace(/\D/g, ''));
  const validatePAN = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: // Personal Information
        return (
          firstName.trim() &&
          lastName.trim() &&
          dateOfBirth &&
          gender &&
          validateDateOfBirth(dateOfBirth) &&
          validateAadhar(aadharNumber) &&
          validatePAN(panNumber)
        );
      case 2: // Address Information
        return (
          permanentAddressLine1.trim() &&
          permanentCity.trim() &&
          permanentState.trim() &&
          validatePincode(permanentPincode) &&
          currentAddressLine1.trim() &&
          currentCity.trim() &&
          currentState.trim() &&
          validatePincode(currentPincode)
        );
      case 3: // Family & Emergency Contact
        return emergencyName.trim() && emergencyRelation.trim() && validatePhone(emergencyPhone);
      case 4: // Educational Qualifications
        return educationalQualifications.every(
          (edu) =>
            edu.degree.trim() &&
            edu.institution.trim() &&
            edu.yearOfCompletion &&
            edu.percentage &&
            edu.board.trim(),
        );
      case 5: // Professional Details
        if (userRole === 'Doctor') {
          return (
            medicalLicenseNumber.trim() &&
            licenseIssueDate &&
            licenseExpiryDate &&
            specialization.trim() &&
            yearsOfExperience &&
            medicalCouncil.trim() &&
            hospitalAffiliation.trim() &&
            currentPosition.trim()
          );
        } else {
          return (
            pharmacyLicenseNumber.trim() &&
            pharmacyLicenseIssuingAuthority.trim() &&
            pharmacyLicenseIssueDate &&
            pharmacyLicenseExpiryDate &&
            pharmacyName.trim() &&
            pharmacyAddress.trim() &&
            pharmacyOwnershipType &&
            yearsOfPharmacyExperience &&
            pharmacyCouncil.trim()
          );
        }
      case 6: // Work Experience
        return workExperience.every(
          (exp) =>
            exp.organization.trim() &&
            exp.position.trim() &&
            exp.fromDate &&
            (exp.currentlyWorking || exp.toDate) &&
            exp.responsibilities.trim(),
        );
      case 7: // Professional Memberships
        return professionalMemberships.every(
          (membership) =>
            membership.organization.trim() &&
            membership.membershipNumber.trim() &&
            membership.validFrom &&
            membership.validTo,
        );
      case 8: // Background Check
        return true; // Optional fields
      case 9: // References
        return professionalReferences.every(
          (ref) =>
            ref.name.trim() &&
            ref.designation.trim() &&
            ref.organization.trim() &&
            validatePhone(ref.phone) &&
            ref.email.trim() &&
            ref.relationship.trim(),
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 9));
    } else {
      const errorMessage = getStepValidationError(currentStep);
      setError(errorMessage);
    }
  };

  const getStepValidationError = (step: number): string => {
    switch (step) {
      case 1:
        if (!firstName.trim()) return 'Please enter your first name.';
        if (!lastName.trim()) return 'Please enter your last name.';
        if (!dateOfBirth || !validateDateOfBirth(dateOfBirth))
          return 'Please select a valid date of birth (must be 18+ years old).';
        if (!gender) return 'Please select your gender.';
        if (!validateAadhar(aadharNumber)) return 'Please enter a valid 12-digit Aadhar number.';
        if (!validatePAN(panNumber)) return 'Please enter a valid PAN number (format: AAAAA9999A).';
        return 'Please fill all required personal information fields.';
      case 2:
        if (!permanentAddressLine1.trim()) return 'Please enter your permanent address line 1.';
        if (!permanentCity.trim()) return 'Please enter your permanent city.';
        if (!permanentState.trim()) return 'Please enter your permanent state.';
        if (!validatePincode(permanentPincode))
          return 'Please enter a valid 6-digit permanent pincode.';
        if (!currentAddressLine1.trim()) return 'Please enter your current address line 1.';
        if (!currentCity.trim()) return 'Please enter your current city.';
        if (!currentState.trim()) return 'Please enter your current state.';
        if (!validatePincode(currentPincode))
          return 'Please enter a valid 6-digit current pincode.';
        return 'Please fill all required address fields.';
      case 3:
        if (!emergencyName.trim()) return 'Please enter emergency contact name.';
        if (!emergencyRelation.trim()) return 'Please enter emergency contact relation.';
        if (!validatePhone(emergencyPhone))
          return 'Please enter a valid 10-digit emergency contact phone number.';
        return 'Please fill all emergency contact fields.';
      case 4:
        const invalidEduIndex = educationalQualifications.findIndex(
          (edu) =>
            !edu.degree.trim() ||
            !edu.institution.trim() ||
            !edu.yearOfCompletion ||
            !edu.percentage ||
            isNaN(Number(edu.percentage)) ||
            Number(edu.percentage) < 0 ||
            Number(edu.percentage) > 100 ||
            !edu.board.trim(),
        );
        if (invalidEduIndex !== -1) {
          return `Please complete all fields for educational qualification ${invalidEduIndex + 1} (percentage must be 0-100).`;
        }
        return 'Please fill all educational qualification fields.';
      case 5:
        if (userRole === 'Doctor') {
          if (!medicalLicenseNumber.trim()) return 'Please enter your medical license number.';
          if (!licenseIssueDate) return 'Please select your license issue date.';
          if (!licenseExpiryDate) return 'Please select your license expiry date.';
          if (!specialization.trim()) return 'Please enter your specialization.';
          if (
            !yearsOfExperience ||
            isNaN(Number(yearsOfExperience)) ||
            Number(yearsOfExperience) < 0
          )
            return 'Please enter valid years of experience.';
          if (!medicalCouncil.trim()) return 'Please enter your medical council.';
          if (!hospitalAffiliation.trim()) return 'Please enter your hospital/clinic affiliation.';
          if (!currentPosition.trim()) return 'Please enter your current position.';
        } else {
          if (!pharmacyLicenseNumber.trim()) return 'Please enter your pharmacy license number.';
          if (!pharmacyLicenseIssuingAuthority.trim())
            return 'Please enter your pharmacy license issuing authority.';
          if (!pharmacyLicenseIssueDate) return 'Please select your pharmacy license issue date.';
          if (!pharmacyLicenseExpiryDate) return 'Please select your pharmacy license expiry date.';
          if (!pharmacyName.trim()) return 'Please enter your pharmacy name.';
          if (!pharmacyAddress.trim()) return 'Please enter your pharmacy address.';
          if (!pharmacyOwnershipType) return 'Please select your pharmacy ownership type.';
          if (
            !yearsOfPharmacyExperience ||
            isNaN(Number(yearsOfPharmacyExperience)) ||
            Number(yearsOfPharmacyExperience) < 0
          )
            return 'Please enter valid years of pharmacy experience.';
          if (!pharmacyCouncil.trim()) return 'Please enter your pharmacy council.';
        }
        return 'Please fill all required professional details.';
      case 6:
        const invalidExpIndex = workExperience.findIndex(
          (exp) =>
            !exp.organization.trim() ||
            !exp.position.trim() ||
            !exp.fromDate ||
            (!exp.currentlyWorking && !exp.toDate) ||
            !exp.responsibilities.trim(),
        );
        if (invalidExpIndex !== -1) {
          return `Please complete all fields for work experience ${invalidExpIndex + 1}.`;
        }
        return 'Please fill all work experience fields.';
      case 7:
        const invalidMembershipIndex = professionalMemberships.findIndex(
          (membership) =>
            !membership.organization.trim() ||
            !membership.membershipNumber.trim() ||
            !membership.validFrom ||
            !membership.validTo,
        );
        if (invalidMembershipIndex !== -1) {
          return `Please complete all fields for membership ${invalidMembershipIndex + 1}.`;
        }
        return 'Please fill all membership fields.';
      case 8:
        return 'Background check is optional, you can proceed.';
      case 9:
        const invalidRefIndex = professionalReferences.findIndex(
          (ref) =>
            !ref.name.trim() ||
            !ref.designation.trim() ||
            !ref.organization.trim() ||
            !validatePhone(ref.phone) ||
            !ref.email.trim() ||
            !ref.relationship.trim(),
        );
        if (invalidRefIndex !== -1) {
          return `Please complete all fields for reference ${invalidRefIndex + 1}.`;
        }
        return 'Please fill all reference fields.';
      default:
        return 'Please fill all required fields correctly.';
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!isStepValid(9)) {
      setError('Please fill all required fields correctly.');
      return;
    }

    setError(null);

    if (!networkStatus) {
      setError('No internet connection. Please check your network settings.');
      return;
    }

    setLoading(true);
    try {
      const professionalData = {
        userId: user?.id,
        userName: user?.username,
        phoneNumber: user?.phoneNumbers[0]?.phoneNumber,
        email: user?.primaryEmailAddress?.emailAddress,
        role: userRole,

        // Personal Information
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        nationality,
        aadharNumber,
        panNumber,

        // Address Information
        permanentAddressLine1: permanentAddressLine1.trim(),
        permanentAddressLine2: permanentAddressLine2.trim(),
        permanentCity: permanentCity.trim(),
        permanentState: permanentState.trim(),
        permanentPincode: permanentPincode.trim(),
        currentAddressLine1: currentAddressLine1.trim(),
        currentAddressLine2: currentAddressLine2.trim(),
        currentCity: currentCity.trim(),
        currentState: currentState.trim(),
        currentPincode: currentPincode.trim(),

        // Family & Emergency Contact
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        spouseName: spouseName.trim(),
        emergencyName: emergencyName.trim(),
        emergencyRelation: emergencyRelation.trim(),
        emergencyPhone: emergencyPhone.trim(),
        emergencyEmail: emergencyEmail.trim(),

        // Educational Qualifications
        educationalQualifications: JSON.stringify(educationalQualifications),

        // Professional Details
        ...(userRole === 'Doctor' && {
          medicalLicenseNumber: medicalLicenseNumber.trim(),
          licenseIssuingAuthority: licenseIssuingAuthority.trim(),
          licenseIssueDate,
          licenseExpiryDate,
          specialization: specialization.trim(),
          subSpecialization: subSpecialization.trim(),
          yearsOfExperience: parseInt(yearsOfExperience),
          medicalCouncil: medicalCouncil.trim(),
          councilRegistrationNumber: councilRegistrationNumber.trim(),
          hospitalAffiliation: hospitalAffiliation.trim(),
          currentPosition: currentPosition.trim(),
        }),

        ...(userRole === 'PharmaCist' && {
          pharmacyLicenseNumber: pharmacyLicenseNumber.trim(),
          pharmacyLicenseIssuingAuthority: pharmacyLicenseIssuingAuthority.trim(),
          pharmacyLicenseIssueDate,
          pharmacyLicenseExpiryDate,
          pharmacyName: pharmacyName.trim(),
          pharmacyAddress: pharmacyAddress.trim(),
          pharmacyOwnershipType,
          yearsOfPharmacyExperience: parseInt(yearsOfPharmacyExperience),
          pharmacyCouncil: pharmacyCouncil.trim(),
          pharmacyCouncilRegistrationNumber: pharmacyCouncilRegistrationNumber.trim(),
        }),

        // Work Experience
        workExperience: JSON.stringify(workExperience),

        // Professional Memberships
        professionalMemberships: JSON.stringify(professionalMemberships),

        // Background Check
        criminalRecord,
        criminalRecordDetails: criminalRecord ? criminalRecordDetails.trim() : null,
        ...(userRole === 'Doctor' && {
          malpracticeHistory,
          malpracticeDetails: malpracticeHistory ? malpracticeDetails.trim() : null,
        }),

        // References
        professionalReferences: JSON.stringify(professionalReferences),
      };

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        console.warn('EXPO_PUBLIC_API_URL not configured, skipping backend sync');
        router.replace('/(root)/(tabs)/home');
        return;
      }

      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/professionals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'x-react-native-app': 'DrDwar',
          'User-Agent': 'DrDwar-Mobile-App/1.0',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(professionalData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Backend sync failed:', result);
        throw new Error(result.message || 'Failed to submit professional registration');
      }

      // Update Clerk metadata
      await user?.update({
        unsafeMetadata: {
          basicInfoCompleted: true,
          role: userRole,
          isVerified: false, // Will be updated by admin later
        },
      });

      // Clear saved progress after successful submission
      await AsyncStorage.removeItem('professionalRegistrationProgress');

      Alert.alert(
        'Registration Submitted',
        'Your professional registration has been submitted successfully. Our team will review your application and verify your credentials. You will be notified once verification is complete.',
        [{ text: 'OK', onPress: () => router.replace('/(root)/(tabs)/home') }],
      );
    } catch (err: any) {
      console.error('Error submitting professional registration:', err);
      setError(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-6"
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
          <View key={step} className="flex-row items-center">
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <Text
                className={`text-sm font-bold ${step <= currentStep ? 'text-white' : 'text-gray-600'}`}
              >
                {step}
              </Text>
            </View>
            {step < 9 && (
              <View className={`h-1 w-8 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-300'}`} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
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
            label="First Name *"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={firstName.trim() ? '#10b981' : '#e2e8f0'}
            activeOutlineColor={firstName.trim() ? '#10b981' : '#4a5568'}
            textColor="#1a202c"
          />
          <TextInput
            label="Last Name *"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={lastName.trim() ? '#10b981' : '#e2e8f0'}
            activeOutlineColor={lastName.trim() ? '#10b981' : '#4a5568'}
            textColor="#1a202c"
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: dateOfBirth ? '#10b981' : '#e2e8f0',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: dateOfBirth ? '#1a202c' : '#a0aec0' }}>
            {dateOfBirth || 'Select Date of Birth *'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedDate(date);
                setDateOfBirth(date.toISOString().split('T')[0]);
              }
            }}
            maximumDate={
              new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())
            }
            minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)}
          />
        )}

        <Text className="mb-2 text-lg font-semibold" style={{ color: '#1a202c' }}>
          Gender *
        </Text>
        <View className="mb-4 flex-row justify-around">
          {['Male', 'Female', 'Other'].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setGender(option.toLowerCase())}
              style={{
                backgroundColor: gender === option.toLowerCase() ? '#4a5568' : '#f8fafc',
                borderRadius: 8,
                padding: 12,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: gender === option.toLowerCase() ? 'white' : '#1a202c' }}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row space-x-2">
          <TextInput
            label="Blood Group"
            value={bloodGroup}
            onChangeText={setBloodGroup}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
          <TextInput
            label="Marital Status"
            value={maritalStatus}
            onChangeText={setMaritalStatus}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
        </View>

        <TextInput
          label="Nationality"
          value={nationality}
          onChangeText={setNationality}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />

        <TextInput
          label="Aadhar Number *"
          value={aadharNumber}
          onChangeText={setAadharNumber}
          mode="outlined"
          keyboardType="numeric"
          maxLength={12}
          style={{ backgroundColor: '#ffffff' }}
          outlineColor={validateAadhar(aadharNumber) ? '#10b981' : '#e2e8f0'}
          activeOutlineColor={validateAadhar(aadharNumber) ? '#10b981' : '#4a5568'}
          textColor="#1a202c"
        />

        <TextInput
          label="PAN Number *"
          value={panNumber}
          onChangeText={(text) => setPanNumber(text.toUpperCase())}
          mode="outlined"
          autoCapitalize="characters"
          maxLength={10}
          style={{ backgroundColor: '#ffffff' }}
          outlineColor={validatePAN(panNumber) ? '#10b981' : '#e2e8f0'}
          activeOutlineColor={validatePAN(panNumber) ? '#10b981' : '#4a5568'}
          textColor="#1a202c"
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
          label="Address Line 1 *"
          value={permanentAddressLine1}
          onChangeText={setPermanentAddressLine1}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Address Line 2"
          value={permanentAddressLine2}
          onChangeText={setPermanentAddressLine2}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <View className="flex-row space-x-2">
          <TextInput
            label="City *"
            value={permanentCity}
            onChangeText={setPermanentCity}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
          <TextInput
            label="State *"
            value={permanentState}
            onChangeText={setPermanentState}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
        </View>
        <TextInput
          label="Pincode *"
          value={permanentPincode}
          onChangeText={setPermanentPincode}
          mode="outlined"
          keyboardType="numeric"
          maxLength={6}
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />

        <Divider style={{ marginVertical: 16 }} />

        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Current Address
        </Text>
        <TextInput
          label="Address Line 1 *"
          value={currentAddressLine1}
          onChangeText={setCurrentAddressLine1}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Address Line 2"
          value={currentAddressLine2}
          onChangeText={setCurrentAddressLine2}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <View className="flex-row space-x-2">
          <TextInput
            label="City *"
            value={currentCity}
            onChangeText={setCurrentCity}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
          <TextInput
            label="State *"
            value={currentState}
            onChangeText={setCurrentState}
            mode="outlined"
            className="flex-1"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
        </View>
        <TextInput
          label="Pincode *"
          value={currentPincode}
          onChangeText={setCurrentPincode}
          mode="outlined"
          keyboardType="numeric"
          maxLength={6}
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
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
        <TextInput
          label="Father's Name"
          value={fatherName}
          onChangeText={setFatherName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Mother's Name"
          value={motherName}
          onChangeText={setMotherName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Spouse Name"
          value={spouseName}
          onChangeText={setSpouseName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />

        <Divider style={{ marginVertical: 16 }} />

        <Text className="text-lg font-semibold" style={{ color: '#1a202c' }}>
          Emergency Contact *
        </Text>
        <TextInput
          label="Full Name *"
          value={emergencyName}
          onChangeText={setEmergencyName}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Relationship *"
          value={emergencyRelation}
          onChangeText={setEmergencyRelation}
          mode="outlined"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Phone Number *"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          mode="outlined"
          keyboardType="phone-pad"
          maxLength={10}
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
        <TextInput
          label="Email"
          value={emergencyEmail}
          onChangeText={setEmergencyEmail}
          mode="outlined"
          keyboardType="email-address"
          style={{ backgroundColor: '#ffffff' }}
          outlineColor="#e2e8f0"
          activeOutlineColor="#4a5568"
          textColor="#1a202c"
        />
      </View>
    </View>
  );

  const renderEducationalQualifications = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Educational Qualifications
      </Text>

      {educationalQualifications.map((edu, index) => (
        <View key={index} className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Qualification {index + 1}
          </Text>

          <View className="space-y-4">
            <TextInput
              label="Degree/Certificate *"
              value={edu.degree}
              onChangeText={(text) => {
                const newEdu = [...educationalQualifications];
                newEdu[index].degree = text;
                setEducationalQualifications(newEdu);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <TextInput
              label="Institution/University *"
              value={edu.institution}
              onChangeText={(text) => {
                const newEdu = [...educationalQualifications];
                newEdu[index].institution = text;
                setEducationalQualifications(newEdu);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="Year of Completion *"
                value={edu.yearOfCompletion}
                onChangeText={(text) => {
                  const newEdu = [...educationalQualifications];
                  newEdu[index].yearOfCompletion = text;
                  setEducationalQualifications(newEdu);
                }}
                mode="outlined"
                keyboardType="numeric"
                maxLength={4}
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
              />

              <TextInput
                label="Percentage/CGPA *"
                value={edu.percentage}
                onChangeText={(text) => {
                  const newEdu = [...educationalQualifications];
                  newEdu[index].percentage = text;
                  setEducationalQualifications(newEdu);
                }}
                mode="outlined"
                keyboardType="numeric"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
              />
            </View>

            <TextInput
              label="Board/Council *"
              value={edu.board}
              onChangeText={(text) => {
                const newEdu = [...educationalQualifications];
                newEdu[index].board = text;
                setEducationalQualifications(newEdu);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            {educationalQualifications.length > 1 && (
              <Button
                mode="outlined"
                onPress={() => {
                  const newEdu = educationalQualifications.filter((_, i) => i !== index);
                  setEducationalQualifications(newEdu);
                }}
                style={{ marginTop: 8 }}
              >
                Remove Qualification
              </Button>
            )}
          </View>
        </View>
      ))}

      <Button
        mode="contained"
        onPress={() => {
          setEducationalQualifications([
            ...educationalQualifications,
            {
              degree: '',
              institution: '',
              yearOfCompletion: '',
              percentage: '',
              board: '',
            },
          ]);
        }}
        style={{ marginTop: 16 }}
      >
        Add Another Qualification
      </Button>
    </View>
  );

  const renderProfessionalDetails = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        {userRole === 'Doctor' ? 'Medical Professional Details' : 'Pharmacy Professional Details'}
      </Text>

      {userRole === 'Doctor' ? (
        <View className="space-y-4">
          <TextInput
            label="Medical License Number *"
            value={medicalLicenseNumber}
            onChangeText={setMedicalLicenseNumber}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={medicalLicenseNumber.trim() ? '#10b981' : '#e2e8f0'}
            activeOutlineColor={medicalLicenseNumber.trim() ? '#10b981' : '#4a5568'}
            textColor="#1a202c"
          />

          <TextInput
            label="License Issuing Authority"
            value={licenseIssuingAuthority}
            onChangeText={setLicenseIssuingAuthority}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setShowLicenseIssueDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: licenseIssueDate ? '#10b981' : '#e2e8f0',
                padding: 16,
                marginRight: 8,
              }}
            >
              <Text style={{ color: licenseIssueDate ? '#1a202c' : '#a0aec0' }}>
                {licenseIssueDate || 'License Issue Date *'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLicenseExpiryDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: licenseExpiryDate ? '#10b981' : '#e2e8f0',
                padding: 16,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: licenseExpiryDate ? '#1a202c' : '#a0aec0' }}>
                {licenseExpiryDate || 'License Expiry Date *'}
              </Text>
            </TouchableOpacity>
          </View>

          {showLicenseIssueDatePicker && (
            <DateTimePicker
              value={selectedLicenseIssueDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowLicenseIssueDatePicker(Platform.OS === 'ios');
                if (date) {
                  setSelectedLicenseIssueDate(date);
                  setLicenseIssueDate(date.toISOString().split('T')[0]);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(new Date().getFullYear() - 50, 0, 1)}
            />
          )}

          {showLicenseExpiryDatePicker && (
            <DateTimePicker
              value={selectedLicenseExpiryDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowLicenseExpiryDatePicker(Platform.OS === 'ios');
                if (date) {
                  setSelectedLicenseExpiryDate(date);
                  setLicenseExpiryDate(date.toISOString().split('T')[0]);
                }
              }}
              minimumDate={new Date()}
              maximumDate={new Date(new Date().getFullYear() + 50, 11, 31)}
            />
          )}

          <TextInput
            label="Specialization *"
            value={specialization}
            onChangeText={setSpecialization}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={specialization.trim() ? '#10b981' : '#e2e8f0'}
            activeOutlineColor={specialization.trim() ? '#10b981' : '#4a5568'}
            textColor="#1a202c"
          />

          <TextInput
            label="Sub-specialization"
            value={subSpecialization}
            onChangeText={setSubSpecialization}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Years of Experience *"
            value={yearsOfExperience}
            onChangeText={setYearsOfExperience}
            mode="outlined"
            keyboardType="numeric"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={
              yearsOfExperience &&
              !isNaN(Number(yearsOfExperience)) &&
              Number(yearsOfExperience) >= 0
                ? '#10b981'
                : '#e2e8f0'
            }
            activeOutlineColor={
              yearsOfExperience &&
              !isNaN(Number(yearsOfExperience)) &&
              Number(yearsOfExperience) >= 0
                ? '#10b981'
                : '#4a5568'
            }
            textColor="#1a202c"
          />

          <TextInput
            label="Medical Council *"
            value={medicalCouncil}
            onChangeText={setMedicalCouncil}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Council Registration Number"
            value={councilRegistrationNumber}
            onChangeText={setCouncilRegistrationNumber}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Hospital/Clinic Affiliation *"
            value={hospitalAffiliation}
            onChangeText={setHospitalAffiliation}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Current Position *"
            value={currentPosition}
            onChangeText={setCurrentPosition}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
        </View>
      ) : (
        <View className="space-y-4">
          <TextInput
            label="Pharmacy License Number *"
            value={pharmacyLicenseNumber}
            onChangeText={setPharmacyLicenseNumber}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor={pharmacyLicenseNumber.trim() ? '#10b981' : '#e2e8f0'}
            activeOutlineColor={pharmacyLicenseNumber.trim() ? '#10b981' : '#4a5568'}
            textColor="#1a202c"
          />

          <TextInput
            label="License Issuing Authority"
            value={pharmacyLicenseIssuingAuthority}
            onChangeText={setPharmacyLicenseIssuingAuthority}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setShowPharmacyLicenseIssueDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: pharmacyLicenseIssueDate ? '#10b981' : '#e2e8f0',
                padding: 16,
                marginRight: 8,
              }}
            >
              <Text style={{ color: pharmacyLicenseIssueDate ? '#1a202c' : '#a0aec0' }}>
                {pharmacyLicenseIssueDate || 'License Issue Date *'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowPharmacyLicenseExpiryDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: pharmacyLicenseExpiryDate ? '#10b981' : '#e2e8f0',
                padding: 16,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: pharmacyLicenseExpiryDate ? '#1a202c' : '#a0aec0' }}>
                {pharmacyLicenseExpiryDate || 'License Expiry Date *'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPharmacyLicenseIssueDatePicker && (
            <DateTimePicker
              value={selectedPharmacyLicenseIssueDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowPharmacyLicenseIssueDatePicker(Platform.OS === 'ios');
                if (date) {
                  setSelectedPharmacyLicenseIssueDate(date);
                  setPharmacyLicenseIssueDate(date.toISOString().split('T')[0]);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(new Date().getFullYear() - 50, 0, 1)}
            />
          )}

          {showPharmacyLicenseExpiryDatePicker && (
            <DateTimePicker
              value={selectedPharmacyLicenseExpiryDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowPharmacyLicenseExpiryDatePicker(Platform.OS === 'ios');
                if (date) {
                  setSelectedPharmacyLicenseExpiryDate(date);
                  setPharmacyLicenseExpiryDate(date.toISOString().split('T')[0]);
                }
              }}
              minimumDate={new Date()}
              maximumDate={new Date(new Date().getFullYear() + 50, 11, 31)}
            />
          )}

          <TextInput
            label="Pharmacy Name *"
            value={pharmacyName}
            onChangeText={setPharmacyName}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Pharmacy Address *"
            value={pharmacyAddress}
            onChangeText={setPharmacyAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <Text className="mb-2 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Ownership Type
          </Text>
          <View className="mb-4 flex-row justify-around">
            {['Owned', 'Managed', 'Employed'].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setPharmacyOwnershipType(option.toLowerCase())}
                style={{
                  backgroundColor:
                    pharmacyOwnershipType === option.toLowerCase() ? '#4a5568' : '#f8fafc',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: pharmacyOwnershipType === option.toLowerCase() ? 'white' : '#1a202c',
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            label="Years of Pharmacy Experience *"
            value={yearsOfPharmacyExperience}
            onChangeText={setYearsOfPharmacyExperience}
            mode="outlined"
            keyboardType="numeric"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Pharmacy Council *"
            value={pharmacyCouncil}
            onChangeText={setPharmacyCouncil}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />

          <TextInput
            label="Council Registration Number"
            value={pharmacyCouncilRegistrationNumber}
            onChangeText={setPharmacyCouncilRegistrationNumber}
            mode="outlined"
            style={{ backgroundColor: '#ffffff' }}
            outlineColor="#e2e8f0"
            activeOutlineColor="#4a5568"
            textColor="#1a202c"
          />
        </View>
      )}
    </View>
  );

  const renderWorkExperience = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Work Experience
      </Text>

      {workExperience.map((exp, index) => (
        <View key={index} className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Experience {index + 1}
          </Text>

          <View className="space-y-4">
            <TextInput
              label="Organization/Hospital/Clinic *"
              value={exp.organization}
              onChangeText={(text) => {
                const newExp = [...workExperience];
                newExp[index].organization = text;
                setWorkExperience(newExp);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <TextInput
              label="Position/Designation *"
              value={exp.position}
              onChangeText={(text) => {
                const newExp = [...workExperience];
                newExp[index].position = text;
                setWorkExperience(newExp);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => {
                  setWorkExpDatePickerIndex(index);
                  setWorkExpDatePickerType('from');
                  setSelectedWorkExpDate(exp.fromDate ? new Date(exp.fromDate) : new Date());
                  setShowWorkExpDatePicker(true);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: exp.fromDate ? '#10b981' : '#e2e8f0',
                  padding: 16,
                }}
              >
                <Text style={{ color: exp.fromDate ? '#1a202c' : '#a0aec0' }}>
                  {exp.fromDate || 'From Date *'}
                </Text>
              </TouchableOpacity>

              {!exp.currentlyWorking && (
                <TouchableOpacity
                  onPress={() => {
                    setWorkExpDatePickerIndex(index);
                    setWorkExpDatePickerType('to');
                    setSelectedWorkExpDate(exp.toDate ? new Date(exp.toDate) : new Date());
                    setShowWorkExpDatePicker(true);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: exp.toDate ? '#10b981' : '#e2e8f0',
                    padding: 16,
                  }}
                >
                  <Text style={{ color: exp.toDate ? '#1a202c' : '#a0aec0' }}>
                    {exp.toDate || 'To Date *'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  const newExp = [...workExperience];
                  newExp[index].currentlyWorking = !newExp[index].currentlyWorking;
                  if (newExp[index].currentlyWorking) {
                    newExp[index].toDate = '';
                  }
                  setWorkExperience(newExp);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: '#4a5568',
                    backgroundColor: exp.currentlyWorking ? '#4a5568' : 'transparent',
                    marginRight: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {exp.currentlyWorking && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={{ color: '#1a202c' }}>Currently Working Here</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label="Key Responsibilities *"
              value={exp.responsibilities}
              onChangeText={(text) => {
                const newExp = [...workExperience];
                newExp[index].responsibilities = text;
                setWorkExperience(newExp);
              }}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            {workExperience.length > 1 && (
              <Button
                mode="outlined"
                onPress={() => {
                  const newExp = workExperience.filter((_, i) => i !== index);
                  setWorkExperience(newExp);
                }}
                style={{ marginTop: 8 }}
              >
                Remove Experience
              </Button>
            )}
          </View>
        </View>
      ))}

      <Button
        mode="contained"
        onPress={() => {
          setWorkExperience([
            ...workExperience,
            {
              organization: '',
              position: '',
              fromDate: '',
              toDate: '',
              currentlyWorking: false,
              responsibilities: '',
            },
          ]);
        }}
        style={{ marginTop: 16 }}
      >
        Add Another Experience
      </Button>
    </View>
  );

  const renderProfessionalMemberships = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Professional Memberships & Certifications
      </Text>

      {professionalMemberships.map((membership, index) => (
        <View key={index} className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Membership {index + 1}
          </Text>

          <View className="space-y-4">
            <TextInput
              label="Organization/Council *"
              value={membership.organization}
              onChangeText={(text) => {
                const newMemberships = [...professionalMemberships];
                newMemberships[index].organization = text;
                setProfessionalMemberships(newMemberships);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <TextInput
              label="Membership/Certificate Number *"
              value={membership.membershipNumber}
              onChangeText={(text) => {
                const newMemberships = [...professionalMemberships];
                newMemberships[index].membershipNumber = text;
                setProfessionalMemberships(newMemberships);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => {
                  setMembershipDatePickerIndex(index);
                  setMembershipDatePickerType('from');
                  setSelectedMembershipDate(
                    membership.validFrom ? new Date(membership.validFrom) : new Date(),
                  );
                  setShowMembershipDatePicker(true);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: membership.validFrom ? '#10b981' : '#e2e8f0',
                  padding: 16,
                }}
              >
                <Text style={{ color: membership.validFrom ? '#1a202c' : '#a0aec0' }}>
                  {membership.validFrom || 'Valid From *'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMembershipDatePickerIndex(index);
                  setMembershipDatePickerType('to');
                  setSelectedMembershipDate(
                    membership.validTo ? new Date(membership.validTo) : new Date(),
                  );
                  setShowMembershipDatePicker(true);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: membership.validTo ? '#10b981' : '#e2e8f0',
                  padding: 16,
                }}
              >
                <Text style={{ color: membership.validTo ? '#1a202c' : '#a0aec0' }}>
                  {membership.validTo || 'Valid To *'}
                </Text>
              </TouchableOpacity>
            </View>

            {professionalMemberships.length > 1 && (
              <Button
                mode="outlined"
                onPress={() => {
                  const newMemberships = professionalMemberships.filter((_, i) => i !== index);
                  setProfessionalMemberships(newMemberships);
                }}
                style={{ marginTop: 8 }}
              >
                Remove Membership
              </Button>
            )}
          </View>
        </View>
      ))}

      <Button
        mode="contained"
        onPress={() => {
          setProfessionalMemberships([
            ...professionalMemberships,
            {
              organization: '',
              membershipNumber: '',
              validFrom: '',
              validTo: '',
            },
          ]);
        }}
        style={{ marginTop: 16 }}
      >
        Add Another Membership
      </Button>
    </View>
  );

  const renderBackgroundCheck = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Background Check & Declaration
      </Text>

      <View className="space-y-6">
        <View className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <Text className="mb-2 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Criminal Record Declaration
          </Text>
          <Text className="mb-4" style={{ color: '#4a5568' }}>
            Have you ever been convicted of any criminal offense or been involved in any legal
            proceedings?
          </Text>

          <View className="mb-4 flex-row justify-around">
            <TouchableOpacity
              onPress={() => setCriminalRecord(true)}
              style={{
                backgroundColor: criminalRecord ? '#e53e3e' : '#f8fafc',
                borderRadius: 8,
                padding: 12,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: criminalRecord ? 'white' : '#1a202c' }}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCriminalRecord(false)}
              style={{
                backgroundColor: !criminalRecord ? '#38a169' : '#f8fafc',
                borderRadius: 8,
                padding: 12,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: !criminalRecord ? 'white' : '#1a202c' }}>No</Text>
            </TouchableOpacity>
          </View>

          {criminalRecord && (
            <TextInput
              label="Please provide details *"
              value={criminalRecordDetails}
              onChangeText={setCriminalRecordDetails}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#e53e3e"
              textColor="#1a202c"
            />
          )}
        </View>

        {userRole === 'Doctor' && (
          <View className="rounded-lg border border-red-200 bg-red-50 p-4">
            <Text className="mb-2 text-lg font-semibold" style={{ color: '#1a202c' }}>
              Medical Malpractice Declaration
            </Text>
            <Text className="mb-4" style={{ color: '#4a5568' }}>
              Have you ever been involved in any medical malpractice cases or disciplinary actions?
            </Text>

            <View className="mb-4 flex-row justify-around">
              <TouchableOpacity
                onPress={() => setMalpracticeHistory(true)}
                style={{
                  backgroundColor: malpracticeHistory ? '#e53e3e' : '#f8fafc',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: malpracticeHistory ? 'white' : '#1a202c' }}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMalpracticeHistory(false)}
                style={{
                  backgroundColor: !malpracticeHistory ? '#38a169' : '#f8fafc',
                  borderRadius: 8,
                  padding: 12,
                  minWidth: 80,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: !malpracticeHistory ? 'white' : '#1a202c' }}>No</Text>
              </TouchableOpacity>
            </View>

            {malpracticeHistory && (
              <TextInput
                label="Please provide details *"
                value={malpracticeDetails}
                onChangeText={setMalpracticeDetails}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#e53e3e"
                textColor="#1a202c"
              />
            )}
          </View>
        )}

        <View className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Text className="mb-2 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Declaration
          </Text>
          <Text style={{ color: '#4a5568', lineHeight: 20 }}>
            I hereby declare that all the information provided above is true and correct to the best
            of my knowledge. I understand that any false information may result in disqualification
            from the platform and legal action. I consent to background verification and agree to
            abide by the platform&apos;s terms and conditions.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderReferences = () => (
    <View>
      <Text className="mb-6 text-center text-xl font-bold" style={{ color: '#1a202c' }}>
        Professional References
      </Text>

      <Text className="mb-6 text-center" style={{ color: '#4a5568' }}>
        Please provide at least 2 professional references who can vouch for your credentials and
        professional conduct.
      </Text>

      {professionalReferences.map((ref, index) => (
        <View key={index} className="mb-6 rounded-lg bg-gray-50 p-4">
          <Text className="mb-4 text-lg font-semibold" style={{ color: '#1a202c' }}>
            Reference {index + 1}
          </Text>

          <View className="space-y-4">
            <TextInput
              label="Full Name *"
              value={ref.name}
              onChangeText={(text) => {
                const newRefs = [...professionalReferences];
                newRefs[index].name = text;
                setProfessionalReferences(newRefs);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <TextInput
              label="Designation/Position *"
              value={ref.designation}
              onChangeText={(text) => {
                const newRefs = [...professionalReferences];
                newRefs[index].designation = text;
                setProfessionalReferences(newRefs);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <TextInput
              label="Organization/Hospital *"
              value={ref.organization}
              onChangeText={(text) => {
                const newRefs = [...professionalReferences];
                newRefs[index].organization = text;
                setProfessionalReferences(newRefs);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            <View className="flex-row space-x-2">
              <TextInput
                label="Phone Number *"
                value={ref.phone}
                onChangeText={(text) => {
                  const newRefs = [...professionalReferences];
                  newRefs[index].phone = text;
                  setProfessionalReferences(newRefs);
                }}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={10}
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
              />

              <TextInput
                label="Email *"
                value={ref.email}
                onChangeText={(text) => {
                  const newRefs = [...professionalReferences];
                  newRefs[index].email = text;
                  setProfessionalReferences(newRefs);
                }}
                mode="outlined"
                keyboardType="email-address"
                className="flex-1"
                style={{ backgroundColor: '#ffffff' }}
                outlineColor="#e2e8f0"
                activeOutlineColor="#4a5568"
                textColor="#1a202c"
              />
            </View>

            <TextInput
              label="Relationship to You *"
              value={ref.relationship}
              onChangeText={(text) => {
                const newRefs = [...professionalReferences];
                newRefs[index].relationship = text;
                setProfessionalReferences(newRefs);
              }}
              mode="outlined"
              style={{ backgroundColor: '#ffffff' }}
              outlineColor="#e2e8f0"
              activeOutlineColor="#4a5568"
              textColor="#1a202c"
            />

            {professionalReferences.length > 2 && (
              <Button
                mode="outlined"
                onPress={() => {
                  const newRefs = professionalReferences.filter((_, i) => i !== index);
                  setProfessionalReferences(newRefs);
                }}
                style={{ marginTop: 8 }}
              >
                Remove Reference
              </Button>
            )}
          </View>
        </View>
      ))}

      {professionalReferences.length < 4 && (
        <Button
          mode="contained"
          onPress={() => {
            setProfessionalReferences([
              ...professionalReferences,
              {
                name: '',
                designation: '',
                organization: '',
                phone: '',
                email: '',
                relationship: '',
              },
            ]);
          }}
          style={{ marginTop: 16 }}
        >
          Add Another Reference
        </Button>
      )}
    </View>
  );

  if (!isProfessional) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: '#f7fafc' }}
      >
        <Text className="text-center text-xl" style={{ color: '#1a202c' }}>
          Access Denied: This registration is only for verified healthcare professionals.
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
              <MaterialCommunityIcons name="account-plus" size={40} color="#667eea" />
            </View>
            <Text className="mb-2 text-center text-3xl font-bold" style={{ color: '#1a202c' }}>
              Professional Registration
            </Text>
            <Text
              className="text-lg"
              style={{ color: '#1a202c', opacity: 0.9, textAlign: 'center' }}
            >
              Complete verification for {userRole === 'Doctor' ? 'Medical' : 'Pharmacy'}{' '}
              Professional
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

          {/* Save Progress Button */}
          <View className="mb-4">
            <Button
              mode="outlined"
              onPress={saveProgress}
              style={{
                borderColor: '#4a5568',
              }}
              labelStyle={{ color: '#4a5568' }}
            >
              Save Progress
            </Button>
          </View>

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
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !networkStatus}
                style={{
                  flex: 1,
                  marginLeft: currentStep > 1 ? 8 : 0,
                  backgroundColor: isStepValid(9) ? '#008000' : '#cbd5e0',
                }}
                labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            )}
          </View>

          <Text className="mt-6 text-center" style={{ color: '#1a202c', opacity: 0.8 }}>
            🔒 Your information is securely stored and protected under government privacy standards
          </Text>
        </View>

        {/* Work Experience Date Picker */}
        {showWorkExpDatePicker && workExpDatePickerIndex !== null && workExpDatePickerType && (
          <DateTimePicker
            value={selectedWorkExpDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowWorkExpDatePicker(Platform.OS === 'ios');
              if (date && workExpDatePickerIndex !== null && workExpDatePickerType) {
                setSelectedWorkExpDate(date);
                const newExp = [...workExperience];
                const dateString = date.toISOString().split('T')[0];

                if (workExpDatePickerType === 'from') {
                  newExp[workExpDatePickerIndex].fromDate = dateString;
                } else if (workExpDatePickerType === 'to') {
                  newExp[workExpDatePickerIndex].toDate = dateString;
                }

                setWorkExperience(newExp);
              }
            }}
            maximumDate={new Date()}
            minimumDate={new Date(new Date().getFullYear() - 50, 0, 1)}
          />
        )}

        {/* Membership Date Picker */}
        {showMembershipDatePicker &&
          membershipDatePickerIndex !== null &&
          membershipDatePickerType && (
            <DateTimePicker
              value={selectedMembershipDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowMembershipDatePicker(Platform.OS === 'ios');
                if (date && membershipDatePickerIndex !== null && membershipDatePickerType) {
                  setSelectedMembershipDate(date);
                  const newMemberships = [...professionalMemberships];
                  const dateString = date.toISOString().split('T')[0];

                  if (membershipDatePickerType === 'from') {
                    newMemberships[membershipDatePickerIndex].validFrom = dateString;
                  } else if (membershipDatePickerType === 'to') {
                    newMemberships[membershipDatePickerIndex].validTo = dateString;
                  }

                  setProfessionalMemberships(newMemberships);
                }
              }}
              minimumDate={new Date()}
              maximumDate={new Date(new Date().getFullYear() + 10, 11, 31)}
            />
          )}
      </ScrollView>
    </>
  );
}
