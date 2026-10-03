import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  campsites: Campsite[];
  limit?: number;
}

export function CampsiteOverview({ campsites, limit }: Props) {
  const router = useRouter();
  const visible = typeof limit === 'number' ? campsites.slice(0, limit) : campsites;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Campsite Overview</Text>
        <TouchableOpacity
          onPress={() => router.push('/owner/campsites')}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {visible.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="map-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No campsites yet</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((c) => {
            const revenue = Number(c.revenue ?? 0);
            const price = Number(c.price_per_night ?? 0);
            const unit = c.price_unit === 'entrance' ? 'entrance' : 'night';

            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.topRow}>
                  {c.image_url ? (
                    <Image
                      source={{ uri: c.image_url }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]}>
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                    </View>
                  )}

                  <View style={styles.nameBlock}>
                    <Text style={styles.name} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.location} numberOfLines={1}>
                      {c.location}
                    </Text>
                    {c.is_featured ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Featured</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() =>
                      router.push(`/owner/campsites/${c.id}/edit` as any)
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.gearupGreen}
                    />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Price</Text>
                    <Text style={styles.metricValue} numberOfLines={1}>
                      PHP {price.toFixed(0)} / {unit}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Bookings</Text>
                    <Text style={styles.metricValue} numberOfLines={1}>
                      {c.bookings_count ?? 0}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Revenue</Text>
                    <Text style={styles.metricValue} numberOfLines={1}>
                      PHP {revenue.toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  list: { gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  location: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gearup50,
    backgroundColor: colors.gearup50,
  },
  editText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gearupGreen,
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metric: { flex: 1 },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { fontSize: 12, color: colors.textMuted },
});