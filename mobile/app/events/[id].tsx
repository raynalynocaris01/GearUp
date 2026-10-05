import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { events as eventApi, hasToken } from '../../lib/api';
import type { EventItem, EventRegistration } from '@gearup/shared';
import { colors } from '../../theme';
import { imgSrc } from '../../lib/images';

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString(
    'en-US',
    opts,
  )}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [reg, setReg] = useState<EventRegistration | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const isAuth = await hasToken();
      setLoggedIn(isAuth);

      const ev = await eventApi.get(id);
      setEvent(ev.data);

      if (isAuth) {
        try {
          const st = await eventApi.registrationStatus(id);
          const payload = st.data;
          // Sanctum/Symfony may return `null`, `""`, or `{}` for no reg.
          const hasReg =
            payload &&
            typeof payload === 'object' &&
            'id' in payload &&
            (payload as any).id != null;
          setReg(hasReg ? (payload as EventRegistration) : null);
        } catch {
          setReg(null);
        }
      } else {
        setReg(null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id]),
  );

  const handleRegister = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await eventApi.register(id, { guests });
      await load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        'Could not register. Please try again.';
      Alert.alert('Registration failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

    const handleCancel = async () => {
    if (!reg || typeof reg.id !== 'number') {
      Alert.alert(
        'Error',
        'Registration not loaded yet. Please pull down to refresh.',
      );
      return;
    }
    setCancelling(true);
    try {
      await eventApi.cancelRegistration(reg.id);
      await load();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Could not cancel registration.';
      Alert.alert('Cancel failed', msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Event not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRegistered = reg && reg.status !== 'cancelled';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: imgSrc(event.image_url) }}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTextWrap}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>EVENT</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {event.name}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {event.location}
              {event.region ? ` - ${event.region}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* About */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About this event</Text>
            <Text style={styles.cardBody}>{event.description}</Text>
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>When</Text>
                <Text style={styles.detailValue}>
                  {formatRange(event.starts_at, event.ends_at)}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Where</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailValue}>{event.capacity} people</Text>
              </View>
            </View>
            {event.owner?.name ? (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailLabel}>Organizer</Text>
                  <Text style={styles.detailValue}>{event.owner.name}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Register panel */}
          <View style={styles.card}>
            <Text style={styles.priceLabel}>Price per person</Text>
            <Text style={styles.priceValue}>PHP {event.price_per_person}</Text>

            <View style={{ height: 12 }} />

            {!loggedIn ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Log in to register</Text>
              </TouchableOpacity>
            ) : isRegistered ? (
              <>
                 <View style={styles.registeredBox}>
                  <Text style={styles.registeredTitle}>
                    You are registered
                  </Text>
                  <Text style={styles.registeredSub}>
                    {reg.guests ?? 1}{' '}
                    {(reg.guests ?? 1) === 1 ? 'guest' : 'guests'}
                    {reg.total_price ? ` - PHP ${reg.total_price}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.dangerBtn, cancelling && { opacity: 0.6 }]}
                  onPress={handleCancel}
                  disabled={cancelling}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dangerBtnText}>
                    {cancelling ? 'Cancelling...' : 'Cancel registration'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Number of guests</Text>
                <TextInput
                  value={String(guests)}
                  onChangeText={(v) => {
                    const n = Math.max(
                      1,
                      Math.min(event.capacity, Number(v.replace(/[^0-9]/g, '')) || 1),
                    );
                    setGuests(n);
                  }}
                  keyboardType="number-pad"
                  style={styles.input}
                  maxLength={2}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleRegister}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting ? 'Registering...' : 'Register for this event'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  emptyText: { fontSize: 14, color: colors.textMuted },
  backLink: { fontSize: 14, fontWeight: '700', color: colors.gearupGreen },

  heroWrap: { height: 300, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 8,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  cardBody: { fontSize: 13, color: '#374151', lineHeight: 20 },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },

  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.gearupGreen,
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  dangerBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  dangerBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 14 },

  registeredBox: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  registeredTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  registeredSub: { fontSize: 12, color: '#166534', marginTop: 4 },
});