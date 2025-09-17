import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsOfService() {

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Terms of Service
            </Text>
            <Text className="text-sm text-gray-500">
              Last updated: September 17, 2025
            </Text>
          </View>

          {/* Introduction */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              1. Acceptance of Terms
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              Welcome to Dr-Dwar (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your use of our mobile application and services. By accessing or using Dr-Dwar, you agree to be bound by these Terms.
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              If you do not agree to these Terms, please do not use our services.
            </Text>
          </View>

          {/* Services Description */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              2. Description of Services
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              Dr-Dwar is a healthcare platform designed to connect rural communities with quality healthcare services. Our services include:
            </Text>
            <View className="ml-4 mb-4">
              <Text className="text-base text-gray-700 leading-6 mb-2">• Telemedicine consultations</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Health information and resources</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Pharmacy services</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Health tracking and monitoring</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Emergency healthcare coordination</Text>
            </View>
          </View>

          {/* User Responsibilities */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              3. User Responsibilities
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              As a user of Dr-Dwar, you agree to:
            </Text>
            <View className="ml-4 mb-4">
              <Text className="text-base text-gray-700 leading-6 mb-2">• Provide accurate and complete information</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Maintain the confidentiality of your account</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Use the services only for lawful purposes</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Respect healthcare professionals and other users</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Report any technical issues or concerns</Text>
            </View>
          </View>

          {/* Privacy and Data Protection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              4. Privacy and Data Protection
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/privacy')}
              className="flex-row items-center mb-4"
            >
              <Text className="text-base text-blue-600 underline">Read our Privacy Policy</Text>
              <Ionicons name="arrow-forward" size={16} color="#2563EB" className="ml-1" />
            </TouchableOpacity>
          </View>

          {/* Medical Disclaimer */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              5. Medical Disclaimer
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              <Text className="font-semibold text-red-600">IMPORTANT:</Text> Dr-Dwar is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers for any medical condition.
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              The information provided through our platform is for informational purposes only and should not be considered medical advice.
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              In case of medical emergencies, please contact emergency services immediately.
            </Text>
          </View>

          {/* Payment Terms */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              6. Payment Terms
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              Some services on Dr-Dwar may require payment. By using paid services, you agree to:
            </Text>
            <View className="ml-4 mb-4">
              <Text className="text-base text-gray-700 leading-6 mb-2">• Pay all applicable fees</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Provide valid payment information</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Authorize automatic billing for recurring services</Text>
              <Text className="text-base text-gray-700 leading-6 mb-2">• Contact us regarding any billing disputes</Text>
            </View>
          </View>

          {/* Termination */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              7. Termination
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              We reserve the right to terminate or suspend your account and access to our services at our discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </Text>
          </View>

          {/* Limitation of Liability */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              8. Limitation of Liability
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              To the maximum extent permitted by applicable law, Dr-Dwar shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services.
            </Text>
          </View>

          {/* Governing Law */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              9. Governing Law
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </Text>
          </View>

          {/* Changes to Terms */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              10. Changes to Terms
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through our application.
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              Your continued use of Dr-Dwar after such modifications constitutes acceptance of the updated Terms.
            </Text>
          </View>

          {/* Contact Information */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              11. Contact Information
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-2">
              If you have any questions about these Terms, please contact us:
            </Text>
            <TouchableOpacity
              onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="mail" size={16} color="#6B7280" className="mr-2" />
              <Text className="text-base text-blue-600 underline">lsakshamgoel1107@gmail.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLinkPress('tel:+918882534712')}
              className="flex-row items-center"
            >
              <Ionicons name="call" size={16} color="#6B7280" className="mr-2" />
              <Text className="text-base text-blue-600 underline">+91 8882534712</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="border-t border-gray-200 pt-6">
            <Text className="text-sm text-gray-500 text-center">
              © 2025 Dr-Dwar. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
