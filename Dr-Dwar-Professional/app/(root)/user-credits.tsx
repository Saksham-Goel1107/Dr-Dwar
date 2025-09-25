import { useAuth, useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';

export default function UserCreditsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [credits, setCredits] = useState(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [selectedCredits, setSelectedCredits] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('credits');
  const [transactions, setTransactions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(250);

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

  // Fetch user's credit balance
  const fetchCreditBalance = async () => {
    try {
      setIsLoadingCredits(true);
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/credits/balance`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCredits(data.data.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      setCredits(0);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/credits/history`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = await response.json();
      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setTransactions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  useEffect(() => {
    fetchCreditBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && transactions.length === 0) {
      fetchTransactionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const handlePurchase = async () => {
    if (!networkStatus) {
      Alert.alert('No Internet', 'Please check your internet connection and try again.');
      return;
    }

    if (selectedCredits < 10) {
      Alert.alert('Minimum Purchase', 'Please select at least 10 credits.');
      return;
    }

    // Vibration feedback
    if (vibrationsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Open Razorpay payment
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setShowPayment(false);
    setIsProcessing(true);

    try {
      // Add credits after successful payment
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/credits/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          credits: selectedCredits,
          amount: selectedCredits,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success alert
        Alert.alert(
          'Success',
          `Payment successful! ${selectedCredits} credits added to your account.`,
        );

        // Send success notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎉 Credits Added Successfully!',
            body: `${selectedCredits} credits have been added to your account for ₹${selectedCredits}.`,
            sound: 'default',
          },
          trigger: null,
        });

        setCredits((prev) => prev + selectedCredits);
        if (activeTab === 'history') {
          fetchTransactionHistory();
        }
        setSelectedCredits(100);
      } else {
        Alert.alert('Error', data.message || 'Failed to add credits');
      }
    } catch (error) {
      console.error('Error adding credits:', error);
      Alert.alert(
        'Warning',
        'Payment successful but credit addition failed. Please contact support.',
      );

      // Still show success notification for payment
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Payment Successful',
          body: 'Your payment was processed successfully.',
          sound: 'default',
        },
        trigger: null,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = async (error: string) => {
    setShowPayment(false);
    Alert.alert(
      'Payment Failed',
      'Your payment could not be processed. Please try again or contact support if the issue persists.',
    );

    // Send failure notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💳 Payment Failed',
        body: "We couldn't process your payment. Please check your payment method and try again.",
        sound: 'default',
      },
      trigger: null,
    });
  };

  const getUserDetails = () => {
    const userName = user?.username || 'User';
    const userEmail = 'user@example.com';
    const userPhone = user?.phoneNumbers?.[0]?.phoneNumber || '';

    return { userName, userEmail, userPhone };
  };

  const { userName, userEmail, userPhone } = getUserDetails();

  if (showPayment) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              backgroundColor: '#ffffff',
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowPayment(false);
              }}
              style={{ padding: 8 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 16 }}>
              Payment
            </Text>
          </View>
          <WebView
            source={{
              uri: `https://api.razorpay.com/v1/checkout/embedded?key_id=${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}&amount=${selectedCredits * 100}&currency=INR&name=${encodeURIComponent('Dr-Dwar-Professional-Professional Credits')}&description=${encodeURIComponent(`${selectedCredits} Credits Purchase`)}&prefill[contact]=${encodeURIComponent(userPhone)}&prefill[email]=${encodeURIComponent(userEmail)}&prefill[name]=${encodeURIComponent(userName)}&theme[color]=%23059669&callback_url=https://success&redirect_url=https://failure`,
            }}
            onNavigationStateChange={(navState) => {
              if (navState.url.startsWith('https://success')) {
                const urlParams = new URLSearchParams(navState.url.split('?')[1]);
                const paymentId = urlParams.get('razorpay_payment_id');
                handlePaymentSuccess({ razorpay_payment_id: paymentId || 'unknown' });
              } else if (navState.url.startsWith('https://failure')) {
                handlePaymentFailure('Payment failed');
              }
            }}
            style={{ flex: 1 }}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
        {/* Modern Header */}
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
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                minWidth: 120,
                alignItems: 'center',
              }}
            >
              {isLoadingCredits ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ffffff' }}>
                  {credits}
                </Text>
              )}
            </View>
          </View>
        </View>

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
            onPress={() => setActiveTab('credits')}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: activeTab === 'credits' ? '#16a34a' : 'transparent',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: activeTab === 'credits' ? '#ffffff' : '#64748b',
              }}
            >
              Add Credits
            </Text>
          </TouchableOpacity>

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
              History
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, paddingTop: 15 }} showsVerticalScrollIndicator={false}>
          {activeTab === 'credits' ? (
            <>
              {/* Compact Benefits Section */}
              <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          backgroundColor: '#dbeafe',
                          padding: 8,
                          borderRadius: 12,
                          marginBottom: 6,
                        }}
                      >
                        <MaterialCommunityIcons name="doctor" size={20} color="#2563eb" />
                      </View>
                      <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                        Consultations
                      </Text>
                    </View>

                    <View style={{ alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          backgroundColor: '#fef3c7',
                          padding: 8,
                          borderRadius: 12,
                          marginBottom: 6,
                        }}
                      >
                        <MaterialCommunityIcons name="lightning-bolt" size={20} color="#d97706" />
                      </View>
                      <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                        Instant
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Credit Purchase Section */}
              <View style={{ paddingHorizontal: 20 }}>
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    padding: 25,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <MaterialCommunityIcons name="credit-card-plus" size={28} color="#16a34a" />
                    <Text
                      style={{ fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginLeft: 12 }}
                    >
                      Add Credits
                    </Text>
                  </View>

                  <Text
                    style={{ fontSize: 16, color: '#64748b', marginBottom: 25, lineHeight: 24 }}
                  >
                    Secure & instant credit top-up for seamless healthcare access
                  </Text>

                  {/* Selected Amount Display */}
                  <View
                    style={{
                      backgroundColor: '#f0fdf4',
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 25,
                      borderWidth: 2,
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
                        <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 4 }}>
                          Selected Amount
                        </Text>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>
                          {selectedCredits} Credits
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 4 }}>
                          Total Price
                        </Text>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>
                          ₹{selectedCredits}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Quick Select Buttons */}
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 15 }}
                  >
                    Popular Amounts
                  </Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 }}
                  >
                    {[100, 250, 500, 1000].map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => setSelectedCredits(amount)}
                        style={{
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          backgroundColor: selectedCredits === amount ? '#16a34a' : '#f8fafc',
                          borderRadius: 25,
                          borderWidth: 2,
                          borderColor: selectedCredits === amount ? '#16a34a' : '#e2e8f0',
                          minWidth: 80,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: selectedCredits === amount ? '#ffffff' : '#64748b',
                          }}
                        >
                          {amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Amount Slider */}
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 15 }}
                  >
                    Custom Amount
                  </Text>
                  <View style={{ marginBottom: 30 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                      <TouchableOpacity
                        onPress={() => setSelectedCredits(Math.max(10, selectedCredits - 50))}
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: '#fee2e2',
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 15,
                        }}
                      >
                        <MaterialCommunityIcons name="minus" size={24} color="#dc2626" />
                      </TouchableOpacity>

                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <View
                          style={{ height: 20, justifyContent: 'center', position: 'relative' }}
                          onLayout={(event) => {
                            const { width } = event.nativeEvent.layout;
                            setSliderWidth(width);
                          }}
                        >
                          <TouchableOpacity
                            style={{ height: 8, justifyContent: 'center' }}
                            onPress={(event) => {
                              const { locationX } = event.nativeEvent;
                              const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
                              const newValue = Math.round(10 + percentage * (5000 - 10));
                              setSelectedCredits(Math.max(10, Math.min(5000, newValue)));
                            }}
                          >
                            <View
                              style={{
                                height: 8,
                                backgroundColor: '#e2e8f0',
                                borderRadius: 4,
                              }}
                            >
                              <View
                                style={{
                                  height: 8,
                                  backgroundColor: '#16a34a',
                                  borderRadius: 4,
                                  width: `${((selectedCredits - 10) / (5000 - 10)) * 100}%`,
                                }}
                              />
                            </View>
                          </TouchableOpacity>

                          <PanGestureHandler
                            onGestureEvent={(event) => {
                              const { x } = event.nativeEvent;
                              const percentage = Math.max(0, Math.min(1, x / sliderWidth));
                              const newValue = Math.round(10 + percentage * (5000 - 10));
                              setSelectedCredits(Math.max(10, Math.min(5000, newValue)));
                            }}
                          >
                            <Animated.View
                              style={{
                                position: 'absolute',
                                left: Math.max(
                                  0,
                                  Math.min(
                                    sliderWidth - 20,
                                    ((selectedCredits - 10) / (5000 - 10)) * sliderWidth - 10,
                                  ),
                                ),
                                top: -1,
                                width: 20,
                                height: 20,
                                backgroundColor: '#16a34a',
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: '#ffffff',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                              }}
                            />
                          </PanGestureHandler>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => setSelectedCredits(Math.min(5000, selectedCredits + 50))}
                        style={{
                          width: 44,
                          height: 44,
                          backgroundColor: '#dcfce7',
                          borderRadius: 22,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginLeft: 15,
                        }}
                      >
                        <MaterialCommunityIcons name="plus" size={24} color="#16a34a" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>Min: ₹10</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>Max: ₹5000</Text>
                    </View>
                  </View>

                  {/* Purchase Button */}
                  <TouchableOpacity
                    onPress={handlePurchase}
                    disabled={isProcessing || !networkStatus}
                    style={{
                      backgroundColor: isProcessing || !networkStatus ? '#94a3b8' : '#16a34a',
                      borderRadius: 16,
                      paddingVertical: 18,
                      paddingHorizontal: 24,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#16a34a',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    {!isProcessing && (
                      <MaterialCommunityIcons
                        name="credit-card"
                        size={24}
                        color="#ffffff"
                        style={{ marginRight: 12 }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                      }}
                    >
                      {isProcessing
                        ? 'Processing Payment...'
                        : !networkStatus
                          ? 'No Internet Connection'
                          : `Pay ₹${selectedCredits} Securely`}
                    </Text>
                  </TouchableOpacity>

                  {/* Security Badge */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 15,
                    }}
                  >
                    <MaterialCommunityIcons name="shield-check" size={16} color="#16a34a" />
                    <Text style={{ fontSize: 14, color: '#64748b', marginLeft: 6 }}>
                      Secured by Razorpay
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Transaction History */
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 }}
              >
                Transaction History
              </Text>

              {isLoadingHistory ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>
                    Loading transactions...
                  </Text>
                </View>
              ) : transactions.length === 0 ? (
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
                  <MaterialCommunityIcons name="history" size={48} color="#94a3b8" />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#64748b',
                      marginTop: 16,
                      marginBottom: 8,
                    }}
                  >
                    No Transactions Yet
                  </Text>
                  <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                    Your credit purchase history will appear here
                  </Text>
                </View>
              ) : (
                transactions.map((transaction: any, index: number) => (
                  <View
                    key={transaction.id || index}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 4,
                      borderLeftWidth: 4,
                      borderLeftColor: '#16a34a',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: '#dcfce7',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12,
                            }}
                          >
                            <MaterialCommunityIcons name="plus-circle" size={20} color="#16a34a" />
                          </View>
                          <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                              Credits Added
                            </Text>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              Payment ID: {transaction.paymentId || 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}>
                          +{transaction.credits}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          ₹{transaction.amount}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#f1f5f9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#64748b" />
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="clock" size={16} color="#64748b" />
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>
                          {new Date(transaction.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: '#dcfce7',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#16a34a' }}>
                          SUCCESS
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Compact Footer */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, marginTop: 15 }}>
          <View
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#16a34a" />
              <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 6, textAlign: 'center' }}>
                Credits never expire • Secure payments • 24/7 support
              </Text>
            </View>
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
