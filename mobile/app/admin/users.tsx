import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { admin } from '../../lib/api';
import type { AdminUser } from '@gearup/shared';
import { UserActions } from '../../components/admin/UserActions';
import { colors } from '../../theme';

type Filter = 'all' | 'pending' | 'suspended' | 'owner' | 'customer';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'owner', label: 'Owners' },
  { key: 'customer', label: 'Customers' },
];

function roleBadge(role: string, isApproved: boolean) {
  if (role === 'admin') {
    return { text: 'ADMIN', bg: '#f3e8ff', color: '#7e22ce' };
  }
  if (role === 'owner') {
    return isApproved
      ? { text: 'OWNER', bg: '#dcfce7', color: '#15803d' }
      : { text: 'PENDING', bg: '#fef3c7', color: '#92400e' };
  }
  return { text: 'CUSTOMER', bg: '#f3f4f6', color: '#374151' };
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async (showSpinner = false, f: Filter = filter) => {
    if (showSpinner) setLoading(true);
    try {
      const params: any = {};
      if (f === 'pending') params.status = 'pending';
      else if (f === 'suspended') params.status = 'suspended';
      else if (f === 'owner') params.role = 'owner';
      else if (f === 'customer') params.role = 'customer';

      const res = await admin.listUsers(params);
      setUsers(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(users.length === 0, filter);
    }, [filter]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load(false, filter);
  };

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setLoading(true);
    load(false, f);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                onPress={() => changeFilter(item.key)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gearupGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No users</Text>
              <Text style={styles.emptySubtitle}>
                No users match this filter.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = roleBadge(item.role, item.is_approved);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {item.email}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Text
                          style={[styles.badgeText, { color: badge.color }]}
                        >
                          {badge.text}
                        </Text>
                      </View>
                      {item.is_suspended && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: '#fee2e2' },
                          ]}
                        >
                          <Text
                            style={[styles.badgeText, { color: '#b91c1c' }]}
                          >
                            SUSPENDED
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <UserActions
                    userId={item.id}
                    role={item.role}
                    isApproved={item.is_approved}
                    isSuspended={item.is_suspended}
                    onSuccess={() => load(false, filter)}
                  />
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  filterRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: { backgroundColor: colors.gearupGreen },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterTextActive: { color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  actionsRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-end',
  },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});