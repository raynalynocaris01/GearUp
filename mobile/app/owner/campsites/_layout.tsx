import { Stack } from 'expo-router';

export default function CampsitesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]/edit" />
      <Stack.Screen name="[id]/tour-guides" />
    </Stack>
  );
}