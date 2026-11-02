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
import { admin } from '../../../lib/api';
import type { GuideApplication } from '@gearup/shared';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { colors } from '../../../theme';

type Filter = 'under_review' | 'pending' | 'approved' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'under_review', label: 'Under review' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_STYLE: Record<
  GuideApplication['status'],
  { bg: string; color: string; label: string }
> = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'PENDING' },
  under_review: { bg: '#dbeafe', color: '#1e40af', label: 'UNDER REVIEW' },
  approved: { bg: '#dcfce7', color: '#15803d', label: 'APPROVED' },
  rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'REJECTED' },
  auto_approved: { bg: '#ccfbf1', color: '#0f766e', label: 'AUTO-APPROVED' },
};

const SOURCE_LABEL: Record<GuideApplication['submission_source'], string> = {
  self_signup: 'Self-signup',
  customer_upgrade: 'Customer upgrade',
  owner_created: 'Owner-created',
  admin_created: 'Admin-created',
};

export default function AdminGuideApplicationsScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('under_review');

  const load = async (showSpinner = false, f: Filter = filter) => {
    if (showSpinner) setLoading(true);
    try {
      const params = f === 'all' ? {} : { status: f };
      const res = await admin.guideApplications.list(params);
      setApplications(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(applications.length === 0, filter);
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
      <AdminHeader title="Guide Applications" />

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
                style={[styles.filterChip, active && styles.filterChipActive]}
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
          data={applications}
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
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No applications</Text>
              <Text style={styles.emptySubtitle}>
                No applications match this filter.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = STATUS_STYLE[item.status];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push(`/admin/guide-applications/${item.id}` as any)
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.applicant?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.applicant?.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {item.applicant?.email ?? ''}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  <Text style={styles.source}>
                    {SOURCE_LABEL[item.submission_source]}
                  </Text>
                </View>
                {item.resume_url && (
                  <View style={styles.resumeRow}>
                    <Ionicons
                      name="document-outline"
                      size={14}
                      color={colors.gearupGreen}
                    />
                    <Text style={styles.resumeText}>Resume attached</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  source: { fontSize: 11, color: colors.textMuted },
  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumeText: { fontSize: 11, color: colors.gearupGreen, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});