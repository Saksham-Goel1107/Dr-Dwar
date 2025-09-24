import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicy() {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7fafc' }}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignSelf: 'flex-start',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
            }}
          ></TouchableOpacity>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Privacy Policy
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#718096',
              textAlign: 'center',
            }}
          >
            Last updated: September 17, 2025
          </Text>
        </View>

        {/* Introduction */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            1. Introduction
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            At Dr-Dwar-Professional-Professional (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to
            protecting your privacy and personal information. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our mobile
            application and services.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            By using Dr-Dwar-Professional-Professional, you consent to the collection and use of information in accordance
            with this Privacy Policy.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            2. Information We Collect
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            Personal Information:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Name and contact information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Phone number and email address
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Username and profile information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Date of birth and gender
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Medical history and health information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Emergency contact information
            </Text>
          </View>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            Technical Information:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Device information and identifiers
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • IP address and location data
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Usage patterns and app interactions
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Crash reports and performance data
            </Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            3. How We Use Your Information
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We use the collected information for the following purposes:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Provide healthcare services and consultations
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Process appointments and medical records
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Communicate important health information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Improve our services and user experience
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Ensure platform security and prevent fraud
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Comply with legal and regulatory requirements
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Send service updates and promotional content
            </Text>
          </View>
        </View>

        {/* Information Sharing */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            4. Information Sharing and Disclosure
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We may share your information in the following circumstances:
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            With Healthcare Providers:
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
              marginLeft: 16,
            }}
          >
            We share relevant health information with licensed healthcare professionals to provide
            you with quality care.
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            Service Providers:
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
              marginLeft: 16,
            }}
          >
            We may share information with trusted third-party service providers who assist us in
            operating our platform.
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            Legal Requirements:
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
              marginLeft: 16,
            }}
          >
            We may disclose information when required by law, court order, or to protect our rights
            and safety.
          </Text>

          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: '#2d3748',
              marginBottom: 8,
            }}
          >
            Business Transfers:
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginLeft: 16,
            }}
          >
            In the event of a merger, acquisition, or sale of assets, your information may be
            transferred to the new entity.
          </Text>
        </View>

        {/* Data Security */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            5. Data Security
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We implement robust security measures to protect your personal information:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • End-to-end encryption for sensitive data
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Secure cloud storage with access controls
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Regular security audits and updates
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Employee training on data protection
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Multi-factor authentication for staff access
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Regular backups and disaster recovery plans
            </Text>
          </View>
        </View>

        {/* Your Rights */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            6. Your Rights and Choices
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            You have the following rights regarding your personal information:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Access:</Text> Request a copy of your personal
              information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Correction:</Text> Update or correct inaccurate
              information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Deletion:</Text> Request deletion of your
              personal information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Portability:</Text> Request transfer of your
              data
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Opt-out:</Text> Unsubscribe from marketing
              communications
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Restriction:</Text> Limit how we process your
              information
            </Text>
          </View>
        </View>

        {/* Cookies and Tracking */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            7. Cookies and Tracking Technologies
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We use cookies and similar technologies to enhance your experience:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Essential Cookies:</Text> Required for app
              functionality
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Analytics Cookies:</Text> Help us improve our
              services
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • <Text style={{ fontWeight: '500' }}>Preference Cookies:</Text> Remember your
              settings
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            You can manage cookie preferences through your device settings.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            8. Children&apos;s Privacy
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Dr-Dwar-Professional-Professional is not intended for children under 13 years of age. We do not knowingly collect
            personal information from children under 13.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            If we become aware that we have collected personal information from a child under 13, we
            will take steps to delete such information.
          </Text>
        </View>

        {/* International Data Transfers */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            9. International Data Transfers
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            Your information may be transferred to and processed in countries other than your own.
            We ensure that such transfers comply with applicable data protection laws and implement
            appropriate safeguards.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            10. Data Retention
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We retain your personal information for as long as necessary to provide our services and
            comply with legal obligations:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Medical records: 7 years (as required by law)
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Account information: Duration of account + 3 years
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Marketing data: Until unsubscribed or account deletion
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Analytics data: Anonymized after 2 years
            </Text>
          </View>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            11. Changes to This Privacy Policy
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Email notification
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • In-app notification
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Updated effective date on this page
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            Your continued use of Dr-Dwar-Professional-Professional after changes constitutes acceptance of the updated
            Privacy Policy.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            12. Contact Us
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            If you have any questions about this Privacy Policy or our data practices, please
            contact us:
          </Text>

          <TouchableOpacity
            onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="mail" size={16} color="#6b7280" style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 16,
                color: '#2563eb',
                textDecorationLine: 'underline',
              }}
            >
              sakshamgoel1107@gmail.com
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleLinkPress('tel:+918882534712')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="call" size={16} color="#6b7280" style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 16,
                color: '#2563eb',
                textDecorationLine: 'underline',
              }}
            >
              +91 8882534712
            </Text>
          </TouchableOpacity>
        </View>

        {/* Data Protection Officer */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            Data Protection Officer
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 8,
            }}
          >
            For data protection related inquiries, you can contact our Data Protection Officer:
          </Text>
          <TouchableOpacity
            onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color="#6b7280"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: '#2563eb',
                textDecorationLine: 'underline',
              }}
            >
              sakshamgoel1107@gmail.com
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingTop: 24,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#718096',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            © 2025 Dr-Dwar-Professional-Professional. All rights reserved.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/terms')}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#2563eb',
                textDecorationLine: 'underline',
              }}
            >
              Read our Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
