import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useCart } from '../../contexts/CartContext';

type CartItem = {
  'Sr No': string;
  'Drug Code': string;
  'Generic Name': string;
  'Unit Size': string;
  MRP: string;
  quantity: number;
};

export default function CartScreen() {
  const { cartItems, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [showPayment, setShowPayment] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notification permissions are needed to send alerts.');
      }
    };
    requestPermissions();
  }, []);

  // Extract user data for Razorpay
  const userPhone = user?.phoneNumbers?.[0]?.phoneNumber || '';
  const userName =
    user?.username || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer';

  const handlePaymentSuccess = async (data: any) => {
    setShowPayment(false);
    setIsProcessing(true);

    try {
      // Prepare order data
      const orderData = {
        userId: user?.id,
        userName: userName,
        userPhone: userPhone,
        userEmail: user?.primaryEmailAddress?.emailAddress || '',
        items: cartItems.map((item) => ({
          srNo: item['Sr No'],
          drugCode: item['Drug Code'],
          genericName: item['Generic Name'],
          unitSize: item['Unit Size'],
          mrp: parseFloat(item.MRP),
          quantity: item.quantity,
          totalPrice: parseFloat(item.MRP) * item.quantity,
        })),
        subtotal: getTotalPrice(),
        taxAmount: getTaxAmount(),
        deliveryCharges: getDeliveryCharges(),
        totalAmount: getFinalTotal(),
        paymentId: data.razorpay_payment_id,
      };

      // Send order to backend
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Only for local testing with ngrok
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      const orderResult = await response.json();

      // Clear the cart
      clearCart();

      // Show success alert
      Alert.alert(
        'Success',
        `Payment successful! Order ID: ${orderResult.orderId || data.razorpay_payment_id}`,
      );

      // Send success notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Order Placed Successfully!',
          body: `Your order for ₹${getFinalTotal().toFixed(2)} has been confirmed. Order ID: ${orderResult.orderId || data.razorpay_payment_id}`,
          sound: 'default',
        },
        trigger: null,
      });

      router.replace('/(root)/(tabs)/pharmacy');
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Warning', 'Payment successful but order saving failed. Please contact support.');

      // Still clear cart and show success notification
      clearCart();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Payment Successful',
          body: 'Your payment was processed successfully.',
          sound: 'default',
        },
        trigger: null,
      });
      router.replace('/(root)/(tabs)/pharmacy');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = async (error: any) => {
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

  const getTaxAmount = () => {
    return getTotalPrice() * 0.18;
  };

  const getDeliveryCharges = () => {
    return getTotalPrice() > 500 ? 0 : 50;
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getTaxAmount() + getDeliveryCharges();
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Card
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 2,
      }}
    >
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: 4,
              }}
            >
              {item['Generic Name']}
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
              {item['Unit Size']} • Code: {item['Drug Code']}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669' }}>
                ₹{item.MRP}
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginLeft: 4 }}>per pack</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => updateQuantity(item['Sr No'], 0)} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <Divider style={{ marginVertical: 12 }} />

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => updateQuantity(item['Sr No'], item.quantity - 1)}
              style={{
                backgroundColor: '#ef4444',
                margin: 0,
              }}
              iconColor="white"
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#1e293b',
                marginHorizontal: 16,
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {item.quantity}
            </Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => updateQuantity(item['Sr No'], item.quantity + 1)}
              style={{
                backgroundColor: '#059669',
                margin: 0,
              }}
              iconColor="white"
            />
          </View>

          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
            ₹{(parseFloat(item.MRP) * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </Card>
  );

  const EmptyCart = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      }}
    >
      <Ionicons name="cart-outline" size={80} color="#cbd5e1" />
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#64748b',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Your cart is empty
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Add some medicines to get started
      </Text>
      <Button
        mode="contained"
        onPress={() => router.replace('/(root)/(tabs)/pharmacy')}
        style={{
          backgroundColor: '#059669',
          borderRadius: 12,
          paddingHorizontal: 16,
        }}
        labelStyle={{ fontSize: 16, fontWeight: '600' }}
      >
        Browse Medicines
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e293b',
            marginLeft: 16,
            flex: 1,
          }}
        >
          Shopping Cart
        </Text>
        {cartItems.length > 0 && (
          <Text style={{ fontSize: 16, color: '#64748b' }}>{getTotalItems()} items</Text>
        )}
      </View>

      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item['Sr No']}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Checkout Section */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              elevation: 8,
            }}
          >
            {/* Price Breakdown */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: '#64748b' }}>
                  Subtotal ({getTotalItems()} items)
                </Text>
                <Text style={{ fontSize: 14, color: '#1e293b' }}>
                  ₹{getTotalPrice().toFixed(2)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: '#64748b' }}>Tax (GST 18%)</Text>
                <Text style={{ fontSize: 14, color: '#1e293b' }}>₹{getTaxAmount().toFixed(2)}</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 14, color: '#64748b' }}>Delivery Charges</Text>
                <Text style={{ fontSize: 14, color: '#1e293b' }}>
                  ₹{getDeliveryCharges().toFixed(2)}
                </Text>
              </View>

              <Divider style={{ marginBottom: 12 }} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#059669' }}>
                  ₹{getFinalTotal().toFixed(2)}
                </Text>
              </View>

              {getTotalPrice() > 500 && (
                <Text style={{ fontSize: 12, color: '#059669', marginTop: 4, textAlign: 'right' }}>
                  🎉 Free delivery on orders above ₹500!
                </Text>
              )}
            </View>

            <Button
              mode="contained"
              onPress={() => setShowPayment(true)}
              disabled={isProcessing}
              loading={isProcessing}
              style={{
                backgroundColor: isProcessing ? '#9ca3af' : '#059669',
                borderRadius: 12,
                paddingVertical: 4,
              }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              {isProcessing ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </View>
        </>
      )}

      {showPayment && (
        <View
          style={{
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0',
            }}
          >
            <TouchableOpacity onPress={() => setShowPayment(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 16 }}>
              Payment
            </Text>
          </View>
          <WebView
            source={{
              uri: `https://api.razorpay.com/v1/checkout/embedded?key_id=${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}&amount=${Math.round(getFinalTotal() * 100)}&currency=INR&name=${encodeURIComponent('Dr-Dwar Pharmacy')}&description=${encodeURIComponent('Medicine Purchase')}&prefill[contact]=${encodeURIComponent(userPhone)}&prefill[email]=${encodeURIComponent('user@example.com')}&prefill[name]=${encodeURIComponent(userName)}&theme[color]=%23059669&callback_url=https://success&redirect_url=https://failure`,
            }}
            onNavigationStateChange={(navState) => {
              // Handle payment success/failure based on URL changes
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
      )}
    </SafeAreaView>
  );
}
