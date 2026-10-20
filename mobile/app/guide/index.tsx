import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { guide as guideApi, notifications as notifApi, auth } from '../../lib/api';
import { colors } from '../../theme';
import { GuideBookingsList } from '../../components/guide/GuideBookingsList';

interface GuideProfile {
  id: number;
  name: string;
  price_per_trip: string;
  location: string | null;
  description: string | null;
  is_independent: boolean;
  campsite_id: number | null;
}

interface Booking {
  id: number;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  total_price: string;
  guide_status: 'pending' | 'accepted' | 'declined' | null;
  campsite?: { id: number; name: string; location: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

export default function GuideDashboardScreen() {
  const router = useRouter();

  // Force redirect to profile if password_must_change is set
  useEffect(() => {
    (async () => {
      try {
        const res = await auth.user();
        if ((res.data as any).password_must_change) {
          router.replace('/guide/profile');
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        guideApi.profile.get(),
        guideApi.bookings.list(),
      ]);
      setProfile(profileRes.data);
      setBookings(bookingsRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load(profile === null);
    }, [profile]),
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await notifApi.unreadCount();
          setUnreadCount(res.data.count);
        } catch {}
      })();
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const pendingCount = bookings.filter((b) => b.guide_status === 'pending').length;
  const acceptedCount = bookings.filter((b) => b.guide_status === 'accepted').length;
  const declinedCount = bookings.filter((b) => b.guide_status === 'declined').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 16 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.gearupGreen}
        />
      }
    >
      {/* Header with notification + profile buttons */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tour Guide Dashboard</Text>
          <Text style={styles.subtitle}>Manage your bookings and profile.</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push('/guide/notifications' as any)}
            style={styles.profileBtn}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.gearupGreen}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/guide/profile' as any)}
            style={styles.profileBtn}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.gearupGreen}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Pending" value={pendingCount} color="#d97706" bg="#fef3c7" />
        <StatCard label="Accepted" value={acceptedCount} color="#15803d" bg="#dcfce7" />
        <StatCard label="Declined" value={declinedCount} color="#b91c1c" bg="#fee2e2" />
      </View>

      {/* Profile card */}
      {profile && (
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <Text style={styles.profileCardTitle}>Your Profile</Text>
            <TouchableOpacity
              onPress={() => router.push('/guide/profile' as any)}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.profileLine}>
            <Text style={styles.profileLabel}>Rate: </Text>
            PHP {parseFloat(profile.price_per_trip).toFixed(2)} per trip
          </Text>
          {profile.location && (
            <Text style={styles.profileLine}>
              <Text style={styles.profileLabel}>Location: </Text>
              {profile.location}
            </Text>
          )}
          {profile.description && (
            <Text style={styles.profileDescription}>{profile.description}</Text>
          )}
        </View>
      )}

      {/* Bookings */}
      <Text style={styles.sectionTitle}>Your Bookings</Text>
      <GuideBookingsList bookings={bookings} onRefresh={() => load()} />
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gearup50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 6,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    marginBottom: 20,
  },
  profileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  editLink: { fontSize: 13, fontWeight: '700', color: colors.gearupGreen },
  profileLine: { fontSize: 13, color: '#374151', marginBottom: 4 },
  profileLabel: { fontWeight: '700', color: '#111827' },
  profileDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
});
