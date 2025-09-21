import '@/global.css';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#059669',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarIcon: ({ color, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
            switch (route.name) {
              case 'home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'pharmacy':
                iconName = focused ? 'medkit' : 'medkit-outline';
                break;
              case 'appointment':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              case 'jan-news':
                iconName = focused ? 'newspaper' : 'newspaper-outline';
                break;
              default:
                iconName = 'ellipse-outline';
            }
            return <Ionicons name={iconName} size={24} color={color} />;
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        })}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="pharmacy" options={{ title: 'Pharmacy' }} />
        <Tabs.Screen name="appointment" options={{ title: 'Appointment' }} />
        <Tabs.Screen name="jan-news" options={{ title: 'Jan News' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </SafeAreaView>
  );
}
