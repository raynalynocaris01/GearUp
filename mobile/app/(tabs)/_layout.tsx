import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, hasToken } from '../../lib/api';
import { colors } from '../../theme';

type User = {
  id: number;
  role: 'admin' | 'owner' | 'customer' | 'guide';
  password_must_change?: boolean;
};

export default function TabsLayout() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!(await hasToken())) {
          setChecking(false);
          return;
        }
        const res = await auth.user();
        setUser(res.data as User);
      } catch {
        // auth failures handled elsewhere; guest mode is fine
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

  if (user?.role === 'guide' && user.password_must_change) {
    return (
      <View style={styles.locked}>
        <Ionicons name="lock-closed-outline" size={64} color="#d97706" />
        <Text style={styles.lockedTitle}>Password change required</Text>
        <Text style={styles.lockedText}>
          You must change your temporary password before accessing the app.
          {'\n\n'}Tap below to open your guide profile.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/guide/profile')}
          style={styles.lockedBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.lockedBtnText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gearupGreen,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: '#e5e7eb',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  lockedBtn: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  lockedBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
