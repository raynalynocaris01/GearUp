import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, hasToken, clearToken } from '../../lib/api';
import { colors } from '../../theme';
import { OwnerDrawerContent } from '../../components/owner/OwnerDrawerContent';

type Role = 'admin' | 'owner' | 'customer';

export default function OwnerLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );

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
        setUser({ name: res.data.name, email: res.data.email });

        if (res.data.role !== 'owner') {
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
  }, [router]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (role === 'owner' && !isApproved) {
    return (
      <View style={styles.pendingContainer}>
                <Ionicons
          name="hourglass-outline"
          size={56}
          color={colors.gearupGreen}
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.pendingTitle}>Pending approval</Text>
        <Text style={styles.pendingText}>
          Your business account is being reviewed. You will be able to post
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

  const activeRoute = (() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'index';
    return parts[1];
  })();

  return (
    <Drawer
      drawerContent={(props) => (
        <OwnerDrawerContent
          ownerName={user?.name ?? 'Owner'}
          ownerEmail={user?.email ?? ''}
          onClose={() => props.navigation.closeDrawer()}
          activeRoute={activeRoute}
        />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 280 },
        swipeEdgeWidth: 40,
      }}
    >
       <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Drawer.Screen name="campsites" options={{ title: 'Campsites' }} />
      <Drawer.Screen name="gear" options={{ title: 'Gear' }} />
      <Drawer.Screen name="events" options={{ title: 'Events' }} />
      <Drawer.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
      <Drawer.Screen
        name="campsites/new"
        options={{ title: 'New Campsite', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="campsites/[id]/edit"
        options={{ title: 'Edit Campsite', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="campsites/[id]/tour-guides"
        options={{ title: 'Tour Guides', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="gear/new"
        options={{ title: 'New Gear', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="gear/[id]/edit"
        options={{ title: 'Edit Gear', drawerItemStyle: { display: 'none' } }}
      />
            <Drawer.Screen
        name="events/new"
        options={{ title: 'New Event', drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="events/[id]/edit"
        options={{ title: 'Edit Event', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  
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
