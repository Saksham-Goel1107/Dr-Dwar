import { Stack } from 'expo-router';

export default function AppointmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Appointments',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="schedule"
        options={{
          title: 'Schedule Appointment',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Appointment History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Calendar View',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
