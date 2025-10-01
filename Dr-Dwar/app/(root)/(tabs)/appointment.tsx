import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  subSpecialization?: string;
  experience?: number;
  hospital?: string;
  position?: string;
  fees: {
    consultationFee: number;
    followUpFee: number;
    emergencyFee: number;
    telemedicineFee: number;
  };
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  completedAppointments: number;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<boolean | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);

  // Load network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkStatus(isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Fetch available doctors
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/appointments/doctors`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const data = await response.json();
      if (data.success) {
        setDoctors(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (networkStatus && mounted) {
      fetchDoctors();
    }
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatus]);

  const handleDoctorSelect = (doctor: Doctor) => {
    // Navigate directly to booking screen with doctor ID
    router.push({
      pathname: '/(root)/book-appointment',
      params: { doctorId: doctor.id },
    });
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor) return;
    router.push({
      pathname: '/(root)/book-appointment',
      params: { doctorId: selectedDoctor.id },
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      onPress={() => handleDoctorSelect(item)}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="doctor" size={20} color="#16a34a" />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 }}>
              Dr. {item.name}
            </Text>
          </View>

          <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
            {item.specialization}
            {item.subSpecialization && ` • ${item.subSpecialization}`}
          </Text>

          {item.experience && (
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
              {item.experience} years experience
            </Text>
          )}

          {item.hospital && (
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{item.hospital}</Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
            <Text style={{ fontSize: 14, color: '#64748b', marginLeft: 4 }}>
              {item.completedAppointments} consultations completed
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginBottom: 8 }}>
            ₹{item.fees.consultationFee}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b' }}>Consultation</Text>
        </View>
      </View>

      {item.availability.length > 0 && (
        <View
          style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Available Today
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {item.availability.slice(0, 3).map((slot, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: '#f0fdf4',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#16a34a',
                }}
              >
                <Text style={{ fontSize: 12, color: '#166534' }}>
                  {getDayName(slot.dayOfWeek)}: {slot.startTime} - {slot.endTime}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!networkStatus) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#f0fdf4',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MaterialCommunityIcons name="wifi-off" size={48} color="#6b7280" />
        <Text style={{ fontSize: 18, color: '#6b7280', marginTop: 16, textAlign: 'center' }}>
          No Internet Connection
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#16a34a',
          paddingTop: 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 45,
            left: 20,
            zIndex: 1,
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 12,
          }}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <MaterialCommunityIcons name="calendar-plus" size={32} color="#ffffff" />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: 8,
            }}
          >
            Book Appointment
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
            }}
          >
            Find and book appointments with verified doctors
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={{ fontSize: 16, color: '#64748b', marginTop: 16 }}>
              Loading doctors...
            </Text>
          </View>
        ) : doctors.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <MaterialCommunityIcons name="medical-bag" size={48} color="#d1d5db" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#6b7280',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              No Doctors Available
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
              No verified doctors are currently available for appointments.
            </Text>
          </View>
        ) : (
          <FlatList
            data={doctors}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Doctor Details Modal */}
      {showDoctorDetails && selectedDoctor && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 20,
              width: '100%',
              maxHeight: '80%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialCommunityIcons name="doctor" size={24} color="#16a34a" />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginLeft: 8 }}>
                  Dr. {selectedDoctor.name}
                </Text>
              </View>

              <Text style={{ fontSize: 16, color: '#64748b', marginBottom: 16 }}>
                {selectedDoctor.specialization}
                {selectedDoctor.subSpecialization && ` • ${selectedDoctor.subSpecialization}`}
              </Text>

              {/* Fees */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}
                >
                  Consultation Fees
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Initial Consultation</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>
                      ₹{selectedDoctor.fees.consultationFee}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Follow-up</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>
                      ₹{selectedDoctor.fees.followUpFee}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Emergency</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>
                      ₹{selectedDoctor.fees.emergencyFee}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>Telemedicine</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>
                      ₹{selectedDoctor.fees.telemedicineFee}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Availability */}
              {selectedDoctor.availability.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 }}
                  >
                    Availability
                  </Text>
                  <View style={{ gap: 8 }}>
                    {selectedDoctor.availability.map((slot, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          backgroundColor: '#f8fafc',
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                          {getDayName(slot.dayOfWeek)}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#64748b' }}>
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}
              >
                <TouchableOpacity
                  onPress={() => setShowDoctorDetails(false)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#374151', fontWeight: '600', textAlign: 'center' }}>
                    Close
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBookAppointment}
                  style={{
                    backgroundColor: '#16a34a',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
                    Book Appointment
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
