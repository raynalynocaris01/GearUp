import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, hasToken, clearToken } from '../../lib/api';
import { colors } from '../../theme';

type Role = 'admin' | 'owner' | 'customer';

export default function OwnerLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const loggedIn = await hasToken();
      if (!loggedIn) {
        router.replace('/login');
        return;
      }
      try {
        const res = await auth.user();
        setRole(res.data.role);
        setIsApproved(res.data.is_approved);

        if (res.data.role !== 'owner') {
          // Not an owner — send them home
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  // Owner but not yet approved
  if (role === 'owner' && !isApproved) {
    return (
      <View style={styles.pendingContainer}>
        <Text style={styles.hourglass}>⏳</Text>
        <Text style={styles.pendingTitle}>Pending approval</Text>
        <Text style={styles.pendingText}>
          Your business account is being reviewed. You'll be able to post
          campsites once we approve it.
        </Text>
        <Text style={styles.pendingHint}>
          You can still browse and book as a customer in the meantime.
        </Text>
        <TouchableOpacity
          style={styles.pendingButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.pendingButtonText}>Continue as Customer</Text>
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
      <Stack.Screen name="campsites" />
      <Stack.Screen name="bookings" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  hourglass: { fontSize: 56, marginBottom: 16 },
  pendingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  pendingHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  pendingButton: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pendingButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});