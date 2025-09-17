import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


type ChatBotModalProps = {
  visible: boolean;
  onClose: () => void;
};

function ChatBotModal({ visible, onClose }: ChatBotModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI health assistant. How can I help you today?",
      isBot: true,
    },
  ]);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = { id: Date.now(), text: message, isBot: false };
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: "Thank you for your message. I'm here to help with health-related questions and provide general guidance.",
        isBot: true,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Animated.View
          style={[
            {
              height: '80%',
              backgroundColor: 'white',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Chat Header */}
          <View className="flex-row items-center border-b border-gray-300 p-5">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#222" />
            </TouchableOpacity>
            <Text className="ml-4 text-lg font-semibold text-gray-800">AI Health Assistant</Text>
          </View>
          {/* Messages */}
          <ScrollView className="flex-1 p-5">
            {messages.map((msg) => (
              <View
                key={msg.id}
                className={msg.isBot ? 'self-start bg-gray-200' : 'self-end bg-blue-500'}
                style={{ padding: 10, borderRadius: 10, marginBottom: 10, maxWidth: '80%' }}
              >
                <Text className={msg.isBot ? 'text-sm text-gray-800' : 'text-sm text-white'}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>
          {/* Input */}
          <View className="flex-row items-center border-t border-gray-300 p-5">
            <TextInput
              className="mr-2 max-h-24 flex-1 rounded-full border border-gray-300 px-4 py-2"
              placeholder="Type your message..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-blue-500"
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function FloatingChatBot() {
  const [chatBotVisible, setChatBotVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <>
      {/* Floating ChatBot Button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 128,
          right: 20,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <TouchableOpacity
          className="h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-800 shadow-2xl"
          style={{
            backgroundColor: '#008000',
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={() => setChatBotVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      <ChatBotModal visible={chatBotVisible} onClose={() => setChatBotVisible(false)} />
    </>
  );
}
