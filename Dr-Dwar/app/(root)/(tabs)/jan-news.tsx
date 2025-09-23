import { useAuth } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
}

export default function JanNews() {
  const { getToken } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNews = React.useCallback(
    async (
      pageNum = 1,
      isLoadMore = false,
      searchTerm = '',
      fromDate: Date | null = null,
      toDate: Date | null = null,
    ) => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No token available');
        }

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '5',
        });
        if (searchTerm) params.append('search', searchTerm);
        if (fromDate) params.append('fromDate', fromDate.toISOString());
        if (toDate) params.append('toDate', toDate.toISOString());

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/news?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();

        if (isLoadMore) {
          setNews((prev) => [...prev, ...data.news]);
        } else {
          setNews(data.news);
        }

        setHasMore(data.pagination.page < data.pagination.pages);
        setPage(pageNum);
      } catch (error) {
        console.error('Error fetching news:', error);
        if (!isOffline) {
          Alert.alert('Error', 'Failed to load news. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getToken],
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Network detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOffline(!isConnected);
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOffline(!isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOffline) {
      setLoading(true);
      setPage(1);
      fetchNews(1, false, debouncedSearch, fromDate, toDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, fromDate, toDate, isOffline]);

  const onRefresh = () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot refresh while offline. Please check your connection.');
      return;
    }
    setRefreshing(true);
    setPage(1);
    fetchNews(1, false, search, fromDate, toDate);
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore && !isOffline) {
      setLoadingMore(true);
      fetchNews(page + 1, true, debouncedSearch, fromDate, toDate);
    }
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      className="mx-4 mb-4 overflow-hidden rounded-xl bg-white shadow-lg"
      style={{ elevation: 3 }}
      onPress={() => {
        setSelectedNews(item);
        setModalVisible(true);
      }}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} className="h-48 w-full" resizeMode="cover" />
      )}
      <View className="p-4">
        <Text className="mb-2 text-lg font-bold leading-6 text-gray-900" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="mb-3 text-sm leading-5 text-gray-600" numberOfLines={3}>
          {item.description}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">
            {new Date(item.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <View className="flex-row items-center">
            <Text className="mr-1 text-xs text-blue-600">Read more</Text>
            <Ionicons name="chevron-forward" size={12} color="#2563eb" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <View className="items-center">
          <Ionicons name="newspaper-outline" size={48} color="#6b7280" />
          <Text className="mt-4 text-lg font-medium text-gray-700">Loading news...</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Please wait while we fetch the latest updates
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-6 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="newspaper" size={28} color="#1f2937" />
              <Text className="ml-3 text-2xl font-bold text-gray-900">Jan News</Text>
            </View>
            {isOffline && (
              <View className="flex-row items-center rounded-full bg-red-50 px-3 py-1">
                <Ionicons name="cloud-offline" size={16} color="#ef4444" />
                <Text className="ml-1 text-xs font-medium text-red-600">Offline</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search and Filters */}
        <View className="bg-white px-4 py-3">
          <View className="mb-3 flex-row items-center rounded-xl bg-gray-100 px-4 py-3">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              className="ml-3 flex-1 text-base text-gray-900"
              placeholder="Search news..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              className="mr-2 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              onPress={() => setShowFromPicker(true)}
            >
              <Text className="text-xs font-medium text-gray-500">FROM</Text>
              <Text className="text-sm text-gray-900">
                {fromDate
                  ? fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Select Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mr-2 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              onPress={() => setShowToPicker(true)}
            >
              <Text className="text-xs font-medium text-gray-500">TO</Text>
              <Text className="text-sm text-gray-900">
                {toDate
                  ? toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Select Date'}
              </Text>
            </TouchableOpacity>

            {(fromDate || toDate) && (
              <TouchableOpacity
                className="rounded-lg bg-red-500 p-2"
                onPress={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showFromPicker && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="default"
            maximumDate={toDate || new Date()}
            onChange={(event, selectedDate) => {
              setShowFromPicker(false);
              if (selectedDate) {
                if (toDate && selectedDate > toDate) {
                  Alert.alert('Invalid Date', 'From date cannot be after To date');
                } else {
                  setFromDate(selectedDate);
                }
              }
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="default"
            minimumDate={fromDate || undefined}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowToPicker(false);
              if (selectedDate) {
                if (fromDate && selectedDate < fromDate) {
                  Alert.alert('Invalid Date', 'To date cannot be before From date');
                } else {
                  setToDate(selectedDate);
                }
              }
            }}
          />
        )}
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          renderItem={renderNewsItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-6">
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={16} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-600">Loading more news...</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-8 py-20">
              {isOffline ? (
                <View className="items-center">
                  <View className="mb-4 rounded-full bg-red-100 p-4">
                    <Ionicons name="cloud-offline" size={32} color="#ef4444" />
                  </View>
                  <Text className="mb-2 text-lg font-semibold text-gray-900">
                    You&apos;re offline
                  </Text>
                  <Text className="text-center text-sm text-gray-500">
                    Check your internet connection to load the latest news
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  <View className="mb-4 rounded-full bg-gray-100 p-4">
                    <Ionicons name="newspaper-outline" size={32} color="#6b7280" />
                  </View>
                  <Text className="mb-2 text-lg font-semibold text-gray-900">No news found</Text>
                  <Text className="text-center text-sm text-gray-500">
                    Try adjusting your search or date filters
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <>
          {/* Modal Header */}
          <View className="border-b border-gray-200 bg-white px-4 py-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="flex-row items-center rounded-lg bg-gray-100 px-3 py-2"
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="chevron-back" size={20} color="#374151" />
                <Text className="ml-1 font-medium text-gray-700">Back</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">Article</Text>
              <View className="w-16" />
            </View>
          </View>

          {selectedNews && (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedNews.imageUrl && (
                <Image
                  source={{ uri: selectedNews.imageUrl }}
                  className="h-64 w-full"
                  resizeMode="cover"
                />
              )}

              <View className="p-6">
                <Text className="mb-4 text-2xl font-bold leading-8 text-gray-900">
                  {selectedNews.title}
                </Text>

                <View className="mb-6 flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-600">
                    Published{' '}
                    {new Date(selectedNews.publishedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <View className="rounded-lg bg-gray-50 p-4">
                  <Markdown
                    style={{
                      body: { fontSize: 16, lineHeight: 24, color: '#374151' },
                      paragraph: { marginBottom: 12 },
                      heading1: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
                      heading2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
                    }}
                  >
                    {selectedNews.content}
                  </Markdown>
                </View>
              </View>
            </ScrollView>
          )}
        </>
      </Modal>
    </>
  );
}
