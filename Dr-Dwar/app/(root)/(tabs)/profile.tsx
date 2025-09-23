import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function ProfileSection({
  title,
  children,
  defaultExpanded = false,
}: ProfileSectionProps & { defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <View className="mb-6">
      <TouchableOpacity
        className="flex-row items-center justify-between border-b border-gray-100 p-4 active:bg-gray-50"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text className="text-lg font-semibold text-gray-800">{title}</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
      </TouchableOpacity>
      {isExpanded && (
        <View className="overflow-hidden rounded-b-xl border border-gray-100 bg-white shadow-sm">
          {children}
        </View>
      )}
    </View>
  );
}

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingItem({
  title,
  subtitle,
  icon,
  rightElement,
  onPress,
  showChevron = true,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
        <Ionicons name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && <Text className="mt-0.5 text-sm text-gray-500">{subtitle}</Text>}
      </View>
      {rightElement}
      {showChevron && onPress && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );
}

export default function ProfileSettings() {
  const { user } = useUser();
  const clerk = useClerk();
  const [appLock, setAppLock] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [shakeToReport, setShakeToReport] = useState(true);
  const [sendDiagnosticData, setSendDiagnosticData] = useState(true);
  const [vibrations, setVibrations] = useState(true);
  const [readPageAloud, setReadPageAloud] = useState(false);
  const [preventScreenCapture, setPreventScreenCapture] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const lock = await SecureStore.getItemAsync('APP_LOCK');
      const notif = await SecureStore.getItemAsync('NOTIFICATIONS');
      const shake = await SecureStore.getItemAsync('SHAKE_TO_REPORT');
      const diagnostic = await SecureStore.getItemAsync('SEND_DIAGNOSTIC_DATA');
      const vib = await SecureStore.getItemAsync('VIBRATIONS');
      const readAloud = await SecureStore.getItemAsync('READ_PAGE_ALOUD');
      const preventSS = await SecureStore.getItemAsync('PREVENT_SCREEN_CAPTURE');

      setAppLock(lock === 'true');
      setNotifications(notif !== 'false'); // Default to true
      setShakeToReport(shake !== 'false'); // Default to true
      setSendDiagnosticData(diagnostic !== 'false'); // Default to true
      setVibrations(vib !== 'false'); // Default to true
      setReadPageAloud(readAloud === 'true');
      setPreventScreenCapture(preventSS !== 'false'); // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleAppLock = async (val: boolean) => {
    setLoading(true);
    try {
      // Verify device supports authentication
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Device Lock Required',
          'Please set up biometric authentication or PIN in your device settings to manage app lock.',
          [{ text: 'OK' }],
        );
        return;
      }

      // Request biometric authentication before any app lock change
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: val ? 'Authenticate to enable app lock' : 'Authenticate to disable app lock',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!authResult.success) {
        Alert.alert(
          'Authentication Failed',
          'Authentication is required to change app lock settings. Please try again.',
          [{ text: 'OK' }],
        );
        return;
      }

      // Proceed with the toggle after successful authentication
      if (val) {
        await SecureStore.setItemAsync('APP_LOCK', 'true');
        setAppLock(true);
        Alert.alert(
          'Success',
          'App lock has been enabled. Please refresh the app to put this into action.',
        );
      } else {
        await SecureStore.setItemAsync('APP_LOCK', 'false');
        setAppLock(false);
        Alert.alert('Success', 'App lock has been disabled.');
      }
    } catch (error) {
      console.error('Error toggling app lock:', error);
      Alert.alert('Error', 'Failed to update app lock setting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (val: boolean) => {
    try {
      if (val) {
        // Request notification permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Notification permissions are required to receive app notifications. Please enable them in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ],
          );
          return;
        }

        // Send a test notification to verify permissions work
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Notifications Enabled! 🎉',
            body: 'Welcome to Dr-Dwar! You will now receive important health updates and reminders.',
            sound: 'default',
          },
          trigger: null, // Show immediately
        });

        Alert.alert(
          'Success',
          'Notifications have been enabled! You should see a test notification.',
        );
      }

      await SecureStore.setItemAsync('NOTIFICATIONS', val.toString());
      setNotifications(val);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const toggleShakeToReport = async (val: boolean) => {
    try {
      await SecureStore.setItemAsync('SHAKE_TO_REPORT', val.toString());
      setShakeToReport(val);

      Alert.alert(
        'Success',
        `Shake to report bug has been ${val ? 'enabled' : 'disabled'}. Please refresh the app to put this into action. ${
          val
            ? 'Shake your device to report issues. Please refresh the app to put this into action.'
            : ''
        }`,
      );
    } catch (error) {
      console.error('Error toggling shake to report:', error);
      Alert.alert('Error', 'Failed to update shake to report setting. Please try again.');
    }
  };

  const toggleSendDiagnosticData = async (val: boolean) => {
    try {
      await SecureStore.setItemAsync('SEND_DIAGNOSTIC_DATA', val.toString());
      setSendDiagnosticData(val);

      Alert.alert(
        'Success',
        `Diagnostic data collection has been ${val ? 'enabled' : 'disabled'}. ${
          val
            ? 'We will collect crash reports and performance data to improve the app. Please refresh the app to put this into action.'
            : 'No diagnostic data will be collected. Please refresh the app to put this into action.'
        }`,
      );
    } catch (error) {
      console.error('Error toggling diagnostic data:', error);
      Alert.alert('Error', 'Failed to update diagnostic data setting. Please try again.');
    }
  };

  const toggleVibrations = async (val: boolean) => {
    try {
      await SecureStore.setItemAsync('VIBRATIONS', val.toString());
      setVibrations(val);

      // Provide haptic feedback when enabling vibrations
      if (val) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      Alert.alert(
        'Success',
        `Vibrations have been ${val ? 'enabled' : 'disabled'}. ${
          val
            ? 'You will feel haptic feedback for interactions. Please refresh the app to put this into action.'
            : 'No vibration feedback will be provided. Please refresh the app to put this into action.'
        }`,
      );
    } catch (error) {
      console.error('Error toggling vibrations:', error);
      Alert.alert('Error', 'Failed to update vibration setting. Please try again.');
    }
  };

  const toggleReadPageAloud = async (val: boolean) => {
    try {
      await SecureStore.setItemAsync('READ_PAGE_ALOUD', val.toString());
      setReadPageAloud(val);

      const alertMessage = val
        ? 'Read Page Aloud has been enabled. Page names will be read aloud when navigating. Please refresh the app to put this into action.'
        : 'Read Page Aloud has been disabled. Please refresh the app to put this into action.';

      if (val) {
        Speech.speak(alertMessage, {
          language: 'en',
          pitch: 1,
          rate: 1,
        });
      }

      Alert.alert('Success', alertMessage);
    } catch (error) {
      console.error('Error toggling read page aloud:', error);
      Alert.alert('Error', 'Failed to update read page aloud setting. Please try again.');
    }
  };

  const togglePreventScreenCapture = async (val: boolean) => {
    try {
      await SecureStore.setItemAsync('PREVENT_SCREEN_CAPTURE', val.toString());
      setPreventScreenCapture(val);

      Alert.alert(
        'Success',
        `Screen capture prevention has been ${val ? 'enabled' : 'disabled'}. Please refresh the app to put this into action.`,
      );
    } catch (error) {
      console.error('Error toggling screen capture prevention:', error);
      Alert.alert('Error', 'Failed to update screen capture prevention setting. Please try again.');
    }
  };
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // prefer clerk.signOut if available
            if (clerk && typeof (clerk as any).signOut === 'function') {
              await (clerk as any).signOut();
            } else {
              // fallback: try signOut from hook shape
              console.warn('signOut not available on clerk instance');
            }
          } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEditProfile = async () => {
    try {
      const fallbackUrl = 'https://apt-satyr-99.accounts.dev/user';
      const canOpen = await Linking.canOpenURL(fallbackUrl);
      if (canOpen) {
        await Linking.openURL(fallbackUrl);
      } else {
        Alert.alert('Account Portal', 'Account portal is not available in this environment.');
      }
    } catch (err) {
      console.error('Error opening account portal:', err);
      Alert.alert('Error', 'Failed to open account portal.');
    }
  };

  const handleContactUs = () => {
    Alert.alert(
      'Contact Us',
      'How would you like to reach us?',
      [
        {
          text: 'GitHub',
          onPress: () => {
            Linking.openURL('https://github.com/Saksham-Goel1107');
          },
        },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:sakshamgoel1107@gmail.com');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Dr-Dwar',
      'Dr-Dwar is your AI-powered health assistant.\n\nVersion: 1.0.0\nMADE WITH ❤️ IN INDIA By Saksham Goel\n© 2025 Dr-Dwar Team',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-5">
        {/* User Profile Header */}
        <View className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <View className="items-center">
            <View className="relative mb-3 h-20 w-20">
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="h-20 w-20 rounded-full border-2 border-blue-400"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-100">
                  <Ionicons name="person" size={36} color="#3B82F6" />
                </View>
              )}
              <View className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white bg-green-400" />
            </View>
            <Text className="mb-1 text-xl font-bold text-gray-900">{user?.username || 'User'}</Text>
            <Text className="mb-1 text-sm text-gray-500">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
            <View className="mt-2 flex-row items-center space-x-2">
              <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
              <Text className="text-xs font-medium text-blue-600">Verified Account</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <ProfileSection title="Account" defaultExpanded={false}>
          <SettingItem
            title="Edit Profile"
            subtitle="Update your personal information"
            icon="person-outline"
            onPress={handleEditProfile}
          />
          <SettingItem
            title="Edit Basic Info"
            subtitle="Update your healthcare profile"
            icon="create-outline"
            onPress={() => router.push('../edit-basic-info')}
          />
          <SettingItem
            title="View Orders"
            subtitle="Check your order history"
            icon="bag-handle-outline"
            onPress={() => router.push('/orders')}
          />
          <SettingItem
            title="Notifications"
            subtitle="Receive app notifications"
            icon="notifications-outline"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
        </ProfileSection>

        {/* Security Settings */}
        <ProfileSection title="Security" defaultExpanded={false}>
          <SettingItem
            title="App Lock"
            subtitle="Use device PIN or biometric"
            icon="lock-closed-outline"
            rightElement={
              <Switch
                value={appLock}
                onValueChange={toggleAppLock}
                disabled={loading}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
          <SettingItem
            title="Shake to Report Bug"
            subtitle="Shake device to report issues"
            icon="bug-outline"
            rightElement={
              <Switch
                value={shakeToReport}
                onValueChange={toggleShakeToReport}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
          <SettingItem
            title="Send Diagnostic Data"
            subtitle="Help improve app with crash reports"
            icon="analytics-outline"
            rightElement={
              <Switch
                value={sendDiagnosticData}
                onValueChange={toggleSendDiagnosticData}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
          <SettingItem
            title="Vibrations"
            subtitle="Haptic feedback for interactions"
            icon="phone-portrait-outline"
            rightElement={
              <Switch
                value={vibrations}
                onValueChange={toggleVibrations}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
          <SettingItem
            title="Read Page Aloud"
            subtitle="Automatically read aloud page names"
            icon="volume-high-outline"
            rightElement={
              <Switch
                value={readPageAloud}
                onValueChange={toggleReadPageAloud}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
          <SettingItem
            title="Prevent Screenshots"
            subtitle="Block screenshots and screen recording"
            icon="eye-off-outline"
            rightElement={
              <Switch
                value={preventScreenCapture}
                onValueChange={togglePreventScreenCapture}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            }
            showChevron={false}
          />
        </ProfileSection>

        {/* Support & About */}
        <ProfileSection title="Support & About" defaultExpanded={false}>
          <SettingItem
            title="Support"
            subtitle="Get help and support"
            icon="headset-outline"
            onPress={() => router.push('/Support')}
          />
          <SettingItem
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            icon="document-text-outline"
            onPress={() => router.push('/terms')}
          />
          <SettingItem
            title="Privacy Policy"
            subtitle="Learn about data protection"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/privacy')}
          />
          <SettingItem
            title="Contact Us"
            subtitle="Get help or contact support"
            icon="help-circle-outline"
            onPress={handleContactUs}
          />
          <SettingItem
            title="Credits"
            subtitle="App contributors and technologies"
            people-outline
            icon="people-outline"
            onPress={() => router.push('/credits')}
          />
          <SettingItem
            title="About"
            subtitle="App version and information"
            icon="information-circle-outline"
            onPress={handleAbout}
          />
        </ProfileSection>

        {/* Sign Out */}
        <TouchableOpacity
          className="mt-6 items-center rounded-xl bg-red-500 p-4"
          onPress={handleSignOut}
        >
          <Text className="text-base font-semibold text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
