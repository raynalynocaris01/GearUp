import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { auth, hasToken } from '../../lib/api';
import { colors } from '../../theme';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer' | 'guide';
  is_approved: boolean;
};

export default function GuideLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const loggedIn = await hasToken();
      if (!loggedIn) {
        router.replace('/login');
        return;
      }
      try {
        const res = await auth.user();
        const data = res.data as User;
        if (data.role !== 'guide') {
          router.replace('/');
          return;
        }
        setUser(data);
      } catch {
        router.replace('/login');
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!user.is_approved) {
    return (
      <View style={styles.pending}>
        <Text style={styles.pendingIcon}>⏳</Text>
        <Text style={styles.pendingTitle}>Pending approval</Text>
        <Text style={styles.pendingText}>
          Your guide account is being reviewed. You&apos;ll be able to accept
          bookings as soon as we approve it.
        </Text>
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
      <Stack.Screen name="profile" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  pending: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  pendingIcon: { fontSize: 56, marginBottom: 16 },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});