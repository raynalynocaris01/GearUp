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
import { gear, bookings } from '../../../lib/api';
import type { GearItem } from '@gearup/shared';
import { colors } from '../../../theme';
import { imgSrc } from '../../../lib/images';

function toDateString(d: Date): string {
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

export default function NewGearBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<GearItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const dayAfter = useMemo(() => addDays(new Date(), 2), []);

  const [startDate, setStartDate] = useState(toDateString(tomorrow));
  const [endDate, setEndDate] = useState(toDateString(dayAfter));
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await gear.get(id);
        setItem(res.data);
      } catch {
        Alert.alert('Error', 'Could not load gear details.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const { days, gearPrice, totalPrice } = useMemo(() => {
    if (!item) {
      return { days: 0, gearPrice: 0, totalPrice: 0 };
    }
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    const d = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const unit = parseFloat(item.price_per_day);
    const total = unit * d * quantity;
    return { days: d, gearPrice: total, totalPrice: total };
  }, [item, startDate, endDate, quantity]);

  const handleSubmit = async () => {
    if (!item) return;

    if (startDate >= endDate) {
      Alert.alert('Invalid dates', 'Return date must be after pick-up date.');
      return;
    }
    if (quantity > item.stock) {
      Alert.alert(
        'Not enough stock',
        `Only ${item.stock} units are available.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await bookings.create({
        gear_item_id: item.id,
        gear_quantity: quantity,
        gear_start_date: startDate,
        gear_end_date: endDate,
        guests: 1,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Rental confirmed!',
        `You rented ${quantity}× ${item.name}.`,
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
        data?.errors?.gear_quantity?.[0] ??
        data?.errors?.gear_start_date?.[0] ??
        data?.errors?.gear_end_date?.[0] ??
        data?.message ??
        err.message ??
        'Could not create rental.';
      Alert.alert('Rental failed', message);
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

  if (!item) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Rent Gear</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Gear summary */}
        <View style={styles.gearCard}>
          {item.image_url ? (
            <Image
              source={{ uri: imgSrc(item.image_url) }}
              style={styles.gearImage}
            />
          ) : (
            <View style={[styles.gearImage, styles.gearImagePlaceholder]}>
              <Text style={{ fontSize: 32 }}>🎒</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.gearName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.gearCategory} numberOfLines={1}>
              {item.category}
            </Text>
            <Text style={styles.gearPrice}>
              ₱{item.price_per_day} / day
            </Text>
          </View>
        </View>

        {/* Rental dates */}
        <Text style={styles.sectionTitle}>Rental Dates</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Pick-up</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Return</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          Use YYYY-MM-DD format. Example: {toDateString(tomorrow)}
        </Text>

        {/* Quantity */}
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.fieldCard}>
          <View style={styles.stepperRow}>
            <View>
              <Text style={styles.fieldLabel}>Units to rent</Text>
              <Text style={styles.hint}>
                Max {item.stock} available
              </Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={colors.gearupGreen}
                />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setQuantity((q) => Math.min(item.stock, q + 1))
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.gearupGreen}
                />
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
            placeholder="Anything the owner should know?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Price summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {item.name}: ₱{item.price_per_day} × {days}{' '}
              {days === 1 ? 'day' : 'days'} × {quantity}
            </Text>
            <Text style={styles.summaryValue}>
              ₱{gearPrice.toFixed(2)}
            </Text>
          </View>

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
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Rental</Text>
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

  gearCard: {
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
  gearImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  gearImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gearup50,
  },
  gearName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  gearCategory: { fontSize: 12, color: colors.textMuted },
  gearPrice: {
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