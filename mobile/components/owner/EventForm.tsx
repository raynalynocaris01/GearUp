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
import type { EventItem } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  mode: 'create' | 'edit';
  initial?: EventItem;
}

const EMPTY = {
  name: '',
  description: '',
  location: '',
  region: 'Negros Oriental',
  starts_at: '',
  ends_at: '',
  price_per_person: '',
  capacity: 20,
  image_url:
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  is_published: true,
};

/**
 * Convert ISO datetime -> datetime-local format (YYYY-MM-DDTHH:mm).
 */
function toDateTimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ mode, initial }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name ?? EMPTY.name,
    description: initial?.description ?? EMPTY.description,
    location: initial?.location ?? EMPTY.location,
    region: initial?.region ?? EMPTY.region,
    starts_at: initial
      ? toDateTimeLocal(initial.starts_at)
      : EMPTY.starts_at,
    ends_at: initial ? toDateTimeLocal(initial.ends_at) : EMPTY.ends_at,
    price_per_person:
      initial?.price_per_person ?? EMPTY.price_per_person,
    capacity: initial?.capacity ?? EMPTY.capacity,
    image_url: initial?.image_url ?? EMPTY.image_url,
    is_published: initial?.is_published ?? EMPTY.is_published,
  });

  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      Alert.alert('Missing fields', 'Name and description are required.');
      return;
    }
    if (!form.location.trim()) {
      Alert.alert('Missing fields', 'Location is required.');
      return;
    }
    if (!form.starts_at || !form.ends_at) {
      Alert.alert('Missing dates', 'Start and end dates are required.');
      return;
    }
    if (form.starts_at >= form.ends_at) {
      Alert.alert('Invalid dates', 'End must be after start.');
      return;
    }
    if (!form.price_per_person || Number(form.price_per_person) < 0) {
      Alert.alert('Invalid price', 'Enter a valid price per person.');
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
        location: form.location.trim(),
        region: form.region.trim(),
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        price_per_person: Number(form.price_per_person),
        capacity: Number(form.capacity),
        image_url: form.image_url.trim(),
        is_published: form.is_published,
      };

      if (mode === 'create') {
        await owner.createEvent(payload);
      } else if (initial) {
        await owner.updateEvent(initial.id, payload);
      }

      router.replace('/owner/events');
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.name?.[0] ??
        data?.errors?.description?.[0] ??
        data?.errors?.location?.[0] ??
        data?.errors?.starts_at?.[0] ??
        data?.errors?.ends_at?.[0] ??
        data?.errors?.price_per_person?.[0] ??
        data?.errors?.capacity?.[0] ??
        data?.errors?.image_url?.[0] ??
        data?.message ??
        err.message ??
        'Could not save event.';
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
        <Field label="Event name *">
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => update('name', v)}
            placeholder="e.g. Summer Camp Feast 2026"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Description *">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={(v) => update('description', v)}
            placeholder="What's the event about?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </Field>

        <Field label="Location *">
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(v) => update('location', v)}
            placeholder="e.g. Apolong, Valencia"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Region">
          <TextInput
            style={styles.input}
            value={form.region}
            onChangeText={(v) => update('region', v)}
            placeholder="e.g. Negros Oriental"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Starts at * (YYYY-MM-DDTHH:mm)">
          <TextInput
            style={styles.input}
            value={form.starts_at}
            onChangeText={(v) => update('starts_at', v)}
            placeholder="2026-12-01T09:00"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Ends at * (YYYY-MM-DDTHH:mm)">
          <TextInput
            style={styles.input}
            value={form.ends_at}
            onChangeText={(v) => update('ends_at', v)}
            placeholder="2026-12-03T17:00"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Price per person (PHP) *">
          <TextInput
            style={styles.input}
            value={form.price_per_person}
            onChangeText={(v) => update('price_per_person', v)}
            placeholder="250"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Capacity *">
          <TextInput
            style={styles.input}
            value={String(form.capacity)}
            onChangeText={(v) =>
              update('capacity', Number(v) || 0)
            }
            placeholder="20"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Image URL *">
          <TextInput
            style={styles.input}
            value={form.image_url}
            onChangeText={(v) => update('image_url', v)}
            placeholder="https://example.com/event.jpg"
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

        <Field label="Visibility">
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() =>
              update('is_published', !form.is_published)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.toggleLabel}>
              Publish this event
            </Text>
            <View
              style={[
                styles.toggleTrack,
                form.is_published && styles.toggleTrackOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  form.is_published && styles.toggleThumbOn,
                ]}
              />
            </View>
          </TouchableOpacity>
        </Field>

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
              {mode === 'create' ? 'Create Event' : 'Save Changes'}
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
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
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
  toggleLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
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