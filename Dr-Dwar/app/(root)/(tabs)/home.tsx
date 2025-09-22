import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Carousel from 'react-native-reanimated-carousel';

// Local facts (rural health tips)
import facts from '@/utils/local-facts.json';

const { width } = Dimensions.get('window');

const carouselItems = [
  {
    image: require('@/assets/images/Initial-Screen/health1.png'),
    title: 'Healthcare for Rural India',
    subtitle: 'Quality medical care in every village',
  },
  {
    image: require('@/assets/images/Initial-Screen/health2.png'),
    title: 'Affordable & Accessible',
    subtitle: 'Consultations and medicines for all',
  },
  {
    image: require('@/assets/images/Initial-Screen/health3.png'),
    title: 'Your Health, Our Priority',
    subtitle: '24/7 support in local language',
  }
];

const services = [
  {
    title: 'Locate Hospitals',
    subtitle: 'Find nearby hospitals',
    icon: 'hospital-building',
    bg: '#F0FFF4',
    route: '/(root)/hospitals',
  },
  {
    title: 'Locate Pharmacies',
    subtitle: 'Find nearby pharmacies',
    icon: 'pill',
    bg: '#F5F3FF',
    route: '/(root)/pharmacies',
  },
  {
    title: 'Medicines Reminders',
    subtitle: 'Set reminders for your medications',
    icon: 'alarm',
    bg: '#FFF8F0',
    route: '/(root)/reminders',
  },
  {
    title: 'Book Teleconsultation',
    subtitle: 'Book an appointment with a doctor',
    icon: 'alarm',
    bg: '#FFF8F0',
    route: '/(root)/(tabs)/appointment',
  },
];

export default function HomeScreen() {
  const { user } = useUser();
  if (!user) {
    throw new Error('User not found');
  }
  const router = useRouter();
  const [factIndex, setFactIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % facts.length);
    }, 5000); // Change fact every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const currentFact = useMemo(() => facts[factIndex] ?? facts[0], [factIndex]);

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingTop: 28 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View>
              <Text variant="titleLarge" style={{ fontWeight: '800', color: '#2C2419' }}>
                Hi,{' '}
                {user?.username
                  ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
                  : 'Friend'}
                !
              </Text>
              <Text variant="bodyMedium" style={{ color: '#6B4E3E' }}>
                Your local health hub is nearby - we&apos;re here for village care
              </Text>
            </View>
          </View>
        </View>

        {/* Carousel */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Carousel
            loop
            width={width - 32}
            height={320}
            autoPlay={true}
            autoPlayInterval={4000}
            data={carouselItems}
            scrollAnimationDuration={2000}
            renderItem={({ item }) => (
              <View
                style={{
                  flex: 1,
                  height: 320,
                  borderRadius: 20,
                  marginHorizontal: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={item.image}
                  style={{
                    width: '100%',
                    height: 320,
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
                    bottom: 20,
                    left: 20,
                    right: 20,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '800',
                      fontSize: 20,
                      color: '#FFFFFF',
                      marginBottom: 8,
                      textShadowColor: 'rgba(0, 0, 0, 0.8)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
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
                    }}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* Health Tip Card */}
        <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 30 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#2C2419', marginBottom: 8 }}>
            Health Tips
          </Text>
          <Card style={{ borderRadius: 12, backgroundColor: '#FFF8F0', padding: 12 }}>
            <Card.Content>
              <Text style={{ color: '#4B3B2A' }}>{currentFact}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Services & Support */}
        <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 30 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#2C2419', marginBottom: 8 }}>
            Services & Support
          </Text>
          <FlatList
            data={services}
            keyExtractor={(item) => item.title}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flex: 1,
                  margin: 5,
                  aspectRatio: 1,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  elevation: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 16,
                }}
                onPress={() => (router.push as any)(item.route)}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: item.bg,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={28} color="#4B3B2A" />
                </View>
                <Text style={{ fontWeight: '700', color: '#2C2419', textAlign: 'center' }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#6B4E3E', marginTop: 4, textAlign: 'center', fontSize: 12 }}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </>
  );
}
