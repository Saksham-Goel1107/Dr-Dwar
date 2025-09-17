import { useClerk, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <View className="mb-6">
      <Text className="mb-3 text-lg font-semibold text-gray-800">{title}</Text>
      <View className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {children}
      </View>
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const lock = await SecureStore.getItemAsync('APP_LOCK');
      const notif = await SecureStore.getItemAsync('NOTIFICATIONS');
      setAppLock(lock === 'true');
      setNotifications(notif !== 'false'); // Default to true
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleAppLock = async (val: boolean) => {
    setLoading(true);
    try {
      if (val) {
        // Verify device supports authentication before enabling
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Device Lock Required',
            'Please set up biometric authentication or PIN in your device settings before enabling app lock.',
            [{ text: 'OK' }],
          );
          return;
        }
        await SecureStore.setItemAsync('APP_LOCK', 'true');
        setAppLock(true);
        Alert.alert('Success', 'App lock has been enabled.');
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
      await SecureStore.setItemAsync('NOTIFICATIONS', val.toString());
      setNotifications(val);
    } catch (error) {
      console.error('Error saving notification setting:', error);
      Alert.alert('Error', 'Failed to save notification setting.');
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

  const handleSupport = () => {
    Alert.alert('Support', 'For support, please contact sakshamgoel1107@gmail.com');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Dr-Dwar',
      'Dr-Dwar is your AI-powered health assistant.\n\nVersion: 1.0.0\n© 2025 Dr-Dwar Team',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-5">
        {/* User Profile Header */}
        <View className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <View className="items-center">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="mb-3 h-20 w-20 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="person" size={32} color="#3B82F6" />
              </View>
            )}
            <Text className="mb-1 text-xl font-bold text-gray-900">{user?.username || 'User'}</Text>
            <Text className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>
        </View>

        {/* Account Settings */}
        <ProfileSection title="Account">
          <SettingItem
            title="Edit Profile"
            subtitle="Update your personal information"
            icon="person-outline"
            onPress={handleEditProfile}
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
        <ProfileSection title="Security">
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
        </ProfileSection>

        {/* Support & About */}
        <ProfileSection title="Support & About">
          <SettingItem
            title="Help & Support"
            subtitle="Get help or contact support"
            icon="help-circle-outline"
            onPress={handleSupport}
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

        {/* Version Info */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-gray-400">Dr-Dwar v1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}
