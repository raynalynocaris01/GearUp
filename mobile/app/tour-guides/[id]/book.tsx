import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tourGuides, bookings } from '../../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { colors } from '../../../theme';

function toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function BookTourGuideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [guide, setGuide] = useState<TourGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const tomorrow = useMemo(() => toDateInput(addDays(new Date(), 1)), []);
  const dayAfter = useMemo(() => toDateInput(addDays(new Date(), 2)), []);

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await tourGuides.get(id);
        setGuide(res.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async () => {
    if (!guide) return;
    if (checkIn >= checkOut) {
      Alert.alert('Invalid dates', 'Return date must be after start date.');
      return;
    }

    setSubmitting(true);
    try {
      await bookings.create({
        tour_guide_id: guide.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        notes: notes.trim() || undefined,
      });
      router.replace('/(tabs)/bookings' as any);
    } catch (err: any) {
      Alert.alert(
        'Booking failed',
        err?.response?.data?.message ??
          err?.response?.data?.errors?.check_in?.[0] ??
          'Could not book this guide.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Guide not found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tripPrice = parseFloat(guide.price_per_trip);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book guide</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Guide summary */}
        <View style={styles.summary}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {guide.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {guide.name}
            </Text>
            <Text style={styles.subtitle}>
              PHP {tripPrice.toFixed(0)} per trip
            </Text>
          </View>
        </View>

        {/* Dates */}
        <Text style={styles.label}>Trip start</Text>
        <TextInput
          value={checkIn}
          onChangeText={setCheckIn}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Trip end</Text>
        <TextInput
          value={checkOut}
          onChangeText={setCheckOut}
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />

        {/* Guests */}
        <Text style={styles.label}>Number of people</Text>
        <TextInput
          value={String(guests)}
          onChangeText={(v) => {
            const n = Math.max(
              1,
              Math.min(20, Number(v.replace(/[^0-9]/g, '')) || 1),
            );
            setGuests(n);
          }}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={2}
        />

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.textarea]}
          placeholder="Anything the guide should know?"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            PHP {tripPrice.toFixed(0)}
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Booking...' : 'Confirm booking'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  errorText: { fontSize: 14, color: colors.textMuted },
  backButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: colors.gearupGreen,
    fontSize: 14,
    fontWeight: '700',
  },

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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  scroll: { flex: 1 },
  content: { padding: 16 },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  name: { fontSize: 16, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: colors.gearupGreen, marginTop: 2, fontWeight: '700' },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.gearupGreen,
  },

  submitBtn: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});