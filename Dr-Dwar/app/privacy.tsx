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
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="mb-2 text-2xl font-bold text-gray-900">Privacy Policy</Text>
            <Text className="text-sm text-gray-500">Last updated: September 17, 2025</Text>
          </View>

          {/* Introduction */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">1. Introduction</Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              At Dr-Dwar (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to
              protecting your privacy and personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our mobile
              application and services.
            </Text>
            <Text className="text-base leading-6 text-gray-700">
              By using Dr-Dwar, you consent to the collection and use of information in accordance
              with this Privacy Policy.
            </Text>
          </View>

          {/* Information We Collect */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              2. Information We Collect
            </Text>

            <Text className="mb-2 text-base font-medium text-gray-800">Personal Information:</Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Name and contact information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Phone number and email address
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Username and profile information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Date of birth and gender
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Medical history and health information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Emergency contact information
              </Text>
            </View>

            <Text className="mb-2 text-base font-medium text-gray-800">Technical Information:</Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Device information and identifiers
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • IP address and location data
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Usage patterns and app interactions
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Crash reports and performance data
              </Text>
            </View>
          </View>

          {/* How We Use Your Information */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              3. How We Use Your Information
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We use the collected information for the following purposes:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Provide healthcare services and consultations
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Process appointments and medical records
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Communicate important health information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Improve our services and user experience
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Ensure platform security and prevent fraud
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Comply with legal and regulatory requirements
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Send service updates and promotional content
              </Text>
            </View>
          </View>

          {/* Information Sharing */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              4. Information Sharing and Disclosure
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We may share your information in the following circumstances:
            </Text>

            <Text className="mb-2 text-base font-medium text-gray-800">
              With Healthcare Providers:
            </Text>
            <Text className="mb-4 ml-4 text-base leading-6 text-gray-700">
              We share relevant health information with licensed healthcare professionals to provide
              you with quality care.
            </Text>

            <Text className="mb-2 text-base font-medium text-gray-800">Service Providers:</Text>
            <Text className="mb-4 ml-4 text-base leading-6 text-gray-700">
              We may share information with trusted third-party service providers who assist us in
              operating our platform.
            </Text>

            <Text className="mb-2 text-base font-medium text-gray-800">Legal Requirements:</Text>
            <Text className="mb-4 ml-4 text-base leading-6 text-gray-700">
              We may disclose information when required by law, court order, or to protect our
              rights and safety.
            </Text>

            <Text className="mb-2 text-base font-medium text-gray-800">Business Transfers:</Text>
            <Text className="ml-4 text-base leading-6 text-gray-700">
              In the event of a merger, acquisition, or sale of assets, your information may be
              transferred to the new entity.
            </Text>
          </View>

          {/* Data Security */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">5. Data Security</Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We implement robust security measures to protect your personal information:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • End-to-end encryption for sensitive data
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Secure cloud storage with access controls
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Regular security audits and updates
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Employee training on data protection
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Multi-factor authentication for staff access
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Regular backups and disaster recovery plans
              </Text>
            </View>
          </View>

          {/* Your Rights */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              6. Your Rights and Choices
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              You have the following rights regarding your personal information:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Access:</Text> Request a copy of your personal
                information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Correction:</Text> Update or correct inaccurate
                information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Deletion:</Text> Request deletion of your personal
                information
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Portability:</Text> Request transfer of your data
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Opt-out:</Text> Unsubscribe from marketing
                communications
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Restriction:</Text> Limit how we process your
                information
              </Text>
            </View>
          </View>

          {/* Cookies and Tracking */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              7. Cookies and Tracking Technologies
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We use cookies and similar technologies to enhance your experience:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Essential Cookies:</Text> Required for app
                functionality
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Analytics Cookies:</Text> Help us improve our
                services
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • <Text className="font-medium">Preference Cookies:</Text> Remember your settings
              </Text>
            </View>
            <Text className="text-base leading-6 text-gray-700">
              You can manage cookie preferences through your device settings.
            </Text>
          </View>

          {/* Children's Privacy */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              8. Children&apos;s Privacy
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              Dr-Dwar is not intended for children under 13 years of age. We do not knowingly
              collect personal information from children under 13.
            </Text>
            <Text className="text-base leading-6 text-gray-700">
              If we become aware that we have collected personal information from a child under 13,
              we will take steps to delete such information.
            </Text>
          </View>

          {/* International Data Transfers */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              9. International Data Transfers
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              Your information may be transferred to and processed in countries other than your own.
              We ensure that such transfers comply with applicable data protection laws and
              implement appropriate safeguards.
            </Text>
          </View>

          {/* Data Retention */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">10. Data Retention</Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We retain your personal information for as long as necessary to provide our services
              and comply with legal obligations:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Medical records: 7 years (as required by law)
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Account information: Duration of account + 3 years
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Marketing data: Until unsubscribed or account deletion
              </Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Analytics data: Anonymized after 2 years
              </Text>
            </View>
          </View>

          {/* Changes to Privacy Policy */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              11. Changes to This Privacy Policy
            </Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by:
            </Text>
            <View className="mb-4 ml-4">
              <Text className="mb-2 text-base leading-6 text-gray-700">• Email notification</Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">• In-app notification</Text>
              <Text className="mb-2 text-base leading-6 text-gray-700">
                • Updated effective date on this page
              </Text>
            </View>
            <Text className="text-base leading-6 text-gray-700">
              Your continued use of Dr-Dwar after changes constitutes acceptance of the updated
              Privacy Policy.
            </Text>
          </View>

          {/* Contact Information */}
          <View className="mb-8">
            <Text className="mb-3 text-lg font-semibold text-gray-900">12. Contact Us</Text>
            <Text className="mb-4 text-base leading-6 text-gray-700">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us:
            </Text>

            <TouchableOpacity
              onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
              className="mb-3 flex-row items-center"
            >
              <Ionicons name="mail" size={16} color="#6B7280" className="mr-2" />
              <Text className="text-base text-blue-600 underline">sakshamgoel1107@gmail.com</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLinkPress('tel:+918882534712')}
              className="mb-3 flex-row items-center"
            >
              <Ionicons name="call" size={16} color="#6B7280" className="mr-2" />
              <Text className="text-base text-blue-600 underline">+91 8882534712</Text>
            </TouchableOpacity>

          </View>

          {/* Data Protection Officer */}
          <View className="mb-8">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              Data Protection Officer
            </Text>
            <Text className="mb-2 text-base leading-6 text-gray-700">
              For data protection related inquiries, you can contact our Data Protection Officer:
            </Text>
            <TouchableOpacity
              onPress={() => handleLinkPress('mailto:sakshamgoel1107@gmail.com')}
              className="flex-row items-center"
            >
              <Ionicons name="shield-checkmark" size={16} color="#6B7280" className="mr-2" />
              <Text className="text-base text-blue-600 underline">sakshamgoel1107@gmail.com</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="border-t border-gray-200 pt-6">
            <Text className="mb-2 text-center text-sm text-gray-500">
              © 2025 Dr-Dwar. All rights reserved.
            </Text>
            <TouchableOpacity onPress={() => router.push('/terms')} className="items-center">
              <Text className="text-sm text-blue-600 underline">Read our Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
