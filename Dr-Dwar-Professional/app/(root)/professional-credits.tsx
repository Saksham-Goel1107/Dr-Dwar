import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ProfessionalCreditsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [credits, setCredits] = useState(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [selectedCredits, setSelectedCredits] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [earnings, setEarnings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const earningsLoadedRef = useRef(false);
  const withdrawalsLoadedRef = useRef(false);
  const initialLoadRef = useRef(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    accountType: 'savings',
  });

  // Load vibration settings
  useEffect(() => {
    const loadVibrationSettings = async () => {
      try {
        const vib = await SecureStore.getItemAsync('VIBRATIONS');
        setVibrationsEnabled(vib !== 'false');
      } catch (error) {
        console.error('Error loading vibration settings:', error);
        setVibrationsEnabled(true);
      }
    };
    loadVibrationSettings();
  }, []);

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notification permissions are needed to send alerts.');
      }
    };
    requestPermissions();
  }, []);

  // Fetch professional's credit balance and dashboard stats
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoadingCredits(true);
      const token = await getToken();

      // Fetch dashboard stats
      const dashboardResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/dashboard`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const dashboardData = await dashboardResponse.json();

      if (dashboardData.success) {
        setCredits(dashboardData.data.currentBalance || 0);
        setDashboardStats(dashboardData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setCredits(0);
    } finally {
      setIsLoadingCredits(false);
    }
  }, [getToken]);

  // Fetch earnings history
  const fetchEarningsHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/earnings`,
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
        setEarnings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching earnings history:', error);
      setEarnings([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getToken]);

  // Fetch withdrawal history
  const fetchWithdrawalHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/withdrawals`,
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
        setWithdrawals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
      setWithdrawals([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getToken]);

  // Fetch bank account details
  const fetchBankAccount = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/bank-account`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const data = await response.json();
      if (data.success && data.data) {
        setBankAccount(data.data);
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
    }
  }, [getToken]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchDashboardData();
      fetchBankAccount();
    }
  }, [fetchDashboardData, fetchBankAccount]);

  // Custom network detection using NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    // Initial network check
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    earningsLoadedRef.current = false;
    withdrawalsLoadedRef.current = false;
    // Allow dashboard data to be re-fetched on refresh
    initialLoadRef.current = false;

    await Promise.all([
      fetchDashboardData(),
      fetchBankAccount(),
      activeTab === 'history' ? fetchEarningsHistory() : Promise.resolve(),
      activeTab === 'withdrawals' ? fetchWithdrawalHistory() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const handleSaveBankAccount = async () => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    if (
      !bankForm.accountHolderName ||
      !bankForm.accountNumber ||
      !bankForm.bankName ||
      !bankForm.ifscCode
    ) {
      Alert.alert('Missing Information', 'Please fill in all bank account details.');
      return;
    }

    // Basic IFSC validation
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankForm.ifscCode)) {
      Alert.alert('Invalid IFSC', 'Please enter a valid IFSC code.');
      return;
    }

    // Basic account number validation
    if (bankForm.accountNumber.length < 9 || bankForm.accountNumber.length > 18) {
      Alert.alert('Invalid Account Number', 'Account number should be between 9-18 digits.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/bank-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(bankForm),
        },
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Bank account details saved successfully!');
        setBankAccount(data.data);
        setShowBankForm(false);
        setBankForm({
          accountHolderName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          accountType: 'savings',
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      Alert.alert('Error', 'Failed to save bank account. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawalRequest = async (withdrawalAmount?: number) => {
    const amountToWithdraw = withdrawalAmount || selectedCredits;
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    if (!bankAccount) {
      Alert.alert('Bank Account Required', 'Please set up your bank account details first.');
      return;
    }

    if (amountToWithdraw < 100) {
      Alert.alert('Minimum Withdrawal', 'Please select at least 100 credits (₹100).');
      return;
    }

    if (credits < amountToWithdraw) {
      Alert.alert('Insufficient Credits', 'You do not have enough credits for this withdrawal.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Are you sure you want to withdraw ₹${amountToWithdraw}? This will deduct ${amountToWithdraw} credits from your account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);

            try {
              const token = await getToken();
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/professional-credits/withdraw`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true',
                  },
                  body: JSON.stringify({
                    credits: amountToWithdraw,
                  }),
                },
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Withdrawal request submitted successfully!');

                // Send success notification
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '💰 Withdrawal Requested!',
                    body: `Your withdrawal request for ₹${amountToWithdraw} has been submitted.`,
                    sound: 'default',
                  },
                  trigger: null,
                });

                // Use the backend's returned balance instead of calculating locally
                setCredits(data.data.newBalance);
                if (activeTab === 'withdrawals') {
                  fetchWithdrawalHistory();
                }
                setSelectedCredits(100);
                fetchDashboardData(); // Refresh dashboard stats
              } else {
                Alert.alert('Error', data.message || 'Failed to submit withdrawal request');
              }
            } catch (error) {
              console.error('Error submitting withdrawal:', error);
              Alert.alert('Error', 'Failed to submit withdrawal request. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Choose how you would like to contact our support team:', [
      {
        text: 'Email',
        onPress: () =>
          Linking.openURL('mailto:sakshamgoel1107@gmail.com?subject=Bank Account Change Request'),
      },
      {
        text: 'Phone',
        onPress: () => Linking.openURL('tel:+918882534712'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#3b82f6';
      case 'PROCESSING':
        return '#8b5cf6';
      case 'COMPLETED':
        return '#10b981';
      case 'REJECTED':
        return '#ef4444';
      case 'CANCELLED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatEarningSource = (source: string) => {
    switch (source) {
      case 'CONSULTATION':
        return 'Consultation Fee';
      case 'PRESCRIPTION_REVIEW':
        return 'Prescription Review';
      case 'PHARMACY_ORDER':
        return 'Pharmacy Commission';
      case 'TELEMEDICINE':
        return 'Telemedicine';
      case 'BONUS':
        return 'Bonus';
      case 'REFERRAL':
        return 'Referral Reward';
      default:
        return source;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
        {/* Professional Header */}
        <View
          style={{
            backgroundColor: '#16a34a',
            paddingTop: 45,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            shadowColor: '#16a34a',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 45,
              left: 20,
              zIndex: 1,
              padding: 8,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
            }}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.25)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <MaterialCommunityIcons name="wallet-outline" size={32} color="#ffffff" />
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: 12,
              }}
            >
              Available Credits
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              {isLoadingCredits ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff' }}>
                  {credits}
                </Text>
              )}
            </View>

            {/* Verification Status */}
            {dashboardStats && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: dashboardStats.isVerified
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(251, 191, 36, 0.2)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: dashboardStats.isVerified
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(251, 191, 36, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: '#ffffff',
                    }}
                  >
                    {dashboardStats.isVerified
                      ? '✓ Verified Professional'
                      : '⚠ Pending Verification'}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: 4,
                  }}
                >
                  {dashboardStats.role}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        {dashboardStats && (
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              marginTop: 15,
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                Total Earnings
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#16a34a' }}>
                ₹{dashboardStats.totalEarnings.amount}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>This Month</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>
                ₹{dashboardStats.monthlyEarnings.amount}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Pending</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f59e0b' }}>
                ₹{dashboardStats.pendingWithdrawals.amount}
              </Text>
            </View>
          </View>
        )}

        {/* Tab Navigation */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            marginHorizontal: 20,
            marginTop: 15,
            borderRadius: 12,
            padding: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: activeTab === 'history' ? '#16a34a' : 'transparent',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'history' ? '#ffffff' : '#64748b',
              }}
            >
              Earnings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('withdrawals')}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: activeTab === 'withdrawals' ? '#16a34a' : 'transparent',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'withdrawals' ? '#ffffff' : '#64748b',
              }}
            >
              Withdrawals
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        >
          {activeTab === 'history' ? (
            /* Earnings History */
            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
                  Earnings History
                </Text>
                {bankAccount && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Confirm Withdrawal',
                        `Are you sure you want to withdraw all your credits (₹${credits})? This will withdraw your entire balance of ${credits} credits.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Withdraw All',
                            onPress: () => {
                              handleWithdrawalRequest(credits);
                            },
                          },
                        ],
                      );
                    }}
                    disabled={!dashboardStats?.isVerified || credits < 100}
                    style={{
                      backgroundColor:
                        !dashboardStats?.isVerified || credits < 100 ? '#94a3b8' : '#16a34a',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                      Withdraw All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {!bankAccount && (
                <View style={{ marginBottom: 15 }}>
                  <View
                    style={{
                      backgroundColor: '#fef3c7',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#f59e0b',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="bank" size={24} color="#f59e0b" />
                      <Text
                        style={{ fontSize: 16, fontWeight: '600', color: '#92400e', marginLeft: 8 }}
                      >
                        Bank Account Required
                      </Text>
                    </View>
                    <Text style={{ color: '#92400e', marginBottom: 12 }}>
                      To withdraw your earnings, you need to set up your bank account details first.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowBankForm(true)}
                      style={{
                        backgroundColor: '#f59e0b',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text style={{ color: '#92400e', fontWeight: '600' }}>
                        Set Up Bank Account
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {bankAccount && (
                <View style={{ marginBottom: 15 }}>
                  <View
                    style={{
                      backgroundColor: '#f0fdf4',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#16a34a',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                        >
                          <MaterialCommunityIcons name="bank" size={20} color="#16a34a" />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '600',
                              color: '#16a34a',
                              marginLeft: 8,
                              marginRight: 8,
                            }}
                          >
                            {bankAccount.bankName}
                          </Text>
                          <View
                            style={{
                              backgroundColor: bankAccount.isVerified ? '#dcfce7' : '#fef3c7',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                              borderWidth: 1,
                              borderColor: bankAccount.isVerified ? '#16a34a' : '#f59e0b',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: bankAccount.isVerified ? '#166534' : '#92400e',
                              }}
                            >
                              {bankAccount.isVerified ? '✓ Verified' : '⚠ Pending'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: '#374151' }}>
                          {bankAccount.accountNumber} • {bankAccount.ifscCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleContactSupport}
                        style={{
                          backgroundColor: '#16a34a',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                          Contact Support
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {isLoadingHistory ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>
                    Loading earnings...
                  </Text>
                </View>
              ) : earnings.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 40,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <MaterialCommunityIcons name="cash-plus" size={48} color="#d1d5db" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#6b7280',
                      marginTop: 16,
                      textAlign: 'center',
                    }}
                  >
                    No Earnings Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#9ca3af',
                      marginTop: 8,
                      textAlign: 'center',
                    }}
                  >
                    Your earnings will appear here once you start providing services.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {earnings.map((earning: any) => (
                    <View
                      key={earning.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 12,
                        padding: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                        borderLeftWidth: 4,
                        borderLeftColor: '#16a34a',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                            {formatEarningSource(earning.source)}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                            {earning.description}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {new Date(earning.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}>
                            +{earning.credits} Credits
                          </Text>
                          <Text style={{ fontSize: 14, color: '#6b7280' }}>₹{earning.amount}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Secure Payment Info for Earnings Tab */}
              <View style={{ marginTop: 20, marginBottom: 10 }}>
                <View
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                  }}
                >
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <MaterialCommunityIcons name="shield-check" size={18} color="#16a34a" />
                    <Text
                      style={{ fontSize: 14, color: '#64748b', marginLeft: 8, textAlign: 'center' }}
                    >
                      Secure earnings tracking • Real-time updates • 24/7 support
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* Withdrawal History */
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}
              >
                Withdrawal History
              </Text>

              {isLoadingHistory ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>
                    Loading withdrawals...
                  </Text>
                </View>
              ) : withdrawals.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 40,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <MaterialCommunityIcons name="cash-minus" size={48} color="#d1d5db" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#6b7280',
                      marginTop: 16,
                      textAlign: 'center',
                    }}
                  >
                    No Withdrawals Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#9ca3af',
                      marginTop: 8,
                      textAlign: 'center',
                    }}
                  >
                    Your withdrawal requests will appear here.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {withdrawals.map((withdrawal: any) => (
                    <View
                      key={withdrawal.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 12,
                        padding: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                        borderLeftWidth: 4,
                        borderLeftColor: getStatusColor(withdrawal.status),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                            Withdrawal Request
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {new Date(withdrawal.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                          <View
                            style={{
                              backgroundColor: `${getStatusColor(withdrawal.status)}20`,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 8,
                              alignSelf: 'flex-start',
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: getStatusColor(withdrawal.status),
                              }}
                            >
                              {withdrawal.status.replace('_', ' ').toUpperCase()}
                            </Text>
                          </View>
                          {withdrawal.adminNotes && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                              Note: {withdrawal.adminNotes}
                            </Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626' }}>
                            -₹{withdrawal.amount}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>
                            {withdrawal.credits} Credits
                          </Text>
                          <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                            {withdrawal.bankAccount.bankName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Secure Payment Info for Withdrawals */}
          <View
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#059669" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginLeft: 8 }}>
                Secure Payment Information
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <MaterialCommunityIcons
                name="bank"
                size={16}
                color="#6b7280"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
                All withdrawals are processed through verified bank accounts with 256-bit SSL
                encryption
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#6b7280"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
                Processing time: 1-3 business days after verification
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color="#6b7280"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text style={{ fontSize: 14, color: '#4b5563', flex: 1 }}>
                Minimum withdrawal: ₹500 | Maximum withdrawal: ₹50,000 per transaction
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bank Account Form Modal */}
        {showBankForm && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 20,
                padding: 20,
                width: '100%',
                maxHeight: '80%',
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <MaterialCommunityIcons name="bank-plus" size={24} color="#16a34a" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginLeft: 8,
                    }}
                  >
                    Bank Account Details
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: 8,
                    }}
                  >
                    Account Holder Name
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                    }}
                    placeholder="Enter account holder name"
                    value={bankForm.accountHolderName}
                    onChangeText={(text) => setBankForm({ ...bankForm, accountHolderName: text })}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: 8,
                    }}
                  >
                    Account Number
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                    }}
                    placeholder="Enter account number"
                    keyboardType="numeric"
                    value={bankForm.accountNumber}
                    onChangeText={(text) => setBankForm({ ...bankForm, accountNumber: text })}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: 8,
                    }}
                  >
                    Bank Name
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                    }}
                    placeholder="Enter bank name"
                    value={bankForm.bankName}
                    onChangeText={(text) => setBankForm({ ...bankForm, bankName: text })}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: 8,
                    }}
                  >
                    IFSC Code
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#d1d5db',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                    }}
                    placeholder="Enter IFSC code"
                    autoCapitalize="characters"
                    value={bankForm.ifscCode}
                    onChangeText={(text) =>
                      setBankForm({ ...bankForm, ifscCode: text.toUpperCase() })
                    }
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => setShowBankForm(false)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 8,
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#374151', fontWeight: '600', textAlign: 'center' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveBankAccount}
                    disabled={isProcessing}
                    style={{
                      backgroundColor: isProcessing ? '#94a3b8' : '#16a34a',
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 8,
                      flex: 1,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
                      {isProcessing ? 'Saving...' : 'Save Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}
