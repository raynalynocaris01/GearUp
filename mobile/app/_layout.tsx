import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="my-gear/index" />
        <Stack.Screen name="my-gear/new" />
        <Stack.Screen name="my-gear/[id]/edit" />
         <Stack.Screen name="my-gear/bookings" />
        <Stack.Screen name="signup" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}