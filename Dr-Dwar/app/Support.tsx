import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      style={{
        marginBottom: 12,
        shadowColor: '#92400e',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <Card
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#fed7aa',
          backgroundColor: '#fef3c7',
        }}
      >
        <Card.Content style={{ padding: 16 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '600',
                color: '#451a03',
                marginRight: 12,
              }}
            >
              {question}
            </Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#a16207" />
          </View>
          {expanded && (
            <Text
              style={{
                marginTop: 12,
                fontSize: 14,
                color: '#78350f',
                lineHeight: 20,
              }}
            >
              {answer}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', "Your message has been sent! We'll get back to you within 24 hours.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 2000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fef7ed' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          {/* Welcome Message */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#fed7aa',
              backgroundColor: '#fef3c7',
              shadowColor: '#92400e',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Card.Content style={{ padding: 24 }}>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    marginBottom: 16,
                    height: 64,
                    width: 64,
                    borderRadius: 32,
                    backgroundColor: '#dcfce7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#16a34a',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="headset" size={32} color="#15803d" />
                </View>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#451a03',
                    marginBottom: 8,
                  }}
                >
                  How can we help you?
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#78350f',
                    lineHeight: 20,
                  }}
                >
                  Send us a message and we&apos;ll get back to you as soon as possible
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Contact Form */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                marginBottom: 16,
                fontSize: 18,
                fontWeight: '700',
                color: '#451a03',
              }}
            >
              Contact Form
            </Text>

            <Card
              style={{
                borderRadius: 16,
                borderWidth: 2,
                borderColor: '#fed7aa',
                backgroundColor: '#fef3c7',
                shadowColor: '#92400e',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Card.Content style={{ padding: 20 }}>
                {/* Name Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#451a03',
                      marginBottom: 8,
                    }}
                  >
                    Full Name *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#fed7aa',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#451a03',
                    }}
                    placeholder="Enter your full name"
                    placeholderTextColor="#a16207"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                  />
                </View>

                {/* Email Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#451a03',
                      marginBottom: 8,
                    }}
                  >
                    Email Address *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#fed7aa',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#451a03',
                    }}
                    placeholder="Enter your email address"
                    placeholderTextColor="#a16207"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                  />
                </View>

                {/* Subject Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#451a03',
                      marginBottom: 8,
                    }}
                  >
                    Subject
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#fed7aa',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#451a03',
                    }}
                    placeholder="What's this about?"
                    placeholderTextColor="#a16207"
                    value={formData.subject}
                    onChangeText={(value) => handleInputChange('subject', value)}
                  />
                </View>

                {/* Message Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#451a03',
                      marginBottom: 8,
                    }}
                  >
                    Message *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#fed7aa',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#451a03',
                      height: 120,
                      textAlignVertical: 'top',
                    }}
                    placeholder="Describe your issue or question in detail..."
                    placeholderTextColor="#a16207"
                    multiline
                    numberOfLines={4}
                    value={formData.message}
                    onChangeText={(value) => handleInputChange('message', value)}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting ? '#a16207' : '#16a34a',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    shadowColor: '#16a34a',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSubmitting ? 0 : 0.3,
                    shadowRadius: 8,
                    elevation: isSubmitting ? 0 : 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                marginBottom: 16,
                fontSize: 18,
                fontWeight: '700',
                color: '#451a03',
              }}
            >
              Quick Actions
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={{ flex: 1, marginRight: 8 }}>
                <Card
                  style={{
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#fed7aa',
                    backgroundColor: '#dcfce7',
                    shadowColor: '#16a34a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Card.Content style={{ padding: 16, alignItems: 'center' }}>
                    <View
                      style={{
                        marginBottom: 8,
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: '#bbf7d0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="refresh" size={20} color="#15803d" />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#14532d',
                        textAlign: 'center',
                      }}
                    >
                      Track Order
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity style={{ flex: 1, marginHorizontal: 4 }}>
                <Card
                  style={{
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#fed7aa',
                    backgroundColor: '#fed7aa',
                    shadowColor: '#ea580c',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Card.Content style={{ padding: 16, alignItems: 'center' }}>
                    <View
                      style={{
                        marginBottom: 8,
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: '#fdba74',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="return-up-back" size={20} color="#c2410c" />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#9a3412',
                        textAlign: 'center',
                      }}
                    >
                      Return
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity style={{ flex: 1, marginLeft: 8 }}>
                <Card
                  style={{
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#fed7aa',
                    backgroundColor: '#fecaca',
                    shadowColor: '#dc2626',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Card.Content style={{ padding: 16, alignItems: 'center' }}>
                    <View
                      style={{
                        marginBottom: 8,
                        height: 40,
                        width: 40,
                        borderRadius: 20,
                        backgroundColor: '#fca5a5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#b91c1c" />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#7f1d1d',
                        textAlign: 'center',
                      }}
                    >
                      Cancel
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                marginBottom: 16,
                fontSize: 18,
                fontWeight: '700',
                color: '#451a03',
              }}
            >
              Frequently Asked Questions
            </Text>

            <FAQItem
              question="How do I track my order?"
              answer="You can track your order by going to the 'View Orders' section in your profile. You'll see real-time updates on your order status, delivery timeline, and tracking information."
            />

            <FAQItem
              question="What is the return policy?"
              answer="We offer a 30-day return policy for all medications. Items must be unused and in their original packaging. Contact our support team to initiate a return request."
            />

            <FAQItem
              question="How do I cancel my order?"
              answer="Orders can be cancelled within 2 hours of placement through the app. Go to your order details and select the cancel option. Refunds will be processed within 5-7 business days."
            />

            <FAQItem
              question="Are prescriptions required?"
              answer="Yes, all prescription medications require a valid prescription from a licensed healthcare provider. You can upload your prescription during the checkout process."
            />

            <FAQItem
              question="What payment methods are accepted?"
              answer="We accept all major credit/debit cards, UPI, net banking, and digital wallets including Paytm, Google Pay, and PhonePe for your convenience."
            />
          </View>

          {/* Contact Information */}
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#fed7aa',
              backgroundColor: '#fef3c7',
              shadowColor: '#92400e',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Card.Content style={{ padding: 20 }}>
              <Text
                style={{
                  marginBottom: 16,
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#451a03',
                }}
              >
                Contact Information
              </Text>

              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="mail" size={20} color="#a16207" />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: '#78350f',
                    }}
                  >
                    sakshamgoel1107@gmail.com
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="call" size={20} color="#a16207" />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: '#78350f',
                    }}
                  >
                    +91-8882534712
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="time" size={20} color="#a16207" />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: '#78350f',
                    }}
                  >
                    Mon-Sat: 9AM-9PM IST
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Emergency Notice */}
          <Card
            style={{
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#fca5a5',
              backgroundColor: '#fef2f2',
              shadowColor: '#dc2626',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Card.Content style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="warning" size={20} color="#b91c1c" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#7f1d1d',
                      marginBottom: 4,
                    }}
                  >
                    Emergency Notice
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#991b1b',
                      lineHeight: 20,
                    }}
                  >
                    For medical emergencies, please contact your nearest hospital or call emergency
                    services immediately.
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
