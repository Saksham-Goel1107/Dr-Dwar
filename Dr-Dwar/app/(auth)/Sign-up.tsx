import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const logo = require('@/assets/images/logo.png');

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Validation
  const handlePhoneNumberChange = (text: string) => {
    setError(null); // clear error on input change
    const cleaned = text.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+91')) {
      setPhoneNumber('+91' + cleaned.replace(/^\+?91?/, ''));
    } else {
      setPhoneNumber(cleaned);
    }
  };

  const isValidPhoneNumber = (number: string) => /^\+91\d{10}$/.test(number);
  const isValidCode = (c: string) => /^\d{6}$/.test(c);

  // Actions
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({ phoneNumber });
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      setPendingVerification(true);
      setError(null);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    if (!isValidCode(code)) {
      setError('Enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(root)/home');
        setError(null);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 items-center justify-center px-6 py-10">
          {/* Logo */}
          <View className="mb-6 rounded-full bg-white p-4 shadow-lg">
            <Image source={logo} className="h-20 w-20" resizeMode="contain" />
          </View>

          {/* Headings */}
          <Text className="mb-2 text-3xl font-bold" style={{ color: '#1e293b' }}>
            Create Your Account
          </Text>
          <Text className="mb-1 text-base" style={{ color: '#059669' }}>
            Healthcare Platform for Rural Areas
          </Text>
          <Text className="mb-8 text-sm" style={{ color: '#64748b' }}>
            Join us to access quality healthcare services in your area
          </Text>

          {/* Animated Form Card */}
          <Animated.View
            style={[
              animatedStyle,
              {
                width: '100%',
                maxWidth: 400,
                backgroundColor: 'white',
                borderRadius: 24,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
                elevation: 8,
              },
            ]}
          >
            {/* Error Message */}
            {error && (
              <View
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: '#dc2626', textAlign: 'center', fontWeight: '500' }}>
                  {error}
                </Text>
              </View>
            )}

            {!pendingVerification ? (
              <>
                <Text
                  style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' }}
                >
                  Phone Number
                </Text>
                <TextInput
                  value={phoneNumber}
                  maxLength={13}
                  onChangeText={handlePhoneNumberChange}
                  mode="outlined"
                  keyboardType="phone-pad"
                  placeholder="+91 9876543210"
                  left={<TextInput.Icon icon="phone" color="#059669" />}
                  style={{ backgroundColor: '#f9fafb', marginBottom: 24 }}
                  textColor="#1f2937"
                  outlineColor="#d1d5db"
                  activeOutlineColor="#059669"
                  theme={{
                    colors: {
                      placeholder: '#9ca3af',
                      onSurfaceVariant: '#6b7280',
                    },
                  }}
                />

                <Button
                  mode="contained"
                  onPress={onSignUpPress}
                  loading={loading}
                  disabled={!phoneNumber || loading}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 8,
                    backgroundColor: loading || !phoneNumber ? '#9ca3af' : '#059669',
                    elevation: 2,
                  }}
                  labelStyle={{ fontSize: 16, fontWeight: '600' }}
                  textColor="white"
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <Text
                  style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' }}
                >
                  Verification Code
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  Enter the 6-digit code sent to {phoneNumber}
                </Text>
                <TextInput
                  value={code}
                  onChangeText={(text) => {
                    setError(null);
                    setCode(text);
                  }}
                  maxLength={6}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="Enter 6-digit code"
                  left={<TextInput.Icon icon="lock" color="#059669" />}
                  style={{ backgroundColor: '#f9fafb', marginBottom: 24 }}
                  textColor="#1f2937"
                  outlineColor="#d1d5db"
                  activeOutlineColor="#059669"
                  theme={{
                    colors: {
                      placeholder: '#9ca3af',
                      onSurfaceVariant: '#6b7280',
                    },
                  }}
                />

                <Button
                  mode="contained"
                  onPress={onPressVerify}
                  loading={loading}
                  disabled={!code || loading}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 8,
                    backgroundColor: loading || !code ? '#9ca3af' : '#059669',
                    elevation: 2,
                  }}
                  labelStyle={{ fontSize: 16, fontWeight: '600' }}
                  textColor="white"
                >
                  Verify & Create Account
                </Button>
              </>
            )}

            {/* Footer */}
            <View className="mt-8 flex-row justify-center">
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Already have an account? </Text>
              <Link href="/(auth)/Sign-in" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#059669', fontWeight: '600', fontSize: 14 }}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
