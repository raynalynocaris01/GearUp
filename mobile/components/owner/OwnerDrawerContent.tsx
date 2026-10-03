import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, clearToken } from '../../lib/api';
import { colors } from '../../theme';

interface NavItem {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NAV: NavItem[] = [
  { route: '/owner', label: 'Dashboard', icon: 'grid-outline' },
  { route: '/owner/bookings', label: 'Bookings', icon: 'calendar-outline' },
  { route: '/owner/campsites', label: 'Campsites', icon: 'home-outline' },
  { route: '/owner/gear', label: 'Gear', icon: 'bag-handle-outline' },
  { route: '/owner/events', label: 'Events', icon: 'calendar-number-outline' },
  { route: '/owner/reviews', label: 'Reviews', icon: 'star-outline' },
  { route: '/owner/settings', label: 'Settings', icon: 'settings-outline' },
];

interface Props {
  ownerName?: string;
  ownerEmail?: string;
  campName?: string;
  // Called by Drawer when it wants to close the drawer
  onClose?: () => void;
  // Called by Drawer to know which route is active
  activeRoute?: string;
}

export function OwnerDrawerContent({
  ownerName = 'Owner',
  ownerEmail = '',
  campName,
  onClose,
  activeRoute,
}: Props) {
  const router = useRouter();
  const initial = ownerName.charAt(0).toUpperCase();

  const go = (route: string) => {
    onClose?.();
    router.push(route as any);
  };

  const handleSwitchToCustomer = () => {
    onClose?.();
    router.replace('/(tabs)');
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {}
    await clearToken();
    onClose?.();
    router.replace('/login');
  };

  const isActive = (route: string) => {
    if (!activeRoute) return false;
    const name = route.replace('/owner/', '').replace('/owner', 'index');
    return (
      activeRoute === name ||
      activeRoute === `${name}/index` ||
      activeRoute.startsWith(`${name}/`)
    );
  };

  return (
    <View style={styles.container}>
      {/* Brand */}
      <View style={styles.brandRow}>
        <Text style={styles.brand}>
          <Text style={styles.brandDark}>Gear</Text>
          <Text style={styles.brandGreen}>Up</Text>
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>OWNER</Text>
        </View>
      </View>

      {/* Owner context */}
      <View style={styles.contextBlock}>
        <Text style={styles.contextLabel}>
          {campName ?? 'Owner Dashboard'}
        </Text>
        <Text style={styles.contextName}>{ownerName}</Text>
      </View>

      {/* Nav items */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navList}>
          {NAV.map((item) => {
            const active = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => go(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={active ? colors.gearupGreen : '#6b7280'}
                />
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Notification row */}
        <TouchableOpacity style={styles.bottomRow} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color="#6b7280" />
          <Text style={styles.bottomRowLabel}>Notifications</Text>
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>0</Text>
          </View>
        </TouchableOpacity>

        {/* Switch to customer */}
        <TouchableOpacity
          style={styles.bottomRow}
          onPress={handleSwitchToCustomer}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color="#6b7280" />
          <Text style={styles.bottomRowLabel}>Switch to Customer</Text>
        </TouchableOpacity>

        {/* User block */}
        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {ownerName}
            </Text>
            {ownerEmail ? (
              <Text style={styles.userEmail} numberOfLines={1}>
                {ownerEmail}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  brandDark: { color: '#111827' },
  brandGreen: { color: colors.gearupGreen },
  badge: {
    backgroundColor: colors.gearup50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gearupGreen,
    letterSpacing: 0.5,
  },

  contextBlock: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contextLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  contextName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  scrollContent: { paddingVertical: 8 },

  navList: { paddingVertical: 8 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: colors.gearup50,
    borderLeftColor: colors.gearupGreen,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  navLabelActive: {
    color: colors.gearupGreen,
    fontWeight: '800',
  },

  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bottomRowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  notifBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  userName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
});