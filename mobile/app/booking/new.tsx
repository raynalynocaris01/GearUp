import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { campsites, bookings ,tourGuides} from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

function toDateString(d: Date): string {
  // YYYY-MM-DD in local time
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

function formatDisplay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NewBookingScreen() {
  const router = useRouter();
  const { campsiteId } = useLocalSearchParams<{ campsiteId: string }>();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Default: tomorrow → day after
  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const dayAfter = useMemo(() => addDays(new Date(), 2), []);

  const [checkIn, setCheckIn] = useState(toDateString(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateString(dayAfter));
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [availableGuides, setAvailableGuides] = useState<
  { id: number; name: string; description: string | null; price_per_trip: string }[]
  >([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);

  useEffect(() => {
    if (!campsite) return;
    (async () => {
      try {
        const res = await tourGuides.list({ campsite_id: campsite.id });
        setAvailableGuides(res.data);
      } catch {
        // silent
      }
    })();
  }, [campsite]);

  useEffect(() => {
    (async () => {
      try {
        const res = await campsites.get(campsiteId);
        setCampsite(res.data);
      } catch {
        Alert.alert('Error', 'Could not load campsite details.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [campsiteId]);

  // Live price preview
 const { nights, campsitePrice, guidePrice, totalPrice } = useMemo(() => {
  if (!campsite) {
    return { nights: 0, campsitePrice: 0, guidePrice: 0, totalPrice: 0 };
  }
  const start = new Date(checkIn + 'T00:00:00');
  const end = new Date(checkOut + 'T00:00:00');
  const diffMs = end.getTime() - start.getTime();
  const n = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  const unit = parseFloat(campsite.price_per_night);

  const cPrice =
    campsite.price_unit === 'entrance' ? unit * guests : unit * n * guests;

  const selectedGuide = availableGuides.find((g) => g.id === selectedGuideId);
  const gPrice = selectedGuide
    ? parseFloat(selectedGuide.price_per_trip)
    : 0;

  return {
    nights: campsite.price_unit === 'entrance' ? 0 : n,
    campsitePrice: cPrice,
    guidePrice: gPrice,
    totalPrice: cPrice + gPrice,
  };
}, [campsite, checkIn, checkOut, guests, availableGuides, selectedGuideId]);

  const handleSubmit = async () => {
    if (!campsite) return;

    // Simple client-side validation
    if (checkIn >= checkOut) {
      Alert.alert('Invalid dates', 'Check-out must be after check-in.');
      return;
    }
    if (guests > campsite.capacity) {
      Alert.alert(
        'Too many guests',
        `This campsite allows up to ${campsite.capacity} guests.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookings.create({
      campsite_id: campsite.id,
      tour_guide_id: selectedGuideId ?? undefined,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      notes: notes.trim() || undefined,
    });

      Alert.alert(
        'Booking confirmed!',
        `Your reservation at ${campsite.name} is confirmed.`,
        [
          {
            text: 'View Bookings',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ],
      );
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.check_in?.[0] ??
        data?.errors?.guests?.[0] ??
        data?.errors?.check_out?.[0] ??
        data?.message ??
        err.message ??
        'Could not create booking.';
      Alert.alert('Booking failed', message);
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

  if (!campsite) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar with back */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>New Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campsite summary */}
        <View style={styles.campsiteCard}>
          <Image
            source={{ uri: campsite.image_url }}
            style={styles.campsiteImage}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.campsiteName} numberOfLines={1}>
              {campsite.name}
            </Text>
            <Text style={styles.campsiteLocation} numberOfLines={1}>
              📍 {campsite.location}
            </Text>
            <Text style={styles.campsitePrice}>
              ₱{campsite.price_per_night} / {campsite.price_unit}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <Text style={styles.sectionTitle}>Dates</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Check-in</Text>
            <TextInput
              style={styles.dateInput}
              value={checkIn}
              onChangeText={setCheckIn}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Check-out</Text>
            <TextInput
              style={styles.dateInput}
              value={checkOut}
              onChangeText={setCheckOut}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Use YYYY-MM-DD format. Example: {toDateString(tomorrow)}
        </Text>

        {/* Guests */}
        <Text style={styles.sectionTitle}>Guests</Text>
        <View style={styles.fieldCard}>
          <View style={styles.stepperRow}>
            <View>
              <Text style={styles.fieldLabel}>Number of guests</Text>
              <Text style={styles.hint}>
                Max {campsite.capacity} for this campsite
              </Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setGuests((g) => Math.max(1, g - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.gearupGreen} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{guests}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setGuests((g) => Math.min(campsite.capacity, g + 1))
                }
              >
                <Ionicons name="add" size={20} color={colors.gearupGreen} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <View style={styles.fieldCard}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything the host should know?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>
        {/* Tour guide picker */}
{availableGuides.length > 0 && (
  <View>
    <Text style={styles.sectionTitle}>
      Add a tour guide? (optional)
    </Text>
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        style={[
          styles.guideOption,
          selectedGuideId === null && styles.guideOptionActive,
        ]}
        onPress={() => setSelectedGuideId(null)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={selectedGuideId === null ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selectedGuideId === null ? colors.gearupGreen : '#9ca3af'}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.guideName}>No guide</Text>
          <Text style={styles.guideDesc}>Just book the campsite.</Text>
        </View>
      </TouchableOpacity>

      {availableGuides.map((g) => {
        const price = parseFloat(g.price_per_trip);
        const active = selectedGuideId === g.id;
        return (
          <TouchableOpacity
            key={g.id}
            style={[
              styles.guideOption,
              active && styles.guideOptionActive,
            ]}
            onPress={() => setSelectedGuideId(g.id)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={active ? colors.gearupGreen : '#9ca3af'}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.guideRow}>
                <Text style={styles.guideName}>{g.name}</Text>
                <Text style={styles.guidePrice}>
                  {price > 0 ? `+₱${price.toFixed(0)}` : 'Free'}
                </Text>
              </View>
              {g.description && (
                <Text style={styles.guideDesc} numberOfLines={2}>
                  {g.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
)}

        {/* Price summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {campsite.price_unit === 'entrance'
                ? `Campsite: ₱${campsite.price_per_night} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`
                : `Campsite: ₱${campsite.price_per_night} × ${nights} ${nights === 1 ? 'night' : 'nights'} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
            </Text>
            <Text style={styles.summaryValue}>
              ₱{campsitePrice.toFixed(2)}
            </Text>
          </View>

          {selectedGuideId !== null && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Guide: {availableGuides.find((g) => g.id === selectedGuideId)?.name}
              </Text>
              <Text style={styles.summaryValue}>
                ₱{guidePrice.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              ₱{totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
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
  topBarTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  scrollContent: { padding: 20, gap: 12 },

  campsiteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    marginBottom: 8,
  },
  campsiteImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  campsiteName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  campsiteLocation: { fontSize: 12, color: colors.textMuted },
  campsitePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginLeft: 4,
  },

  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldLabel: { fontSize: 14, color: '#111827', fontWeight: '600' },
  dateInput: {
    fontSize: 14,
    color: colors.gearupGreen,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 120,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    marginTop: 4,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },

  notesInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 70,
    textAlignVertical: 'top',
    padding: 0,
  },

  // Tour guide picker
  guideOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  guideOptionActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  guideName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  guidePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
  },
  guideDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },

  // Price summary
  summary: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    paddingRight: 8,
  },
  summaryValue: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#86efac',
    marginVertical: 10,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532d',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14532d',
  },

  submitButton: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});