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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
    price_unit:
      (initial?.price_unit as 'night' | 'entrance') ?? EMPTY.price_unit,
    image_url: initial?.image_url ?? EMPTY.image_url,
    capacity: initial?.capacity ?? EMPTY.capacity,
  });

  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(
    initial?.image_url ?? null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo access to upload an image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 10],
    quality: 0.8,
  });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

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
        image_url: form.image_url,
        capacity: Number(form.capacity),
      };

      let campsiteId = initial?.id;

      // 1. Save campsite
      if (mode === 'create') {
        const res = await owner.createCampsite(payload);
        campsiteId = res.data.id;
      } else if (initial) {
        await owner.updateCampsite(initial.id, payload);
      }

      // 2. Upload image if the user picked a new one
      if (imageUri && campsiteId && imageUri !== initial?.image_url) {
        setUploadingImage(true);

        const formData = new FormData();
        const filename = imageUri.split('/').pop() ?? 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);

        await owner.uploadCampsiteImage(campsiteId, formData);
        setUploadingImage(false);
      }

      router.replace('/owner/campsites');
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.image?.[0] ??
        data?.errors?.name?.[0] ??
        data?.errors?.location?.[0] ??
        data?.errors?.price_per_night?.[0] ??
        data?.message ??
        err.message ??
        'Could not save campsite.';
      Alert.alert('Save failed', message);
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
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

        <Field label="Campsite photo">
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera-outline"
              size={22}
              color={colors.gearupGreen}
            />
            <Text style={styles.imagePickerText}>
              {imageUri ? 'Replace photo' : 'Upload photo'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.imagePickerHint}>
            JPG, PNG, or WebP. Max 2 MB.
          </Text>
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
              {uploadingImage
                ? 'Uploading photo…'
                : mode === 'create'
                  ? 'Post Campsite'
                  : 'Save Changes'}
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

  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#e5e7eb',
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
  imagePickerHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
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