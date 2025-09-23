import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function UserCreditsScreen() {
  const router = useRouter();
  const [credits] = useState(250); // Mock credits balance

  const creditPackages = [
    {
      id: 'basic',
      name: 'Basic Pack',
      credits: 100,
      price: 99,
      description: 'Perfect for occasional consultations',
      color: '#10B981',
    },
    {
      id: 'standard',
      name: 'Standard Pack',
      credits: 250,
      price: 199,
      description: 'Great for regular health check-ups',
      color: '#3B82F6',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      credits: 500,
      price: 349,
      description: 'Best value for frequent medical needs',
      color: '#8B5CF6',
    },
    {
      id: 'family',
      name: 'Family Pack',
      credits: 1000,
      price: 599,
      description: 'Comprehensive coverage for the whole family',
      color: '#F59E0B',
    },
  ];

  const handlePurchase = (packageId: string, packageName: string, price: number) => {
    Alert.alert(
      'Purchase Credits',
      `Are you sure you want to purchase ${packageName} for ₹${price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            // Mock purchase success
            Alert.alert(
              'Success!',
              `You have successfully purchased ${packageName}. Credits will be added to your account shortly.`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const transactionHistory = [
    { id: '1', type: 'purchase', amount: 250, date: '2025-01-15', description: 'Standard Pack Purchase' },
    { id: '2', type: 'used', amount: -50, date: '2025-01-14', description: 'Doctor Consultation' },
    { id: '3', type: 'used', amount: -25, date: '2025-01-12', description: 'Medicine Order' },
    { id: '4', type: 'purchase', amount: 100, date: '2025-01-10', description: 'Basic Pack Purchase' },
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
              backgroundColor: '#10B981',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons name="wallet" size={40} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
            My Credits
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#10B981' }}>
              {credits}
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280' }}>Available Credits</Text>
          </View>
        </View>
      </View>

      {/* Credit Packages */}
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
          Buy Credits
        </Text>
        {creditPackages.map((pkg) => (
          <View
            key={pkg.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 20,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              borderWidth: pkg.popular ? 2 : 0,
              borderColor: pkg.popular ? '#3B82F6' : 'transparent',
            }}
          >
            {pkg.popular && (
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  right: 20,
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>POPULAR</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                {pkg.name}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: pkg.color }}>
                  ₹{pkg.price}
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>
                  {pkg.credits} credits
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
              {pkg.description}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: pkg.color,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => handlePurchase(pkg.id, pkg.name, pkg.price)}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Purchase Now
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Transaction History */}
      <View style={{ padding: 20, paddingTop: 0 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
          Transaction History
        </Text>
        {transactionHistory.map((transaction) => (
          <View
            key={transaction.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              padding: 16,
              marginBottom: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937' }}>
                {transaction.description}
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {transaction.date}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: transaction.amount > 0 ? '#10B981' : '#EF4444',
              }}
            >
              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{ padding: 20, paddingBottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
          Credits never expire and can be used for consultations, medicines, and more.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 16,
            paddingVertical: 12,
            paddingHorizontal: 24,
            backgroundColor: '#3B82F6',
            borderRadius: 8,
          }}
          onPress={() => Alert.alert('Help', 'Contact support for credit-related queries.')}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Need Help?
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}