import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
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
  const { cartItems, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const { user } = useUser();
  const [showPayment, setShowPayment] = React.useState(false);

  // Extract user data for Razorpay
  const userPhone = user?.phoneNumbers?.[0]?.phoneNumber || '';
  const userName =
    user?.username || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer';

  const handlePaymentSuccess = (data: any) => {
    setShowPayment(false);
    Alert.alert('Success', `Payment ID: ${data.razorpay_payment_id}`);
    // Here you can add logic to clear cart and navigate to success page
    router.back();
  };

  const handlePaymentFailure = (error: any) => {
    setShowPayment(false);
    Alert.alert('Error', 'Payment failed. Please try again.');
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
              style={{
                backgroundColor: '#059669',
                borderRadius: 12,
                paddingVertical: 4,
              }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              Proceed to Payment
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
              uri: `https://api.razorpay.com/v1/checkout/embedded?key_id=rzp_test_RIibXBoTRyGYcf&amount=${Math.round(getFinalTotal() * 100)}&currency=INR&name=${encodeURIComponent('Dr-Dwar Pharmacy')}&description=${encodeURIComponent('Medicine Purchase')}&prefill[contact]=${encodeURIComponent(userPhone)}&prefill[email]=${encodeURIComponent('user@example.com')}&prefill[name]=${encodeURIComponent(userName)}&theme[color]=%23059669`,
            }}
            onNavigationStateChange={(navState) => {
              // Handle payment success/failure based on URL changes
              if (navState.url.includes('success')) {
                handlePaymentSuccess({ razorpay_payment_id: 'test_payment_id' });
              } else if (navState.url.includes('failure')) {
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
