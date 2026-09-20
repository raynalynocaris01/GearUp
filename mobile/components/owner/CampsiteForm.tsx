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
import { useRouter } from 'expo-router';
import { owner } from '../../lib/api';
import type { Campsite } from '@gearup/shared';
import { colors } from '../../theme';

interface Props {
  mode: 'create' | 'edit';
  initial?: Campsite;
}

const EMPTY = {
  name: '',
  description: '',
  location: '',
  region: 'Negros Oriental',
  price_per_night: '',
  price_unit: 'night' as 'night' | 'entrance',
  image_url: 'https://picsum.photos/seed/newcampsite/600/400',
  capacity: 4,
};

export function CampsiteForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? EMPTY.name,
    description: initial?.description ?? EMPTY.description,
    location: initial?.location ?? EMPTY.location,
    region: initial?.region ?? EMPTY.region,
    price_per_night: initial?.price_per_night ?? EMPTY.price_per_night,
    price_unit: (initial?.price_unit as 'night' | 'entrance') ?? EMPTY.price_unit,
    image_url: initial?.image_url ?? EMPTY.image_url,
    capacity: initial?.capacity ?? EMPTY.capacity,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.location.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (!form.price_per_night || Number(form.price_per_night) < 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        region: form.region.trim(),
        price_per_night: Number(form.price_per_night),
        price_unit: form.price_unit,
        image_url: form.image_url.trim(),
        capacity: Number(form.capacity),
      };

      if (mode === 'create') {
        await owner.createCampsite(payload);
      } else if (initial) {
        await owner.updateCampsite(initial.id, payload);
      }

      router.replace('/owner/campsites');
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.name?.[0] ??
        data?.errors?.description?.[0] ??
        data?.errors?.location?.[0] ??
        data?.errors?.price_per_night?.[0] ??
        data?.message ??
        err.message ??
        'Could not save campsite.';
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
        <Field label="Campsite name *">
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Grandi Vista Campsite"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Description *">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Tell customers what makes your campsite special…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </Field>

        <Field label="Location *">
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
            placeholder="e.g. Apolong, Valencia"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Region *">
          <TextInput
            style={styles.input}
            value={form.region}
            onChangeText={(v) => setForm((f) => ({ ...f, region: v }))}
            placeholder="e.g. Negros Oriental"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Price (₱) *">
          <TextInput
            style={styles.input}
            value={form.price_per_night}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, price_per_night: v }))
            }
            placeholder="120"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Price unit">
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[
                styles.segment,
                form.price_unit === 'night' && styles.segmentActive,
              ]}
              onPress={() => setForm((f) => ({ ...f, price_unit: 'night' }))}
            >
              <Text
                style={[
                  styles.segmentText,
                  form.price_unit === 'night' && styles.segmentTextActive,
                ]}
              >
                Per night
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                form.price_unit === 'entrance' && styles.segmentActive,
              ]}
              onPress={() => setForm((f) => ({ ...f, price_unit: 'entrance' }))}
            >
              <Text
                style={[
                  styles.segmentText,
                  form.price_unit === 'entrance' && styles.segmentTextActive,
                ]}
              >
                Per entrance
              </Text>
            </TouchableOpacity>
          </View>
        </Field>

        <Field label="Max guests *">
          <TextInput
            style={styles.input}
            value={String(form.capacity)}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, capacity: Number(v) || 1 }))
            }
            placeholder="4"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </Field>

        <Field label="Image URL *">
          <TextInput
            style={styles.input}
            value={form.image_url}
            onChangeText={(v) => setForm((f) => ({ ...f, image_url: v }))}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </Field>

        <TouchableOpacity
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {mode === 'create' ? 'Post Campsite' : 'Save Changes'}
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
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  segmentText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  segmentTextActive: { color: colors.gearupGreen },

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