import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfService() {
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
          >
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Terms of Service
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
            1. Acceptance of Terms
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Welcome to Dr-Dwar (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of
            Service (&quot;Terms&quot;) govern your use of our mobile application and services. By
            accessing or using Dr-Dwar, you agree to be bound by these Terms.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            If you do not agree to these Terms, please do not use our services.
          </Text>
        </View>

        {/* Services Description */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            2. Description of Services
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Dr-Dwar is a healthcare platform designed to connect rural communities with quality
            healthcare services. Our services include:
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
              • Telemedicine consultations
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Health information and resources
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Pharmacy services
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Health tracking and monitoring
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Emergency healthcare coordination
            </Text>
          </View>
        </View>

        {/* User Responsibilities */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            3. User Responsibilities
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            As a user of Dr-Dwar, you agree to:
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
              • Provide accurate and complete information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Maintain the confidentiality of your account
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Use the services only for lawful purposes
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Respect healthcare professionals and other users
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Report any technical issues or concerns
            </Text>
          </View>
        </View>

        {/* Privacy and Data Protection */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            4. Privacy and Data Protection
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Your privacy is important to us. Our collection and use of personal information is
            governed by our Privacy Policy, which is incorporated into these Terms by reference.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: '#2563eb',
                textDecorationLine: 'underline',
              }}
            >
              Read our Privacy Policy
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#2563eb" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            5. Medical Disclaimer
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#dc2626',
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            IMPORTANT:
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Dr-Dwar is not a substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of qualified healthcare providers for any medical condition.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            The information provided through our platform is for informational purposes only and
            should not be considered medical advice.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            In case of medical emergencies, please contact emergency services immediately.
          </Text>
        </View>

        {/* Payment Terms */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            6. Payment Terms
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            Some services on Dr-Dwar may require payment. By using paid services, you agree to:
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
              • Pay all applicable fees
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Provide valid payment information
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Authorize automatic billing for recurring services
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: '#4a5568',
                lineHeight: 24,
                marginBottom: 8,
              }}
            >
              • Contact us regarding any billing disputes
            </Text>
          </View>
        </View>

        {/* Termination */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            7. Termination
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            We reserve the right to terminate or suspend your account and access to our services at
            our discretion, without prior notice, for conduct that we believe violates these Terms
            or is harmful to other users, us, or third parties.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            8. Limitation of Liability
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            To the maximum extent permitted by applicable law, Dr-Dwar shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising out of or
            related to your use of our services.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            9. Governing Law
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            These Terms shall be governed by and construed in accordance with the laws of India,
            without regard to its conflict of law provisions.
          </Text>
        </View>

        {/* Changes to Terms */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            10. Changes to Terms
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 16,
            }}
          >
            We reserve the right to modify these Terms at any time. We will notify users of any
            material changes via email or through our application.
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
            }}
          >
            Your continued use of Dr-Dwar after such modifications constitutes acceptance of the
            updated Terms.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: 12,
            }}
          >
            11. Contact Information
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#4a5568',
              lineHeight: 24,
              marginBottom: 8,
            }}
          >
            If you have any questions about these Terms, please contact us:
          </Text>
          <TouchableOpacity
            onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
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
            © 2025 Dr-Dwar. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
