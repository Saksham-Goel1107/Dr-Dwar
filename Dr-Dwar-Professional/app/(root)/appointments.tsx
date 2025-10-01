import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface DoctorStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingConfirmations: number;
  totalEarnings: number;
}

export default function AppointmentsIndexScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DoctorStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingConfirmations: 0,
    totalEarnings: 0,
  });

  // Refs to prevent infinite loading
  const dataLoadedRef = useRef(false);
  const prevNetworkStatusRef = useRef<boolean | null>(null);

  // Haptics setting
  const vibrationsEnabled = true;

  const isVerified = user?.publicMetadata?.isverified ?? false;

  // Load network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch doctor statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctor/stats`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [getToken]);

  useEffect(() => {
    const prevStatus = prevNetworkStatusRef.current;
    prevNetworkStatusRef.current = networkStatus;

    // Only load if network just became available and we haven't loaded data yet
    if (networkStatus && !prevStatus && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      if (isVerified) {
        fetchStats().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else if (!isVerified) {
      setIsLoading(false);
    }
  }, [networkStatus, isVerified, fetchStats]);

  const handleNavigation = (route: string) => {
    if (!isVerified) {
      Alert.alert(
        'Verification Required',
        'Please complete your verification process before managing appointments.',
        [
          {
            text: 'Go to Guide',
            onPress: () => router.push('/guide-doctor'),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    router.push(route as any);
  };

  const appointmentOptions = [
    {
      title: 'Set Availability',
      description: 'Configure your working hours and consultation slots',
      icon: 'calendar-clock',
      route: '/doctor-availability',
      color: '#3b82f6',
      available: true,
    },
    {
      title: 'Manage Fees',
      description: 'Set consultation fees and service durations',
      icon: 'cash-multiple',
      route: '/doctor-fees',
      color: '#10b981',
      available: true,
    },
    {
      title: 'My Appointments',
      description: 'View and manage patient appointments',
      icon: 'calendar-check',
      route: '/doctor-appointments',
      color: '#f59e0b',
      available: isVerified,
    },
  ];

  if (!networkStatus) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="wifi-off" size={48} color="#6b7280" />
        <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          No Internet Connection
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ fontSize: 16, color: '#64748b', marginTop: 16 }}>
          Loading appointment dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#16a34a',
          paddingTop: 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
            Appointment Management
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            Manage your practice and patient appointments
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Verification Status */}
        {!isVerified && (
          <View
            style={{
              margin: 20,
              padding: 16,
              backgroundColor: '#fef3c7',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#f59e0b',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#f59e0b" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#92400e', marginLeft: 8 }}>
                Verification Required
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#92400e', marginBottom: 12 }}>
              Complete your verification to start accepting appointments.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/guide-doctor')}
              style={{
                backgroundColor: '#f59e0b',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>
                Complete Verification
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        {isVerified && (
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 16 }}>
              Today&apos;s Overview
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              <View
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginRight: '4%',
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons name="calendar-today" size={24} color="#3b82f6" />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 }}>
                  {stats.todayAppointments}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Today&apos;s Appointments</Text>
              </View>

              <View
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons name="clock-outline" size={24} color="#f59e0b" />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 }}>
                  {stats.pendingConfirmations}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Pending Confirmations</Text>
              </View>

              <View
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginRight: '4%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons name="calendar-multiple" size={24} color="#10b981" />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 }}>
                  {stats.totalAppointments}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Total Appointments</Text>
              </View>

              <View
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons name="cash" size={24} color="#8b5cf6" />
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 8 }}>
                  ₹{stats.totalEarnings}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Total Earnings</Text>
              </View>
            </View>
          </View>
        )}

        {/* Management Options */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 16 }}>
            Management Tools
          </Text>

          {appointmentOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNavigation(option.route)}
              disabled={!option.available}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                opacity: option.available ? 1 : 0.6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: option.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={option.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 }}
                  >
                    {option.title}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>{option.description}</Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={option.available ? '#9ca3af' : '#d1d5db'}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        {isVerified && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 16 }}>
              Quick Actions
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <TouchableOpacity
                onPress={() => handleNavigation('/doctor-appointments')}
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginRight: '4%',
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="calendar-plus" size={24} color="#16a34a" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#1e293b',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  View Today&apos;s Schedule
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigation('/professional-credits')}
                style={{
                  width: '48%',
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="wallet" size={24} color="#16a34a" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#1e293b',
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Check Earnings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
