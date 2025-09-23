import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function CreditsScreen() {
  const router = useRouter();

  const contributors = [
    {
      name: 'Saksham Goel',
      role: 'Developer and Owner',
      github: 'https://github.com/Saksham-Goel1107',
      linkedin: 'https://www.linkedin.com/in/saksham-goel-88b74b33a',
    }
  ];

  const technologies = [
    { name: 'React Native', description: 'Mobile App Framework' },
    { name: 'Expo', description: 'Development Platform' },
    { name: 'TypeScript', description: 'Programming Language' },
    { name: 'Clerk', description: 'Authentication Service' },
    { name: 'Prisma', description: 'Database ORM' },
    { name: 'FreeRASP', description: 'Security Framework' },
    { name: 'Sentry', description: 'Error Monitoring' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 40, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, left: 20, zIndex: 1 }}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#3B82F6',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons name="account-group" size={40} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            Credits
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
            Meet the team behind Dr-Dwar and the technologies that power our app
          </Text>
        </View>
      </View>

      {/* Contributors Section */}
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
          Contributors
        </Text>
        {contributors.map((contributor, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
              {contributor.name}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
              {contributor.role}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {contributor.github && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => Linking.openURL(contributor.github!)}
                >
                  <MaterialCommunityIcons name="github" size={20} color="#3B82F6" />
                  <Text style={{ marginLeft: 8, color: '#3B82F6', fontSize: 14 }}>GitHub</Text>
                </TouchableOpacity>
              )}
              {contributor.linkedin && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => Linking.openURL(contributor.linkedin!)}
                >
                  <MaterialCommunityIcons name="linkedin" size={20} color="#3B82F6" />
                  <Text style={{ marginLeft: 8, color: '#3B82F6', fontSize: 14 }}>LinkedIn</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Technologies Section */}
      <View style={{ padding: 20, paddingTop: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
          Technologies Used
        </Text>
        {technologies.map((tech, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>{tech.name}</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>{tech.description}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{ padding: 20, paddingBottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>Dr-Dwar v1.0.0</Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
          © 2025 Dr-Dwar Team. All rights reserved.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => Linking.openURL('https://github.com/Saksham-Goel1107/Dr-Dwar')}
        >
          <Text style={{ fontSize: 14, color: '#3B82F6', textDecorationLine: 'underline' }}>
            View Source Code
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
