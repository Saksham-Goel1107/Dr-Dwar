import { useRouter } from 'expo-router';
import '../global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import * as Speech from 'expo-speech';
import * as SecureStore from 'expo-secure-store';

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
  const [readPageAloud, setReadPageAloud] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(root)/(tabs)/home');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    const loadReadPageAloudSetting = async () => {
      try {
        const readAloudSetting = await SecureStore.getItemAsync('READ_PAGE_ALOUD');
        setReadPageAloud(readAloudSetting === 'true');
      } catch (error) {
        console.error('Error loading read page aloud setting:', error);
        setReadPageAloud(false);
      }
    };
    loadReadPageAloudSetting();
    if (readPageAloud) {
      Speech.speak(
        'Home page: The Dr-Dwar Home page which tells the features of the app and has Sign-in and Sign-up buttons.',
        {
          language: 'en',
          pitch: 1,
          rate: 1,
        },
      );
    }
  }, [readPageAloud]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView className="flex-1 bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <View className="flex items-center px-6 pb-4 pt-6">
          <Image
            source={require('../assets/images/icon.png')}
            className="h-20 w-32"
            resizeMode="contain"
          />
          <Text className="mt-2 text-center text-base font-medium text-gray-600">
            Your Digital Health Companion
          </Text>
        </View>

        {/* Carousel */}
        <View className="flex-1">
          <Carousel
            width={width}
            height={height * 0.6}
            data={data}
            scrollAnimationDuration={2000}
            onSnapToItem={(index) => setCurrentIndex(index)}
            autoPlay={true}
            autoPlayInterval={4000}
            loop={true}
            renderItem={({ item, index }) => (
              <View
                style={{
                  flex: 1,
                  width: width,
                  height: height * 0.6,
                }}
              >
                <Image
                  source={item.image}
                  style={{
                    width: width,
                    height: height * 0.6,
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 30,
                    left: 20,
                    right: 20,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '800',
                      fontSize: 24,
                      color: '#FFFFFF',
                      marginBottom: 12,
                      textShadowColor: 'rgba(0, 0, 0, 0.8)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                      textAlign: 'center',
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      color: '#F0F0F0',
                      fontSize: 16,
                      lineHeight: 24,
                      fontWeight: '500',
                      textShadowColor: 'rgba(0, 0, 0, 0.6)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                      textAlign: 'center',
                    }}
                  >
                    {item.desc}
                  </Text>
                </View>
              </View>
            )}
          />
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
