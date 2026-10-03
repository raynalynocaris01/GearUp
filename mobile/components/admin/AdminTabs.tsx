import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

interface Tab {
  href: string;
  label: string;
  exact?: boolean;
}

const TABS: Tab[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/campsites', label: 'Campsites' },
  { href: '/admin/bookings', label: 'Bookings' },
];

export function AdminTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (tab: Tab) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <TouchableOpacity
              key={tab.href}
              onPress={() => router.push(tab.href as any)}
              activeOpacity={0.7}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#183d1d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  tabTextActive: {
    color: '#183d1d',
  },
});