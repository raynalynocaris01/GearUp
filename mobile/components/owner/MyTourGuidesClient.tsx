import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { colors } from '../../theme';

type FilterKey = 'all' | 'attached' | 'independent';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attached', label: 'Attached' },
  { key: 'independent', label: 'Independent' },
];

interface Props {
  initialGuides: TourGuide[];
  onRefresh?: () => Promise<void>;
}

export function MyTourGuidesClient({ initialGuides, onRefresh }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    contact_number: '',
    price_per_trip: '',
    location: '',
    email: '',
    description: '',
  });

  const counts = useMemo(
    () => ({
      all: initialGuides.length,
      attached: initialGuides.filter((g) => !g.is_independent).length,
      independent: initialGuides.filter((g) => g.is_independent).length,
    }),
    [initialGuides],
  );

  const visible = useMemo(() => {
    if (filter === 'attached')
      return initialGuides.filter((g) => !g.is_independent);
    if (filter === 'independent')
      return initialGuides.filter((g) => g.is_independent);
    return initialGuides;
  }, [initialGuides, filter]);

  const resetForm = () =>
    setForm({
      name: '',
      contact_number: '',
      price_per_trip: '',
      location: '',
      email: '',
      description: '',
    });

  const handleCreate = async () => {
    setError('');
    if (!form.name.trim() || !form.contact_number.trim()) {
      Alert.alert('Missing fields', 'Name and contact number are required.');
      return;
    }
    setSubmitting(true);
    try {
      await owner.createIndependentGuide({
        name: form.name.trim(),
        contact_number: form.contact_number.trim(),
        price_per_trip: form.price_per_trip
          ? Number(form.price_per_trip)
          : 0,
        location: form.location.trim() || undefined,
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      resetForm();
      setCreating(false);
      await onRefresh?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.errors?.name?.[0] ??
        err?.message ??
        'Could not create guide.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async (g: TourGuide) => {
    setDeletingId(g.id);
    try {
      await owner.deleteTourGuide(g.id);
      await onRefresh?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Could not delete guide.';
      Alert.alert('Delete failed', msg);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (g: TourGuide) => {
    Alert.alert(
      'Remove this tour guide?',
      `Remove ${g.name}? They will no longer appear anywhere on GearUp.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => performDelete(g),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Filters row */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {f.label}
                </Text>
                <Text
                  style={[
                    styles.chipCount,
                    active && styles.chipCountActive,
                  ]}
                >
                  {counts[f.key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Create toggle */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setCreating((v) => !v)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={creating ? 'close' : 'add'}
            size={18}
            color="#fff"
          />
          <Text style={styles.createBtnText}>
            {creating ? 'Cancel' : 'New independent guide'}
          </Text>
        </TouchableOpacity>

        {/* Create form */}
        {creating && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add independent guide</Text>
            <Text style={styles.formHint}>
              Independent guides are not attached to a campsite. They appear in
              the public Tour Guides directory.
            </Text>

            <Text style={styles.label}>Full name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Juan Dela Cruz"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Contact number *</Text>
            <TextInput
              style={styles.input}
              value={form.contact_number}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, contact_number: v }))
              }
              keyboardType="phone-pad"
              placeholder="e.g. 09171234567"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Price per trip (PHP)</Text>
            <TextInput
              style={styles.input}
              value={form.price_per_trip}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, price_per_trip: v }))
              }
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              placeholder="e.g. Negros Oriental"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. name@example.com"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.description}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, description: v }))
              }
              multiline
              numberOfLines={3}
              placeholder="Short bio or specialties"
              placeholderTextColor="#9ca3af"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setCreating(false);
                  resetForm();
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting && { opacity: 0.6 },
                ]}
                onPress={handleCreate}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Add guide</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List */}
        {visible.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              No guides {filter !== 'all' ? 'in this filter' : 'yet'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Create an independent guide or attach guides to your campsites.'
                : 'Try a different filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {visible.map((g, idx) => (
              <View key={g.id}>
                {idx > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {g.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <View
                        style={[
                          styles.tag,
                          g.is_independent
                            ? styles.tagIndependent
                            : styles.tagAttached,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            g.is_independent
                              ? styles.tagTextIndependent
                              : styles.tagTextAttached,
                          ]}
                        >
                          {g.is_independent ? 'INDEPENDENT' : 'ATTACHED'}
                        </Text>
                      </View>
                    </View>

                    {g.campsite?.name ? (
                      <Text style={styles.atCampsite} numberOfLines={1}>
                        at{' '}
                        <Text style={styles.atCampsiteName}>
                          {g.campsite.name}
                        </Text>
                      </Text>
                    ) : null}

                    <Text style={styles.contact} numberOfLines={1}>
                      {g.contact_number}
                      {g.email ? ` - ${g.email}` : ''}
                    </Text>

                    {g.description ? (
                      <Text style={styles.description} numberOfLines={2}>
                        {g.description}
                      </Text>
                    ) : null}

                    {g.price_per_trip &&
                    Number(g.price_per_trip) > 0 ? (
                      <Text style={styles.price}>
                        PHP {Number(g.price_per_trip).toFixed(0)} per trip
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.removeBtn,
                      deletingId === g.id && { opacity: 0.5 },
                    ]}
                    onPress={() => confirmDelete(g)}
                    disabled={deletingId === g.id}
                    activeOpacity={0.8}
                  >
                    {deletingId === g.id ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <Text style={styles.removeBtnText}>Remove</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer hint */}
        <TouchableOpacity
          style={styles.footerHint}
          onPress={() => router.push('/owner/campsites' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.footerHintText}>
            Attached guides live on their campsite pages. Manage them from{' '}
            <Text style={styles.footerHintLink}>Campsites</Text>.
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16 },

  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: colors.gearupGreen,
    borderColor: colors.gearupGreen,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  chipTextActive: { color: '#fff' },
  chipCount: { fontSize: 11, fontWeight: '800', color: '#9ca3af' },
  chipCountActive: { color: 'rgba(255,255,255,0.8)' },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gearupGreen,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 17,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  submitBtn: {
    backgroundColor: colors.gearupGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagAttached: { backgroundColor: '#dcfce7' },
  tagIndependent: { backgroundColor: '#f3e8ff' },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  tagTextAttached: { color: '#15803d' },
  tagTextIndependent: { color: '#7e22ce' },

  atCampsite: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  atCampsiteName: { fontWeight: '700', color: '#374151' },
  contact: { fontSize: 12, color: '#4b5563', marginTop: 3 },
  description: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 5,
    lineHeight: 16,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 5,
  },

  removeBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },

  footerHint: { marginTop: 16, paddingHorizontal: 4 },
  footerHintText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  footerHintLink: {
    color: colors.gearupGreen,
    fontWeight: '800',
  },
});