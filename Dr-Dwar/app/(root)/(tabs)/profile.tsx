import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupMode, setMfaSetupMode] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setMfaEnabled(user.twoFactorEnabled || false);
    }
  }, [user]);

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

  const toggleMFA = async (val: boolean) => {
    if (val) {
      await enableMFA();
    } else {
      await disableMFA();
    }
  };

  const enableMFA = async () => {
    try {
      if (!user) return;
      const totpResource = await user.createTOTP();
      setTotpUri(totpResource.uri || '');
      setTotpSecret(totpResource.secret || '');
      setMfaSetupMode(true);
    } catch (error) {
      console.error('Error enabling MFA:', error);
      Alert.alert('Error', 'Failed to enable MFA. Please try again.');
    }
  };

  const verifyMFASetup = async () => {
    try {
      if (!user || !setupCode) return;
      await user.verifyTOTP({ code: setupCode });
      // Create backup codes
      const backupResource = await user.createBackupCode();
      setBackupCodes(backupResource.codes);
      setMfaEnabled(true);
      setMfaSetupMode(false);
      setSetupCode('');
      setTotpUri('');
      setTotpSecret('');
      setShowBackupModal(true);
    } catch (error) {
      console.error('Error verifying MFA setup:', error);
      Alert.alert('Error', 'Invalid code. Please try again.');
    }
  };

  const cancelMFASetup = () => {
    setMfaSetupMode(false);
    setTotpUri('');
    setTotpSecret('');
    setSetupCode('');
  };

  const copySecretKey = async () => {
    if (totpSecret) {
      await Clipboard.setStringAsync(totpSecret);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied', 'Secret key copied to clipboard');
    }
  };

  const copyBackupCodes = async () => {
    try {
      const codesText = backupCodes.join('\n');
      await Clipboard.setStringAsync(codesText);
      Alert.alert('Copied', 'Recovery codes copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy recovery codes');
    }
  };

  const disableMFA = async () => {
    // If app lock is enabled, require biometric/PIN verification before disabling
    if (appLock) {
      try {
        // Verify device supports authentication
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometric Required',
            'Please set up biometric authentication or PIN in your device settings to disable MFA.',
            [{ text: 'OK' }],
          );
          return;
        }

        // Request biometric authentication before disabling MFA
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to disable MFA',
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (!authResult.success) {
          Alert.alert(
            'Authentication Failed',
            'Authentication is required to disable MFA. Please try again.',
            [{ text: 'OK' }],
          );
          return;
        }

        // Proceed with disabling MFA after successful authentication
        await proceedWithMFADisable();
      } catch (error) {
        console.error('Error with biometric authentication:', error);
        Alert.alert('Error', 'Failed to authenticate. Please try again.');
      }
    } else {
      await proceedWithMFADisable();
    }
  };

  const proceedWithMFADisable = async () => {
    try {
      if (!user) return;
      await user.disableTOTP();
      setMfaEnabled(false);
      Alert.alert('Success', 'MFA has been disabled.');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      Alert.alert('Error', 'Failed to disable MFA. Please try again.');
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

  // Define all sections and their items for filtering
  const allSections = [
    {
      title: 'Account',
      items: [
        {
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: 'person-outline',
          onPress: handleEditProfile,
        },
        {
          title: 'Edit Basic Info',
          subtitle: 'Update your healthcare profile',
          icon: 'create-outline',
          onPress: () => router.push('../edit-basic-info'),
        },
        {
          title: 'View Orders',
          subtitle: 'Check your order history',
          icon: 'bag-handle-outline',
          onPress: () => router.push('/orders'),
        },
        {
          title: 'My Appointments',
          subtitle: 'View and manage your appointments',
          icon: 'calendar-outline',
          onPress: () => (router as any).push('/(root)/my-appointments'),
        },
      ],
    },
    {
      title: 'Notifications & Preferences',
      items: [
        {
          title: 'Notifications',
          subtitle: 'Receive app notifications',
          icon: 'notifications-outline',
          isSwitch: true,
          value: notifications,
          onValueChange: toggleNotifications,
        },
        {
          title: 'Vibrations',
          subtitle: 'Haptic feedback for interactions',
          icon: 'phone-portrait-outline',
          isSwitch: true,
          value: vibrations,
          onValueChange: toggleVibrations,
        },
        {
          title: 'Read Page Aloud',
          subtitle: 'Automatically read aloud page names',
          icon: 'volume-high-outline',
          isSwitch: true,
          value: readPageAloud,
          onValueChange: toggleReadPageAloud,
        },
        {
          title: 'Shake to Report Bug',
          subtitle: 'Shake device to report issues',
          icon: 'bug-outline',
          isSwitch: true,
          value: shakeToReport,
          onValueChange: toggleShakeToReport,
        },
        {
          title: 'Send Diagnostic Data',
          subtitle: 'Help improve app with crash reports',
          icon: 'analytics-outline',
          isSwitch: true,
          value: sendDiagnosticData,
          onValueChange: toggleSendDiagnosticData,
        },
      ],
    },
    {
      title: 'Security & Privacy',
      items: [
        {
          title: 'App Lock',
          subtitle: 'Use device PIN or biometric',
          icon: 'lock-closed-outline',
          isSwitch: true,
          value: appLock,
          onValueChange: toggleAppLock,
          disabled: loading,
        },
        {
          title: 'Prevent Screenshots',
          subtitle: 'Block screenshots and screen recording',
          icon: 'eye-off-outline',
          isSwitch: true,
          value: preventScreenCapture,
          onValueChange: togglePreventScreenCapture,
        },
        {
          title: 'Multi-Factor Authentication',
          subtitle: 'Add an extra layer of security',
          icon: 'shield-checkmark-outline',
          isSwitch: true,
          value: mfaEnabled,
          onValueChange: toggleMFA,
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          title: 'Support',
          subtitle: 'Get help and support',
          icon: 'headset-outline',
          onPress: () => router.push('/Support'),
        },
        {
          title: 'Contact Us',
          subtitle: 'Get help or contact support',
          icon: 'help-circle-outline',
          onPress: handleContactUs,
        },
        {
          title: 'Terms of Service',
          subtitle: 'Read our terms and conditions',
          icon: 'document-text-outline',
          onPress: () => router.push('/terms'),
        },
        {
          title: 'Privacy Policy',
          subtitle: 'Learn about data protection',
          icon: 'shield-checkmark-outline',
          onPress: () => router.push('/privacy'),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          title: 'Credits',
          subtitle: 'App contributors and technologies',
          icon: 'people-outline',
          onPress: () => router.push('/credits'),
        },
        {
          title: 'About',
          subtitle: 'App version and information',
          icon: 'information-circle-outline',
          onPress: handleAbout,
        },
      ],
    },
  ]; // Filter sections and items based on search query
  const filteredSections = searchQuery
    ? allSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((section) => section.items.length > 0)
    : allSections;

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

        {/* Search Bar */}
        <View className="mb-6">
          <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="ml-3 flex-1 text-base text-gray-900"
              placeholder="Search settings..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Dynamic Sections Rendering */}
        {filteredSections.map((section) => (
          <ProfileSection key={section.title} title={section.title} defaultExpanded={false}>
            {section.items.map((item, index) => (
              <SettingItem
                key={index}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                rightElement={
                  'isSwitch' in item && item.isSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      disabled={'disabled' in item ? item.disabled : false}
                      trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                      thumbColor="#FFFFFF"
                    />
                  ) : undefined
                }
                showChevron={
                  !('isSwitch' in item && item.isSwitch) && !!('onPress' in item && item.onPress)
                }
                onPress={'onPress' in item ? item.onPress : undefined}
              />
            ))}
          </ProfileSection>
        ))}

        {/* MFA Setup */}
        {mfaSetupMode && (
          <View className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <Text className="mb-4 text-lg font-semibold text-gray-800">
              Set up Multi-Factor Authentication
            </Text>
            <Text className="mb-4 text-sm text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), or
              manually enter the secret key below.
            </Text>
            {totpUri && (
              <View className="mb-4 items-center">
                <QRCode value={totpUri} size={200} />
              </View>
            )}
            {totpSecret && (
              <View className="mb-4 rounded-lg bg-gray-50 p-3">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-xs text-gray-500">Secret Key (manual entry):</Text>
                  <TouchableOpacity
                    onPress={copySecretKey}
                    className="flex-row items-center rounded bg-blue-100 px-2 py-1"
                  >
                    <Ionicons name="copy-outline" size={12} color="#3B82F6" />
                    <Text className="ml-1 text-xs font-medium text-blue-600">Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text className="break-all font-mono text-sm text-gray-800">{totpSecret}</Text>
              </View>
            )}
            <Text className="mb-2 text-sm text-gray-600">
              Enter the 6-digit code from your app:
            </Text>
            <TextInput
              value={setupCode}
              onChangeText={setSetupCode}
              maxLength={6}
              keyboardType="numeric"
              className="mb-4 rounded-lg border border-gray-300 p-3 text-center text-lg"
              placeholder="000000"
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={cancelMFASetup}
                className="rounded-lg bg-gray-300 px-4 py-2"
              >
                <Text className="font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={verifyMFASetup}
                disabled={!setupCode || setupCode.length !== 6}
                className={`rounded-lg px-4 py-2 ${
                  setupCode && setupCode.length === 6 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    setupCode && setupCode.length === 6 ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Verify & Enable
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          className="mt-6 items-center rounded-xl bg-red-500 p-4"
          onPress={handleSignOut}
        >
          <Text className="text-base font-semibold text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Backup Codes Modal */}
      <Modal
        visible={showBackupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="mx-4 max-h-96 w-full max-w-md rounded-xl bg-white p-6">
            <Text className="mb-4 text-xl font-bold text-gray-800">Recovery Codes</Text>
            <Text className="mb-4 text-sm text-gray-600">
              Save these recovery codes in a safe place. Each code can be used only once to sign in
              if you lose access to your authenticator app.
            </Text>
            <ScrollView className="max-h-40 rounded-lg bg-gray-50 p-3">
              {backupCodes.map((code, index) => (
                <Text key={index} className="mb-2 font-mono text-sm text-gray-800">
                  {index + 1}. {code}
                </Text>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={copyBackupCodes} className="mt-4 rounded-lg bg-blue-500 p-3">
              <Text className="text-center font-medium text-white">Copy Codes</Text>
            </TouchableOpacity>
            <View className="mt-4 flex-row items-center">
              <TouchableOpacity
                onPress={() => setBackupCodesSaved(!backupCodesSaved)}
                className="mr-3 h-5 w-5 items-center justify-center rounded border-2 border-gray-300"
              >
                {backupCodesSaved && <Ionicons name="checkmark" size={16} color="#3B82F6" />}
              </TouchableOpacity>
              <Text className="flex-1 text-sm text-gray-700">I have saved the recovery codes</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowBackupModal(false);
                setBackupCodesSaved(false);
              }}
              disabled={!backupCodesSaved}
              className={`mt-4 rounded-lg p-3 ${backupCodesSaved ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <Text
                className={`text-center font-medium ${
                  backupCodesSaved ? 'text-white' : 'text-gray-500'
                }`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
