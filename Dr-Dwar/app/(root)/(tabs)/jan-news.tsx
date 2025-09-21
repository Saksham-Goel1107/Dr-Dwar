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
      className="m-2 rounded-lg bg-white p-4 shadow-md"
      onPress={() => {
        setSelectedNews(item);
        setModalVisible(true);
      }}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          className="mb-3 h-32 w-full rounded-lg"
          resizeMode="cover"
        />
      )}
      <Text className="mb-2 text-lg font-bold text-gray-800">{item.title}</Text>
      <Text className="text-gray-600" numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg">Loading news...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <View className="flex-1 p-4">
        <View className="mb-4 flex-row items-center justify-center">
          <Text className="text-center text-2xl font-bold">Jan News</Text>
          {isOffline && (
            <View className="ml-2 flex-row items-center">
              <Ionicons name="cloud-offline" size={20} color="#ef4444" />
              <Text className="ml-1 text-sm text-red-500">Offline</Text>
            </View>
          )}
        </View>
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 p-2"
          placeholder="Search news..."
          value={search}
          onChangeText={setSearch}
        />
        <View className="mb-4 flex-row items-center">
          <TouchableOpacity
            className="mr-2 rounded-lg border border-gray-300 p-2"
            onPress={() => setShowFromPicker(true)}
          >
            <Text className="text-gray-700">
              From: {fromDate ? fromDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-lg border border-gray-300 p-2"
            onPress={() => setShowToPicker(true)}
          >
            <Text className="text-gray-700">
              To: {toDate ? toDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {(fromDate || toDate) && (
            <TouchableOpacity
              className="ml-2 rounded-lg bg-red-500 p-2"
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
            >
              <Text className="text-white">Clear</Text>
            </TouchableOpacity>
          )}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-4">
                <Text className="text-gray-500">Loading more news...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              {isOffline ? (
                <>
                  <Ionicons name="cloud-offline" size={60} color="#9ca3af" />
                  <Text className="mt-4 text-gray-500">You&apos;re offline</Text>
                  <Text className="text-gray-400">Check your connection to load news</Text>
                </>
              ) : (
                <Text className="text-gray-500">No news available</Text>
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
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4">
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-blue-500">Close</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold">News Details</Text>
            <View />
          </View>
          {selectedNews && (
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
              {selectedNews.imageUrl && (
                <Image
                  source={{ uri: selectedNews.imageUrl }}
                  className="mb-4 h-48 w-full rounded-lg"
                  resizeMode="cover"
                />
              )}
              <Text className="mb-2 text-2xl font-bold text-gray-800">{selectedNews.title}</Text>
              <Text className="mb-4 text-sm text-gray-500">
                Published: {new Date(selectedNews.publishedAt).toLocaleDateString()}
              </Text>
              <Markdown>{selectedNews.content}</Markdown>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
