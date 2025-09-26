import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function GuideDoctorScreen() {
  const { user } = useUser();
  const router = useRouter();

  const isVerified = user?.publicMetadata?.isverified ?? false;

  const steps = [
    {
      title: 'Complete Your Profile',
      description: 'Fill in your medical credentials, specialization, and contact information.',
      icon: 'account-check',
    },
    {
      title: 'Upload Medical License',
      description: 'Submit a clear photo of your medical license for verification.',
      icon: 'file-document',
    },
    {
      title: 'Provide Practice Details',
      description: 'Add information about your clinic, hospital affiliation, and working hours.',
      icon: 'hospital-building',
    },
    {
      title: 'Set Availability',
      description: 'Configure your consultation slots and preferred languages.',
      icon: 'calendar-clock',
    },
    {
      title: 'Await Verification',
      description: 'Our team will review your documents within 24-48 hours.',
      icon: 'clock-check',
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 40, backgroundColor: '#F8FAFC' }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 40,
            left: 20,
            padding: 8,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => (router.push as any)('/(tabs)/home')}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <MaterialCommunityIcons name="doctor" size={48} color="#10B981" />
          <Text
            variant="headlineSmall"
            style={{ fontWeight: '800', color: '#1F2937', marginTop: 16 }}
          >
            Doctor Verification Guide
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: '#6B7280', textAlign: 'center', marginTop: 8 }}
          >
            Follow these steps to get verified and start providing consultations
          </Text>
        </View>
      </View>

      {/* Verification Status */}
      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: isVerified ? '#D1FAE5' : '#FEF3C7',
            padding: 16,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: isVerified ? '#10B981' : '#F59E0B',
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons
              name={isVerified ? 'check-circle' : 'alert-circle'}
              size={20}
              color={isVerified ? '#10B981' : '#F59E0B'}
            />
            <Text
              style={{
                fontWeight: '700',
                color: isVerified ? '#065F46' : '#92400E',
                marginLeft: 8,
              }}
            >
              {isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
          <Text
            style={{
              color: isVerified ? '#065F46' : '#92400E',
              marginTop: 4,
            }}
          >
            {isVerified
              ? 'Your account is verified. You can now access all features.'
              : 'Awaiting the verification from the Team.'}
          </Text>
        </View>

        {/* Steps */}
        <Text
          variant="titleMedium"
          style={{ fontWeight: '700', color: '#1F2937', marginBottom: 16 }}
        >
          Verification Steps
        </Text>

        {steps.map((step, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#FFFFFF',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#10B981',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                  {index + 1}
                </Text>
              </View>
              <MaterialCommunityIcons name={step.icon as any} size={24} color="#6B7280" />
            </View>
            <Text
              variant="titleSmall"
              style={{ fontWeight: '600', color: '#1F2937', marginBottom: 4 }}
            >
              {step.title}
            </Text>
            <Text variant="bodySmall" style={{ color: '#6B7280', lineHeight: 20 }}>
              {step.description}
            </Text>
          </View>
        ))}

        {/* Contact Support */}
        <View
          style={{
            backgroundColor: '#F3F4F6',
            padding: 16,
            borderRadius: 8,
            marginTop: 20,
          }}
        >
          <Text
            variant="titleSmall"
            style={{ fontWeight: '600', color: '#1F2937', marginBottom: 8 }}
          >
            Need Help?
          </Text>
          <Text variant="bodySmall" style={{ color: '#6B7280', marginBottom: 12 }}>
            If you encounter any issues during verification, contact our support team.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              alignSelf: 'flex-start',
            }}
            onPress={() => {
              router.push('/Support');
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
