import { Stack } from 'expo-router';

export default function GearLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="bookings/[id]" />
    </Stack>
  );
}