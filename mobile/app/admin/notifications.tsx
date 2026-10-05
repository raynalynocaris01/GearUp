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
import { notifications as notifApi, hasToken } from '../../lib/api';
import type { AppNotification } from '@gearup/shared';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { colors } from '../../theme';

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const isAuth = await hasToken();
      if (!isAuth) {
        setItems([]);
        return;
      }
      const res = await notifApi.list({ limit: 100 });
      setItems(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(items.length === 0);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => ({ ...x, read_at: now })));
    try {
      await notifApi.markAllRead();
    } catch {
      // silent
    }
  };

  const onClickItem = async (n: AppNotification) => {
    if (!n.read_at) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
      try {
        await notifApi.markRead(n.id);
      } catch {
        // silent
      }
    }
    if (n.action_url) {
      router.push(n.action_url as any);
    }
  };

  const unread = items.filter((i) => !i.read_at).length;

  return (
    <View style={styles.container}>
      <AdminHeader title="Notifications" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gearupGreen} />
        </View>
      ) : (
        <FlatList
          data={items}
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
          ListHeaderComponent={
            unread > 0 ? (
              <View style={styles.unreadBar}>
                <Text style={styles.unreadText}>
                  {unread} unread{' '}
                  {unread === 1 ? 'notification' : 'notifications'}
                </Text>
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={styles.markAll}>Mark all read</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Admin activity will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read_at && styles.cardUnread]}
              activeOpacity={0.85}
              onPress={() => onClickItem(item)}
            >
              <View style={styles.cardTop}>
                {!item.read_at && <View style={styles.dot} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.body ? (
                    <Text style={styles.cardBody} numberOfLines={3}>
                      {item.body}
                    </Text>
                  ) : null}
                  <Text style={styles.cardTime}>
                    {timeAgo(item.created_at)}
                  </Text>
                </View>
                {item.action_url ? (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#9ca3af"
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 10 },

  unreadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unreadText: { fontSize: 12, color: colors.textMuted },
  markAll: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gearupGreen,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
  },
  cardUnread: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gearupGreen,
    marginTop: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardBody: { fontSize: 12, color: '#4b5563', marginTop: 4, lineHeight: 17 },
  cardTime: { fontSize: 11, color: colors.textMuted, marginTop: 6 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});