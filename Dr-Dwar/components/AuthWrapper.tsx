import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  const authenticateUser = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Authentication Required',
          'Please set up biometric authentication or PIN in your device settings.',
          [{ text: 'OK', onPress: () => setIsAuthenticated(false) }],
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access the app',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        Alert.alert('Authentication Failed', 'Please try again.', [
          { text: 'Retry', onPress: authenticateUser },
          { text: 'Exit', onPress: () => setIsAuthenticated(false) },
        ]);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
      setIsAuthenticated(false);
    }
  }, []);

  const checkAppLockAndAuthenticate = useCallback(async () => {
    try {
      const lockEnabled = await SecureStore.getItemAsync('APP_LOCK');
      if (lockEnabled === 'true') {
        setAppLockEnabled(true);
        await authenticateUser();
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking app lock:', error);
      Alert.alert('Error', 'Failed to check app lock settings.');
      setIsAuthenticated(true); // Allow access on error
    } finally {
      setIsLoading(false);
    }
  }, [authenticateUser]);

  useEffect(() => {
    checkAppLockAndAuthenticate();
  }, [checkAppLockAndAuthenticate]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Authenticating...</Text>
      </View>
    );
  }

  if (!isAuthenticated && appLockEnabled) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Authentication required to access the app. Please authenticate using your device&apos;s
          biometric or PIN.
        </Text>
        <Text style={{ textAlign: 'center', color: 'gray' }}>
          If you encounter issues, ensure your device has biometric authentication or PIN set up.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
