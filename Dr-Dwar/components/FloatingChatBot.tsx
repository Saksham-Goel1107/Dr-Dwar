import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  GestureResponderEvent,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

type ChatBotModalProps = {
  visible: boolean;
  onClose: () => void;
};

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
};

function ChatBotModal({ visible, onClose }: ChatBotModalProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello${user?.firstName ? ` ${user.firstName}` : ''}! I'm your AI health assistant. How can I help you today?`,
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const createNewConversation = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chatbot/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning if using ngrok
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [user?.id, getToken]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Create new conversation when modal opens
      if (!conversationId) {
        createNewConversation();
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, conversationId, createNewConversation]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);

    // If web search is disabled, return "coming soon" message
    if (!useWebSearch) {
      setTimeout(() => {
        const comingSoonResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: '🚀 Advanced AI responses with web search are coming soon! For now, I can help with basic health information and medication reminders. Please enable web search (🌐) for comprehensive answers.',
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, comingSoonResponse]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const token = await getToken();
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning if using ngrok
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage.text,
          useWebSearch,
          conversationId,
          userId: user?.id || 'anonymous',
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.ok) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isBot: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botResponse]);
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.error || 'Failed to get response'}`,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const stoppedResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Response stopped by user.',
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, stoppedResponse]);
      } else {
        console.error('Error sending message:', error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error. Please try again.',
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const stopResponse = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const clearConversation = () => {
    Alert.alert('Clear Conversation', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setMessages([
            {
              id: '1',
              text: `Hello${user?.firstName ? ` ${user.firstName}` : ''}! I'm your AI health assistant. How can I help you today?`,
              isBot: true,
              timestamp: new Date(),
            },
          ]);
          setConversationId('');
          createNewConversation();
        },
      },
    ]);
  };

  function toggleWebSearch(event: GestureResponderEvent): void {
    setUseWebSearch(!useWebSearch);
  }

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
          <View className="flex-row items-center justify-between border-b border-gray-300 p-5">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
              <Text className="ml-4 text-lg font-semibold text-gray-800">AI Health Assistant</Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Web Search Toggle */}
              <TouchableOpacity
                onPress={toggleWebSearch}
                className={`flex-row items-center rounded-full px-3 py-1 ${
                  useWebSearch ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={useWebSearch ? '#3B82F6' : '#6B7280'}
                />
                <Text
                  className={`ml-1 text-xs font-medium ${
                    useWebSearch ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {useWebSearch ? 'Web' : 'Local'}
                </Text>
              </TouchableOpacity>

              {/* Clear Conversation */}
              <TouchableOpacity
                onPress={clearConversation}
                className="rounded-full bg-gray-100 p-2"
              >
                <Ionicons name="trash-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 p-5"
            contentContainerStyle={{ paddingBottom: 120 }} // Add padding for disclaimer
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                className={msg.isBot ? 'self-start bg-gray-200' : 'self-end bg-blue-500'}
                style={{ padding: 10, borderRadius: 10, marginBottom: 10, maxWidth: '80%' }}
              >
                {msg.isBot ? (
                  <Markdown
                    style={{
                      body: { color: '#374151', fontSize: 14 },
                      paragraph: { marginBottom: 4 },
                      heading1: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
                      heading2: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
                      heading3: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
                      list_item: { marginBottom: 2 },
                      bullet_list: { marginBottom: 8 },
                      ordered_list: { marginBottom: 8 },
                      code_inline: {
                        backgroundColor: '#f3f4f6',
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: 4,
                      },
                      code_block: {
                        backgroundColor: '#f3f4f6',
                        padding: 8,
                        borderRadius: 6,
                        marginVertical: 4,
                      },
                      blockquote: {
                        borderLeftWidth: 4,
                        borderLeftColor: '#d1d5db',
                        paddingLeft: 8,
                        marginVertical: 4,
                      },
                      link: { color: '#3b82f6' },
                      strong: { fontWeight: 'bold' },
                      em: { fontStyle: 'italic' },
                    }}
                  >
                    {msg.text}
                  </Markdown>
                ) : (
                  <Text className="text-sm text-white">{msg.text}</Text>
                )}
                <Text className={`mt-1 text-xs ${msg.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View
                className="self-start bg-gray-200"
                style={{ padding: 10, borderRadius: 10, marginBottom: 10 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="mr-2 text-sm text-gray-600">AI is thinking</Text>
                    <View className="flex-row">
                      <View className="mr-1 h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                      <View
                        className="mr-1 h-2 w-2 animate-pulse rounded-full bg-gray-400"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <View
                        className="h-2 w-2 animate-pulse rounded-full bg-gray-400"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={stopResponse}
                    className="ml-3 rounded-full bg-red-500 px-3 py-1"
                  >
                    <Text className="text-xs font-medium text-white">Stop</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Disclaimer */}
          <View className="border-t border-gray-200 bg-yellow-50 p-3">
            <Text className="text-center text-xs text-yellow-800">
              ⚠️ <Text className="font-medium">Medical Disclaimer:</Text> This AI assistant provides
              general health information for educational purposes only. It is not a substitute for
              professional medical advice, diagnosis, or treatment. Always consult with qualified
              healthcare providers for medical concerns.
            </Text>
          </View>

          {/* Input */}
          <View className="flex-row items-center border-t border-gray-300 p-5">
            <TextInput
              className="mr-2 max-h-24 flex-1 rounded-full border border-gray-300 px-4 py-2"
              placeholder={
                useWebSearch
                  ? 'Ask me anything with web search...'
                  : 'Web search disabled - ask basic questions...'
              }
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              className={`h-10 w-10 items-center justify-center rounded-full ${
                isLoading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              onPress={handleSendMessage}
              disabled={isLoading || !message.trim()}
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
      ]),
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
