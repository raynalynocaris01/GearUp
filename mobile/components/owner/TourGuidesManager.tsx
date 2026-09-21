import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import type { TourGuide } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  campsiteId: number;
  initialGuides: TourGuide[];
}

export function TourGuidesManager({ campsiteId, initialGuides }: Props) {
  const [guides, setGuides] = useState<TourGuide[]>(initialGuides);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
  name: '',
  contact_number: '',
  price_per_trip: '',
  email: '',
  description: '',
});

  const resetForm = () =>
    setForm({
      name: '',
      contact_number: '',
      price_per_trip: '',
      email: '',
      description: '',
    });

  const handleAdd = async () => {
    if (
  !form.name.trim() ||
  !form.contact_number.trim() ||
  !form.price_per_trip.trim()
  ) {
    Alert.alert(
      'Missing fields',
      'Name, contact number, and price per trip are required.'
    );
    return;
  }
    setSubmitting(true);
    try {
      const res = await owner.createTourGuide(campsiteId, {
        name: form.name.trim(),
        contact_number: form.contact_number.trim(),
        price_per_trip: Number(form.price_per_trip),
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setGuides((prev) => [...prev, res.data]);
      resetForm();
      setAdding(false);
    } catch (err: any) {
      Alert.alert(
        'Could not add',
        err.response?.data?.message ?? err.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (guide: TourGuide) => {
    Alert.alert(
      'Remove tour guide?',
      `${guide.name} will no longer appear on this campsite.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(guide.id);
            try {
              await owner.deleteTourGuide(guide.id);
              setGuides((prev) => prev.filter((g) => g.id !== guide.id));
            } catch {
              Alert.alert('Could not remove', 'Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {guides.length === 0 && !adding && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧭</Text>
            <Text style={styles.emptyTitle}>No tour guides yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a local guide so customers know who can guide their trip.
            </Text>
          </View>
        )}

        {guides.map((g) => (
          <View key={g.id} style={styles.guideCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideName}>{g.name}</Text>
              <Text style={styles.guideMeta}>📞 {g.contact_number}</Text>
              {g.email && (
                <Text style={styles.guideMeta}>✉️ {g.email}</Text>
              )}
              {g.description && (
                <Text style={styles.guideDesc}>{g.description}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(g)}
              disabled={deletingId === g.id}
            >
              {deletingId === g.id ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              )}
            </TouchableOpacity>
          </View>
        ))}

        {adding ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a tour guide</Text>

            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Full name *"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={form.contact_number}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, contact_number: v }))
              }
              placeholder="Contact number *"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
           

              <TextInput
                style={styles.input}
                placeholder="e.g. 1500"
                keyboardType="numeric"
                value={form.price_per_trip}
                onChangeText={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    price_per_trip: value,
                  }))
                }
              />
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="Email (optional)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={(v) =>
                setForm((f) => ({ ...f, description: v }))
              }
              placeholder="Description (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setAdding(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitDisabled]}
                onPress={handleAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Add guide</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAdding(true)}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.gearupGreen} />
            <Text style={styles.addButtonText}>Add a tour guide</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  guideCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  guideName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  guideMeta: { fontSize: 13, color: '#4b5563', marginTop: 3 },
  guideDesc: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  removeButton: { padding: 6 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gearupGreen,
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.gearupGreen,
  },
  submitDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});