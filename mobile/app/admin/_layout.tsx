import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { View, ActivityIndicator } from 'react-native';
import { auth, hasToken, clearToken } from '../../lib/api';
import { colors } from '../../theme';
import { AdminDrawerContent } from '../../components/admin/AdminDrawerContent';

type Role = 'admin' | 'owner' | 'customer';

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
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
        const role = res.data.role as Role;
        setUser({ name: res.data.name, email: res.data.email });

        if (role !== 'admin') {
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

  const activeRoute = (() => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'index';
    return parts[1];
  })();

  return (
    <Drawer
      drawerContent={(props) => (
        <AdminDrawerContent
          adminName={user?.name ?? 'Admin'}
          adminEmail={user?.email ?? ''}
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
      <Drawer.Screen name="users" options={{ title: 'Users' }} />
      <Drawer.Screen name="campsites" options={{ title: 'Campsites' }} />
      <Drawer.Screen name="bookings" options={{ title: 'Bookings' }} />
    </Drawer>
  );
}