import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  adminName: string;
  adminEmail: string;
  onClose: () => void;
  activeRoute: string;
}

interface NavItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}

const NAV: NavItem[] = [
  { key: 'index', label: 'Dashboard', icon: 'grid-outline', href: '/admin' },
  { key: 'users', label: 'Users', icon: 'people-outline', href: '/admin/users' },
  {
    key: 'campsites',
    label: 'Campsites',
    icon: 'triangle-outline',
    href: '/admin/campsites',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: 'calendar-outline',
    href: '/admin/bookings',
  },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: 'star-outline',
    href: '/admin/reviews',
  },
  {
    key: 'events',
    label: 'Events',
    icon: 'sparkles-outline',
    href: '/admin/events',
  },
];

export function AdminDrawerContent({
  adminName,
  adminEmail,
  onClose,
  activeRoute,
}: Props) {
  const router = useRouter();
  const initial = adminName.charAt(0).toUpperCase();

  const go = (href: string) => {
    onClose();
    router.push(href as any);
  };

  return (
    <View style={styles.wrap}>
            {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>GearUp</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>ADMIN</Text>
          </View>
        </View>
      </View>

            {/* Context */}
      <View style={styles.context}>
        <Text style={styles.contextLabel}>Admin Panel</Text>
        <Text style={styles.contextName} numberOfLines={1}>
          {adminName}
        </Text>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV.map((item) => {
          const active = activeRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => go(item.href)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? '#fff' : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {active && <View style={styles.activeBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Secondary */}
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => {
          onClose();
          router.replace('/(tabs)' as any);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.7)" />
               <Text style={styles.secondaryText}>Switch to Customer</Text>
      </TouchableOpacity>

      {/* User */}
      <View style={styles.userBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {adminName}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {adminEmail}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logout}
        onPress={async () => {
          const { auth, clearToken } = await import('../../lib/api');
          try {
            await auth.logout();
          } catch {
            // ignore
          }
          await clearToken();
          onClose();
          router.replace('/login');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={18} color="#fca5a5" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#183d1d',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
   brandTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },

  context: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  contextName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  nav: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -10,
    height: 20,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  navLabelActive: {
    color: '#fff',
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  userEmail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fca5a5',
  },
});