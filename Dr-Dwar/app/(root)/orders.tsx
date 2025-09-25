import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  orderId: string;
  amount: number;
  status: OrderStatus;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
  payments?: {
    id: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
  }[];
};

const statusConfig = {
  PENDING: { color: '#fbbf24', icon: 'time-outline', label: 'Order Placed' },
  CONFIRMED: { color: '#3b82f6', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  PROCESSING: { color: '#8b5cf6', icon: 'construct-outline', label: 'Processing' },
  PACKED: { color: '#06b6d4', icon: 'cube-outline', label: 'Packed' },
  OUT_FOR_DELIVERY: { color: '#f59e0b', icon: 'bicycle-outline', label: 'Out for Delivery' },
  DELIVERED: { color: '#10b981', icon: 'checkmark-done-circle-outline', label: 'Delivered' },
  CANCELLED: { color: '#ef4444', icon: 'close-circle-outline', label: 'Cancelled' },
  REFUNDED: { color: '#6b7280', icon: 'return-up-back-outline', label: 'Refunded' },
};

const getDeliveryProgress = (status: OrderStatus) => {
  const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = steps.indexOf(status);
  return {
    currentStep: currentIndex + 1,
    totalSteps: steps.length,
    completedSteps: currentIndex + 1,
  };
};

const getApprovalStatus = (isApproved: boolean) => ({
  color: isApproved ? '#10b981' : '#f59e0b',
  icon: isApproved ? 'checkmark-circle' : 'alert-circle',
  label: isApproved ? 'Approved' : 'Pending Approval',
});

export default function OrdersScreen() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = React.useState<boolean | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedOrders, setCachedOrders] = useState<Order[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchOrders = useCallback(
    async (forceRefresh = false) => {
      // Check if offline
      if (networkStatus === false) {
        setIsOffline(true);
        if (cachedOrders.length > 0) {
          setOrders(cachedOrders);
        } else {
          setOrders([]);
        }
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setIsOffline(false);

      try {
        // Use cache if available and not forcing refresh
        const now = Date.now();
        if (!forceRefresh && cachedOrders.length > 0 && now - lastFetchTime < CACHE_DURATION) {
          setOrders(cachedOrders);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const token = await getToken();
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        const fetchedOrders = data.orders || [];

        // Update cache
        setCachedOrders(fetchedOrders);
        setLastFetchTime(now);
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, cachedOrders, lastFetchTime, CACHE_DURATION, networkStatus],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline. Please check your connection.');
      return;
    }
    setRefreshing(true);
    fetchOrders(true); // Force refresh
  }, [fetchOrders, isOffline]);

  // Memoized formatters to prevent unnecessary re-renders
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Custom network detection using NetInfo
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
      setIsOffline(!isConnected);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
      setIsOffline(!isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Alternative simple network check
  const simpleNetworkCheck = async () => {
    try {
      const state = await NetInfo.fetch();
      // Simple check: if connected to any network, assume internet access
      const isOnline = state.isConnected === true;
      console.log('Simple network check:', {
        isConnected: state.isConnected,
        type: state.type,
      });
      return isOnline;
    } catch (error) {
      console.error('Simple network check failed:', error);
      return false;
    }
  };

  // Use simple check as fallback
  React.useEffect(() => {
    const checkNetwork = async () => {
      const isOnline = await simpleNetworkCheck();
      if (networkStatus === null) {
        setNetworkStatus(isOnline);
      }
    };

    if (networkStatus === null) {
      checkNetwork();
    }
  }, [networkStatus]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }, []);

  const renderOrderItem = useCallback(
    ({ item }: { item: OrderItem }) => (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          backgroundColor: '#f8fafc',
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.itemName}</Text>
          <Text style={{ fontSize: 12, color: '#64748b' }}>
            Qty: {item.quantity} × {formatCurrency(item.price)}
          </Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669' }}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
      </View>
    ),
    [formatCurrency],
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: Order }) => {
      const isExpanded = expandedOrder === item.id;
      const totalItems = item.orderItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0);
      const statusInfo = statusConfig[item.status];
      const approvalInfo = getApprovalStatus(item.isApproved);

      return (
        <Card
          style={{
            marginHorizontal: 16,
            marginVertical: 8,
            borderRadius: 12,
            elevation: 2,
            backgroundColor: 'white',
            borderLeftWidth: 4,
            borderLeftColor: statusInfo.color,
          }}
        >
          <TouchableOpacity
            onPress={() => setExpandedOrder(isExpanded ? null : item.id)}
            style={{ padding: 16 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginRight: 8 }}
                  >
                    {item.orderId}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {/* Delivery Status */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                    </View>
                  </View>
                </View>

                <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''} • {formatDate(item.createdAt)}
                </Text>

                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#059669' }}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View>
              <Divider style={{ marginHorizontal: 16 }} />

              <View style={{ padding: 16 }}>
                {/* Status Details */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}
                  >
                    Order Status
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Approval Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name={approvalInfo.icon as any}
                        size={16}
                        color={approvalInfo.color}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: approvalInfo.color,
                          marginLeft: 4,
                          fontWeight: '600',
                        }}
                      >
                        {approvalInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Delivery Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
                      <Text
                        style={{
                          fontSize: 14,
                          color: statusInfo.color,
                          marginLeft: 4,
                          fontWeight: '600',
                        }}
                      >
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Delivery Progress Indicator */}
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 }}
                    >
                      Delivery Progress
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {[
                        'Order Placed',
                        'Confirmed',
                        'Processing',
                        'Packed',
                        'Out for Delivery',
                        'Delivered',
                      ].map((step, index) => {
                        const progress = getDeliveryProgress(item.status);
                        const isCompleted = index < progress.completedSteps;
                        const isCurrent = index === progress.currentStep - 1;

                        return (
                          <View key={step} style={{ alignItems: 'center', flex: 1 }}>
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: isCompleted
                                  ? '#10b981'
                                  : isCurrent
                                    ? statusInfo.color
                                    : '#e2e8f0',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4,
                              }}
                            >
                              {isCompleted ? (
                                <Ionicons name="checkmark" size={14} color="white" />
                              ) : isCurrent ? (
                                <Ionicons name={statusInfo.icon as any} size={12} color="white" />
                              ) : (
                                <View
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#cbd5e1',
                                  }}
                                />
                              )}
                            </View>
                            <Text
                              style={{
                                fontSize: 10,
                                color: isCompleted || isCurrent ? '#1e293b' : '#64748b',
                                textAlign: 'center',
                                fontWeight: isCurrent ? '600' : '400',
                              }}
                              numberOfLines={2}
                            >
                              {step}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <Divider style={{ marginBottom: 16 }} />

                <Text
                  style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}
                >
                  Order Details
                </Text>

                <FlatList
                  data={item.orderItems}
                  renderItem={renderOrderItem}
                  keyExtractor={(orderItem) => orderItem.id}
                  scrollEnabled={false}
                />

                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Subtotal</Text>
                    <Text style={{ fontSize: 14, color: '#1e293b' }}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>

                  <Divider style={{ marginVertical: 8 }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                      Total
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card>
      );
    },
    [expandedOrder, formatDate, formatCurrency, renderOrderItem],
  );

  const EmptyOrders = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 100,
      }}
    >
      <Ionicons name="receipt-outline" size={80} color="#cbd5e1" />
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#64748b',
          marginTop: 16,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        No orders yet
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Your order history will appear here once you place your first order
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
        Start Shopping
      </Button>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View
          style={{
            backgroundColor: 'white',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', flex: 1 }}>
            My Orders
          </Text>
          {isOffline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Ionicons name="cloud-offline" size={16} color="#ef4444" />
              <Text style={{ fontSize: 14, color: '#ef4444', marginLeft: 4 }}>Offline</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#64748b' }}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', flex: 1 }}>
          My Orders
        </Text>
        {isOffline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
            <Ionicons name="cloud-offline" size={16} color="#ef4444" />
            <Text style={{ fontSize: 14, color: '#ef4444', marginLeft: 4 }}>Offline</Text>
          </View>
        )}
        {orders.length > 0 && (
          <Text style={{ fontSize: 16, color: '#64748b' }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Order Summary Stats */}
      {orders.length > 0 && (
        <View
          style={{
            backgroundColor: 'white',
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 12,
            padding: 16,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}>
            Order Summary
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>
                {orders.filter((order) => order.status === 'DELIVERED').length}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Delivered</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f59e0b' }}>
                {
                  orders.filter((order) =>
                    ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(
                      order.status,
                    ),
                  ).length
                }
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>In Progress</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#059669' }}>
                ₹{orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString('en-IN')}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Total Spent</Text>
            </View>
          </View>
        </View>
      )}

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
          }
        />
      )}
    </SafeAreaView>
  );
}
