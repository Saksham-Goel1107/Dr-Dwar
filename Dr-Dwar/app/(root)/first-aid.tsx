import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

const firstAidTopics = [
  {
    title: 'CPR (Cardiopulmonary Resuscitation)',
    icon: 'heart-plus',
    color: '#EF4444',
    steps: [
      'Check for responsiveness - tap and shout',
      'Call emergency services (112) immediately',
      'Start chest compressions: 30 compressions at 100-120 per minute',
      'Give 2 rescue breaths if trained',
      'Continue cycle until help arrives',
    ],
    important:
      'Do not stop CPR until professional help takes over or the person shows signs of life.',
  },
  {
    title: 'Choking',
    icon: 'food-off',
    color: '#F59E0B',
    steps: [
      'Encourage coughing if person can breathe',
      'Perform abdominal thrusts (Heimlich maneuver)',
      'Stand behind person, make fist above navel',
      'Grasp fist with other hand and pull inward/upward',
      'Repeat until object is expelled or person becomes unconscious',
    ],
    important: 'If unconscious, start CPR and call emergency services.',
  },
  {
    title: 'Severe Bleeding',
    icon: 'water',
    color: '#DC2626',
    steps: [
      'Apply direct pressure with clean cloth',
      'Elevate injured area above heart level',
      'Apply pressure points if needed',
      'Keep person warm and comfortable',
      'Seek immediate medical attention',
    ],
    important: 'Do not remove embedded objects. Apply pressure around them.',
  },
  {
    title: 'Burns',
    icon: 'fire',
    color: '#EA580C',
    steps: [
      'Cool burn with running water for 20 minutes',
      'Remove jewelry and tight clothing',
      'Cover with clean, non-fluffy dressing',
      'Do not apply creams, oils, or ice',
      'Seek medical help for severe burns',
    ],
    important: 'For chemical burns, flush with water for 20 minutes.',
  },
  {
    title: 'Fractures',
    icon: 'bone',
    color: '#7C3AED',
    steps: [
      'Immobilize injured area',
      'Apply ice packs to reduce swelling',
      'Elevate injured limb',
      'Do not attempt to realign bones',
      'Seek immediate medical attention',
    ],
    important: 'Check for circulation, sensation, and movement (CSM) below injury.',
  },
  {
    title: 'Heart Attack',
    icon: 'heart-flash',
    color: '#BE123C',
    steps: [
      'Call emergency services immediately',
      'Help person sit or lie down comfortably',
      'Loosen tight clothing',
      'If trained, give aspirin if no allergy',
      'Monitor breathing and consciousness',
    ],
    important: 'Time is critical - every minute counts for heart attack treatment.',
  },
  {
    title: 'Stroke',
    icon: 'brain',
    color: '#6366F1',
    steps: [
      'Note time symptoms started',
      'Call emergency services immediately',
      'Help person lie down with head elevated',
      'Do not give food or drink',
      'Monitor breathing and consciousness',
    ],
    important: 'FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.',
  },
  {
    title: 'Poisoning',
    icon: 'skull-crossbones',
    color: '#6B21A8',
    steps: [
      'Call poison control or emergency services',
      'Do not induce vomiting unless instructed',
      'Save container/pill bottle for identification',
      'Monitor symptoms and vital signs',
      'Follow medical advice exactly',
    ],
    important: 'Do not give milk, water, or any home remedies without professional advice.',
  },
];

export default function FirstAidGuide() {
  const router = useRouter();

  const handleEmergencyCall = async () => {
    try {
      const phoneNumber = 'tel:112';
      const canOpen = await Linking.canOpenURL(phoneNumber);
      if (canOpen) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Error', 'Unable to open phone dialer');
      }
    } catch {
      Alert.alert('Error', 'Failed to make emergency call');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F1F5F9' }}>
      {/* Header */}
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        style={{ paddingHorizontal: 20, paddingTop: 50, paddingBottom: 25 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 10,
              borderRadius: 25,
              backgroundColor: 'rgba(255,255,255,0.2)',
              marginRight: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 4 }}>
              🚑 First Aid Guide
            </Text>
            <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)' }}>
              Essential emergency response knowledge
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Emergency Call Card */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25 }}>
        <LinearGradient
          colors={['#FEF2F2', '#FECACA']}
          style={{
            borderRadius: 16,
            padding: 20,
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 2,
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <View
              style={{
                backgroundColor: '#DC2626',
                padding: 12,
                borderRadius: 50,
                marginRight: 12,
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <MaterialCommunityIcons name="phone-alert" size={28} color="white" />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#DC2626' }}>
                🚨 Emergency Hotline
              </Text>
              <Text style={{ fontSize: 14, color: '#7F1D1D', fontWeight: '600' }}>
                Available 24/7
              </Text>
            </View>
          </View>
          <Text style={{ color: '#7F1D1D', marginBottom: 18, fontSize: 16, lineHeight: 22 }}>
            In case of medical emergency, call 112 immediately for professional help.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#DC2626',
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#DC2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={handleEmergencyCall}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}> Call 112 Now</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* First Aid Topics */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text
          style={{
            fontWeight: '900',
            fontSize: 22,
            color: '#1E293B',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          🏥 Common Emergency Situations
        </Text>

        {firstAidTopics.map((topic, index) => (
          <Card
            key={index}
            style={{
              marginBottom: 20,
              borderRadius: 16,
              elevation: 4,
              shadowColor: topic.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: topic.color + '20',
            }}
          >
            <Card.Content style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <LinearGradient
                  colors={[topic.color + '20', topic.color + '10']}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 15,
                    shadowColor: topic.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <MaterialCommunityIcons name={topic.icon as any} size={24} color={topic.color} />
                </LinearGradient>
                <Text style={{ fontWeight: '800', fontSize: 18, color: '#1E293B', flex: 1 }}>
                  {topic.title}
                </Text>
              </View>

              <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 12, fontSize: 16 }}>
                📋 Steps to take:
              </Text>

              {topic.steps.map((step, stepIndex) => (
                <View
                  key={stepIndex}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 10,
                    backgroundColor: '#F8FAFC',
                    padding: 12,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: topic.color,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: topic.color,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                      {stepIndex + 1}
                    </Text>
                  </View>
                  <Text style={{ color: '#374151', flex: 1, lineHeight: 22, fontSize: 15 }}>
                    {step}
                  </Text>
                </View>
              ))}

              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: '700', color: '#92400E', fontSize: 14, marginBottom: 4 }}
                    >
                      Important:
                    </Text>
                    <Text
                      style={{ fontWeight: '600', color: '#78350F', fontSize: 14, lineHeight: 20 }}
                    >
                      {topic.important}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Card.Content>
          </Card>
        ))}

        {/* Disclaimer */}
        <LinearGradient
          colors={['#FEF3C7', '#FDE68A']}
          style={{
            marginTop: 30,
            borderRadius: 16,
            padding: 20,
            borderWidth: 2,
            borderColor: '#F59E0B',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                backgroundColor: '#F59E0B',
                padding: 8,
                borderRadius: 20,
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="information" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#92400E', marginBottom: 10, fontSize: 16 }}>
                📋 Important Disclaimer
              </Text>
              <Text style={{ color: '#78350F', lineHeight: 22, fontSize: 14 }}>
                This guide provides basic first aid information for educational purposes only. It is
                not a substitute for professional medical training or advice. Always seek immediate
                professional medical help in emergencies.
              </Text>
            </View>
          </View>
        </LinearGradient>
        <Text style={{ color: '#78350F', lineHeight: 22, fontSize: 14 }}>
          Always seek professional medical help for serious injuries or illnesses. If you&apos;re
          unsure about any situation, call emergency services immediately.
        </Text>
      </View>
    </ScrollView>
  );
}
