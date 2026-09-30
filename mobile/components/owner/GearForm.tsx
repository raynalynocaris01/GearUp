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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { owner } from '../../lib/api';
import type { GearItem } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  mode: 'create' | 'edit';
  initial?: GearItem;
}

const CATEGORIES = [
  'Tent',
  'Sleeping',
  'Sleeping Bag',
  'Backpack',
  'Cooking',
  'Lighting',
  'Furniture',
  'Other',
];

const EMPTY = {
  name: '',
  description: '',
  category: 'Tent',
  price_per_day: '',
  image_url: 'https://picsum.photos/seed/newgear/600/400',
  stock: 1,
  is_available: true,
};

export function GearForm({ mode, initial }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name ?? EMPTY.name,
    description: initial?.description ?? EMPTY.description,
    category: initial?.category ?? EMPTY.category,
    price_per_day: initial?.price_per_day ?? EMPTY.price_per_day,
    image_url: initial?.image_url ?? EMPTY.image_url,
    stock: initial?.stock ?? EMPTY.stock,
    is_available: initial?.is_available ?? EMPTY.is_available,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('Missing fields', 'Name and description are required.');
      return;
    }
    if (!form.price_per_day || Number(form.price_per_day) < 0) {
      Alert.alert('Invalid price', 'Please enter a valid price per day.');
      return;
    }
    if (!form.image_url.trim()) {
      Alert.alert('Missing image', 'Image URL is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price_per_day: Number(form.price_per_day),
        image_url: form.image_url.trim(),
        stock: Number(form.stock),
        is_available: form.is_available,
      };

      if (mode === 'create') {
        await owner.createGear(payload);
      } else if (initial) {
        await owner.updateGear(initial.id, payload);
      }

      router.replace('/owner/gear');
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.name?.[0] ??
        data?.errors?.description?.[0] ??
        data?.errors?.category?.[0] ??
        data?.errors?.price_per_day?.[0] ??
        data?.errors?.image_url?.[0] ??
        data?.errors?.stock?.[0] ??
        data?.message ??
        err.message ??
        'Could not save gear item.';
      Alert.alert('Save failed', message);
    } finally {
      setSubmitting(false);
    }
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
        <Field label="Gear name *">
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. 4-Person Camping Tent"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Description *">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, description: v }))
            }
            placeholder="Describe the gear, condition, what's included..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </Field>

        <Field label="Category">
          <View style={styles.chipGrid}>
            {CATEGORIES.map((c) => {
              const active = form.category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, category: c }))}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <Field label="Price per day (₱) *">
          <TextInput
            style={styles.input}
            value={form.price_per_day}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, price_per_day: v }))
            }
            placeholder="150"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Stock (units available) *">
          <TextInput
            style={styles.input}
            value={String(form.stock)}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, stock: Number(v) || 0 }))
            }
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Availability">
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() =>
              setForm((f) => ({ ...f, is_available: !f.is_available }))
            }
            activeOpacity={0.85}
          >
            <Text style={styles.toggleLabel}>Available for rent</Text>
            <View
              style={[
                styles.toggleTrack,
                form.is_available && styles.toggleTrackOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  form.is_available && styles.toggleThumbOn,
                ]}
              />
            </View>
          </TouchableOpacity>
        </Field>

        <Field label="Image URL *">
          <TextInput
            style={styles.input}
            value={form.image_url}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, image_url: v }))
            }
            placeholder="https://example.com/photo.jpg"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        {form.image_url.trim().length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Preview</Text>
            <Image
              source={{ uri: form.image_url }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'create' ? 'Add Gear Item' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
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
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: colors.gearupGreen,
    fontWeight: '800',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  toggleLabel: { fontSize: 14, color: '#111827', fontWeight: '600' },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: colors.gearupGreen },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },

  submit: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});