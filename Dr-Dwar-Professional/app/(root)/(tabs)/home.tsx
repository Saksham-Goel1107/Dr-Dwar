import { useUser } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, Image, Linking, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import Carousel from 'react-native-reanimated-carousel';

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
  },
];

const services = [
  {
    title: 'Book Teleconsultation',
    subtitle: 'Book an appointment with a doctor',
    icon: 'video',
    bg: '#E0F2FE',
    route: '/(root)/(tabs)/appointment',
  },
  {
    title: 'Medical Emergency',
    subtitle: 'Call emergency services (112)',
    icon: 'ambulance',
    bg: '#FEE2E2',
    action: 'emergency',
  },
  {
    title: 'Health Records',
    subtitle: 'View your medical history',
    icon: 'file-document',
    bg: '#ECFDF5',
    route: '/(root)/health-records',
  },
];

export default function HomeScreen() {
  const { user } = useUser();
  if (!user) {
    throw new Error('User not found');
  }
  const router = useRouter();

  const isVerified = user.unsafeMetadata?.isverified ?? false;
  const userRole = user.unsafeMetadata?.role;

  return (
    <FlatList
      data={[]} // Empty data since we're using ListHeaderComponent
      renderItem={null}
      ListHeaderComponent={
        <>
          {/* Header */}
          <View style={{ padding: 20, paddingTop: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
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
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 18,
                right: 15,
                padding: 10,
                borderRadius: 20,
                backgroundColor: '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => (router.push as any)('/(root)/user-credits')}
            >
              <MaterialCommunityIcons name="wallet-outline" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Verification Warning */}
          {!isVerified && (
            <View
              style={{
                backgroundColor: '#FEF3C7',
                padding: 16,
                marginHorizontal: 20,
                marginBottom: 10,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: '#F59E0B',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={{ fontWeight: '700', color: '#92400E', marginLeft: 8 }}>
                  Verification Required
                </Text>
              </View>
              <Text style={{ color: '#92400E', marginBottom: 12 }}>
                You are yet not verified. You will not be able to access all features of this app
                till then. Look at our guide.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#F59E0B',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                  alignSelf: 'flex-start',
                }}
                onPress={() => {
                  if (userRole === 'Doctor') {
                    router.replace('/(root)/guide-doctor');
                  } else if (userRole === 'PharmaCist') {
                    router.replace('/(root)/guide-pharma');
                  }
                }}
              >
                <Text style={{ color: '#92400E', fontWeight: '600' }}>View Guide</Text>
              </TouchableOpacity>
            </View>
          )}

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

          {/* Services & Support */}
          <View style={{ paddingTop: 18, paddingHorizontal: 20, paddingBottom: 30 }}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#2C2419', marginBottom: 8 }}>
              Services & Support
            </Text>
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
            >
              {services.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={{
                    width: '48%',
                    marginBottom: 10,
                    aspectRatio: 1,
                    backgroundColor: 'white',
                    borderRadius: 12,
                    elevation: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16,
                  }}
                  onPress={() => {
                    if (item.action === 'emergency') {
                      Linking.openURL('tel:112');
                    } else if (item.route) {
                      (router.push as any)(item.route);
                    }
                  }}
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
                  <Text
                    style={{ color: '#6B4E3E', marginTop: 4, textAlign: 'center', fontSize: 12 }}
                  >
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      }
      ListFooterComponent={<View style={{ paddingBottom: 40 }} />}
    />
  );
}
