import { useRouter } from 'expo-router';
import '../global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

const data = [
  {
    image: require('../assets/images/Initial-Screen/health1.png'),
    title: 'Healthcare for Rural India',
    desc: 'Bringing quality medical care to every village. Connect with certified doctors from the comfort of your home.',
    color: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    accent: 'text-emerald-700',
    buttonColor: 'bg-emerald-500',
    buttonActive: 'active:bg-emerald-600',
  },
  {
    image: require('../assets/images/Initial-Screen/health2.png'),
    title: 'Affordable & Accessible',
    desc: 'Get consultations, medicines, and health tracking at prices designed for rural communities.',
    color: 'bg-gradient-to-br from-blue-50 to-blue-100',
    accent: 'text-blue-700',
    buttonColor: 'bg-blue-500',
    buttonActive: 'active:bg-blue-600',
  },
  {
    image: require('../assets/images/Initial-Screen/health3.png'),
    title: 'Your Health, Our Priority',
    desc: '24/7 emergency support, medicine delivery, and health records - all in your local language.',
    color: 'bg-gradient-to-br from-orange-50 to-orange-100',
    accent: 'text-orange-700',
    buttonColor: 'bg-orange-500',
    buttonActive: 'active:bg-orange-600',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(root)/(tabs)/home');
    }
  }, [isSignedIn, router]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView className="flex-1 bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <View className="px-6 pb-4 pt-6">
          <View className="mb-2 flex-row items-center justify-center">
            <Text className="bg-gradient-to-r from-emerald-600 via-blue-600 to-orange-600 bg-clip-text text-4xl font-bold text-transparent">
              Dr.
            </Text>
            <Text className="ml-1 text-4xl font-bold text-gray-900">Dwar</Text>
          </View>
          <Text className="mt-2 text-center text-base font-medium text-gray-600">
            Your Digital Health Companion
          </Text>
        </View>

        {/* Carousel */}
        <View className="flex-1 px-4">
          <Carousel
            width={width - 32}
            height={height * 0.6}
            data={data}
            scrollAnimationDuration={1000}
            onSnapToItem={(index) => setCurrentIndex(index)}
            autoPlay={true}
            autoPlayInterval={3000}
            loop={true}
            renderItem={({ item, index }) => (
              <View
                className={`flex-1 items-center justify-center p-8 ${item.color} mx-2 rounded-3xl border border-white/20 shadow-xl`}
              >
                <View className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
                  <Image source={item.image} className="h-40 w-40" resizeMode="contain" />
                </View>
                <Text
                  className={`text-2xl font-bold ${item.accent} mb-4 text-center leading-tight`}
                >
                  {item.title}
                </Text>
                <Text className="px-2 text-center text-base leading-7 text-gray-700">
                  {item.desc}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Pagination Dots */}
        <View className="flex-row items-center justify-center py-8">
          {data.map((_, index) => (
            <View
              key={index}
              className={`mx-1.5 h-3 rounded-full transition-all duration-500 ${
                index === currentIndex ? 'w-10 bg-emerald-500 shadow-md' : 'w-3 bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Bottom Actions */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={() => router.push('/(auth)/Sign-up')}
            className={`${data[currentIndex].buttonColor} rounded-2xl py-4 shadow-xl ${data[currentIndex].buttonActive} transform active:scale-95`}
          >
            <Text className="text-center text-lg font-semibold tracking-wide text-white">
              Start Your Health Journey
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 py-3" onPress={() => router.push('/(auth)/Sign-in')}>
            <Text className="text-center text-base font-medium text-gray-600">
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}
