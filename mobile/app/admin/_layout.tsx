import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { auth, hasToken, clearToken } from '../../lib/api';
import { colors } from '../../theme';

export default function AdminLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const loggedIn = await hasToken();
      if (!loggedIn) {
        router.replace('/login');
        return;
      }
      try {
        const res = await auth.user();
        if (res.data.role !== 'admin') {
          router.replace('/(tabs)');
          return;
        }
      } catch {
        await clearToken();
        router.replace('/login');
        return;
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f9fafb' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="campsites" />
      <Stack.Screen name="bookings" />
    </Stack>
  );
}