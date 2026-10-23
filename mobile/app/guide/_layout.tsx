import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
        <Ionicons name="hourglass-outline" size={56} color="#d97706" style={{ marginBottom: 16 }} />
        <Text style={styles.pendingTitle}>Pending approval</Text>
        <Text style={styles.pendingText}>
          Your guide account is being reviewed. You&apos;ll be able to accept
          bookings as soon as we approve it. In the meantime, you can still
          use GearUp as a customer.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.continueButton}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue as Customer</Text>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
