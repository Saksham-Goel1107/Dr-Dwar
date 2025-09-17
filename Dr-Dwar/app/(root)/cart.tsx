import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React from 'react';
import { Alert, FlatList, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';

// Define CartItem type according to your cart item structure
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

  const getTaxAmount = () => {
    return getTotalPrice() * 0.18;
  };

  const getDeliveryCharges = () => {
    return getTotalPrice() > 500 ? 0 : 50;
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getTaxAmount() + getDeliveryCharges();
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
      return;
    }

    Alert.alert('Confirm Order', `Total: ₹${getFinalTotal().toFixed(2)}\nProceed with checkout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            // Check notification permissions before sending
            const { status } = await Notifications.getPermissionsAsync();

            if (status === 'granted') {
              // Send order confirmation notification
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Order Confirmed! 🎉',
                  body: `Your order of ${getTotalItems()} items totaling ₹${getFinalTotal().toFixed(2)} has been placed successfully.`,
                  sound: 'default',
                  data: {
                    orderId: `ORD-${Date.now()}`,
                    totalItems: getTotalItems(),
                    totalAmount: getFinalTotal(),
                  },
                },
                trigger: null, // Show immediately
              });
            }

            // Show success alert
            Alert.alert(
              'Order Placed Successfully!',
              `Your order has been confirmed. ${status === 'granted' ? 'You will receive a notification with order details.' : ''}`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.replace('/(root)/(tabs)/pharmacy');
                  },
                },
              ],
            );
          } catch (error) {
            console.error('Error processing order:', error);
            Alert.alert('Success!', 'Your order has been placed successfully.');
            router.back();
          }
        },
      },
    ]);
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
              onPress={handleCheckout}
              style={{
                backgroundColor: '#059669',
                borderRadius: 12,
                paddingVertical: 4,
              }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              Proceed to Checkout
            </Button>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
