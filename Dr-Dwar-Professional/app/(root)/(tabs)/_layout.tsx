import '@/global.css';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role as string;

  console.log('User role:', userRole);
  console.log('User metadata:', user?.unsafeMetadata);

  // Determine which tabs to show based on user role
  const getTabScreens = () => {
    return [
      <Tabs.Screen
        key="home"
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={focused ? '#059669' : '#6b7280'}
            />
          ),
        }}
      />,
      <Tabs.Screen
        key="appointments"
        name="appointments"
        options={{
          title: 'Appointments',
          href: userRole === 'Doctor' ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={focused ? '#059669' : '#6b7280'}
            />
          ),
        }}
      />,
      <Tabs.Screen
        key="medicines"
        name="medicines"
        options={{
          title: 'Medicines',
          href: userRole === 'PharmaCist' ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'medkit' : 'medkit-outline'}
              size={24}
              color={focused ? '#059669' : '#6b7280'}
            />
          ),
        }}
      />,
      <Tabs.Screen
        key="profile"
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={focused ? '#059669' : '#6b7280'}
            />
          ),
        }}
      />,
    ];
  };

  return (
    <Tabs
      screenOptions={{
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
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {getTabScreens()}
    </Tabs>
  );
}
