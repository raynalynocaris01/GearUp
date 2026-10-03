import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Booking } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  bookings: Booking[];
  limit?: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function UpcomingBookings({ bookings, limit = 3 }: Props) {
  const router = useRouter();

  const upcoming = bookings
    .filter(
      (b) => b.status === 'pending' || b.status === 'confirmed',
    )
    .filter((b) => b.check_in)
    .sort(
      (a, b) =>
        new Date(a.check_in!).getTime() -
        new Date(b.check_in!).getTime(),
    )
    .slice(0, limit);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Bookings</Text>
        <TouchableOpacity
          onPress={() => router.push('/owner/bookings')}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {upcoming.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>
            No upcoming bookings yet.
          </Text>
        </View>
      ) : (
        <View>
          {upcoming.map((b, idx) => {
            const title =
              b.campsite?.name ?? b.gear_item?.name ?? 'Booking';
            const imageUrl =
              b.campsite?.image_url ?? b.gear_item?.image_url ?? null;

            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.row,
                  idx > 0 && styles.rowDivider,
                ]}
                onPress={() => router.push('/owner/bookings')}
                activeOpacity={0.85}
              >
                {/* Thumbnail */}
                <View style={styles.thumb}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.thumbImage}
                    />
                  ) : (
                    <Text style={styles.thumbEmoji}>
                      {b.gear_item ? '🎒' : '⛺'}
                    </Text>
                  )}
                </View>

                {/* Body */}
                <View style={styles.body}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {b.check_in ? formatDate(b.check_in) : ''}
                    {b.check_out
                      ? ` → ${formatDate(b.check_out)}`
                      : ''}
                    {b.user?.name ? ` · ${b.user.name}` : ''}
                  </Text>
                </View>

                {/* Price + status */}
                <View style={styles.rightCol}>
                  <Text style={styles.price}>
                    PHP {Number(b.total_price).toFixed(0)}
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      b.status === 'confirmed'
                        ? styles.statusConfirmed
                        : styles.statusPending,
                    ]}
                  >
                    {b.status.toUpperCase()}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#111827' },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  emptyBlock: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 13, color: colors.textMuted },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },

  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbEmoji: { fontSize: 22 },

  body: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  rowMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  rightCol: { alignItems: 'flex-end' },
  price: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.gearupGreen,
  },
  status: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statusConfirmed: { color: '#16a34a' },
  statusPending: { color: '#d97706' },
});