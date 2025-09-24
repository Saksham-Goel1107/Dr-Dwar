import { useSignUp } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

const logo = require('@/assets/images/logo.png');

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
      console.log('NetInfo status:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOnline: isConnected,
      });
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

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
  const isValidUsername = (name: string) => /^[a-zA-Z0-9_]{3,20}$/.test(name);

  // Actions
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!isValidUsername(username)) {
      setError(
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores.',
      );
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({ phoneNumber, username });
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
        router.replace('/(root)/basic-info');
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
          <Text className="mb-8 text-center text-sm" style={{ color: '#64748b' }}>
            Join us to access quality healthcare services. Your data is secure and protected.
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
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
                accessibilityLabel="Error message"
                accessibilityLiveRegion="assertive"
              >
                <Text style={{ color: '#dc2626', fontSize: 14, flex: 1, lineHeight: 20 }}>
                  ⚠️ {error}
                </Text>
                <TouchableOpacity
                  onPress={() => setError(null)}
                  accessibilityLabel="Dismiss error"
                  accessibilityHint="Tap to dismiss this error message"
                  style={{ marginLeft: 8 }}
                >
                  <Text style={{ color: '#dc2626', fontSize: 18, fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {!pendingVerification ? (
              <>
                <Text
                  style={{ fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' }}
                >
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={(text) => {
                    setError(null);
                    setUsername(text.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''));
                  }}
                  maxLength={20}
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Choose a username"
                  left={<TextInput.Icon icon="account" color="#059669" />}
                  style={{ backgroundColor: '#f9fafb', marginBottom: 16 }}
                  textColor="#1f2937"
                  outlineColor="#d1d5db"
                  activeOutlineColor="#059669"
                  accessibilityLabel="Username input"
                  accessibilityHint="Enter a unique username with 3-20 characters"
                  theme={{
                    colors: {
                      placeholder: '#9ca3af',
                      onSurfaceVariant: '#6b7280',
                    },
                  }}
                />
                <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                  3-20 characters, letters, numbers, and underscores only
                </Text>
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
                  accessibilityLabel="Phone number input"
                  accessibilityHint="Enter your 10-digit mobile number"
                  theme={{
                    colors: {
                      placeholder: '#9ca3af',
                      onSurfaceVariant: '#6b7280',
                    },
                  }}
                />
                {/* Terms and Privacy Agreement */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 }}>
                  <Checkbox
                    status={agreeToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                    color="#059669"
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#374151',
                      marginLeft: 8,
                      flex: 1,
                      lineHeight: 20,
                    }}
                    accessibilityLabel="Terms and privacy agreement text"
                  >
                    I agree to the{' '}
                    <Text
                      style={{ color: '#059669', textDecorationLine: 'underline' }}
                      onPress={() => {
                        // Navigate to Terms of Service
                        router.push('/terms');
                      }}
                      accessibilityLabel="Terms of Service link"
                      accessibilityHint="Opens Terms of Service page"
                    >
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={{ color: '#059669', textDecorationLine: 'underline' }}
                      onPress={() => {
                        // Navigate to Privacy Policy
                        router.push('/privacy');
                      }}
                      accessibilityLabel="Privacy Policy link"
                      accessibilityHint="Opens Privacy Policy page"
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={onSignUpPress}
                  loading={loading}
                  disabled={!username || !phoneNumber || !agreeToTerms || loading || !networkStatus}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 8,
                    backgroundColor:
                      loading || !username || !phoneNumber || !agreeToTerms || !networkStatus ? '#9ca3af' : '#059669',
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
                <TouchableOpacity
                  accessibilityLabel="Sign in link"
                  accessibilityHint="Navigate to sign in page"
                >
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
