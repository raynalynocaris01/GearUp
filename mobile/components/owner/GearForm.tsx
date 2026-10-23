import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { owner } from '../../lib/api';
import { imgSrc } from '../../lib/images';

interface GearItem {
  id?: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: GearItem;
}

const EMPTY: GearItem = {
  name: '',
  description: '',
  category: 'Tent',
  price_per_day: '',
  image_url: '',
  stock: 1,
  is_available: true,
};

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

export function GearForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<GearItem>(initial ?? EMPTY);
  const [submitting, setSubmitting] = useState(false);

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(
    initial?.image_url ?? null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const update = <K extends keyof GearItem>(
    key: K,
    value: GearItem[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

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
    if (!form.name.trim() || !(form.description ?? '').trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const willUploadNewImage =
        !!imageUri && imageUri !== initial?.image_url;

      const payload: {
        name: string;
        description: string;
        category: string;
        price_per_day: number;
        image_url?: string;
        stock: number;
        is_available: boolean;
      } = {
        name: form.name.trim(),
        description: (form.description ?? '').trim(),
        category: form.category,
        price_per_day: Number(form.price_per_day) || 0,
        stock: Number(form.stock) || 1,
        is_available: form.is_available,
        ...(willUploadNewImage ? {} : { image_url: form.image_url || '' }),
      };

      let gearId = initial?.id;

      // 1. Save gear
      if (mode === 'create') {
        const res = await owner.createGear(payload as any);
        gearId = res.data.id;
      } else if (initial && initial.id) {
        await owner.updateGear(initial.id, payload);
      }

      // 2. Upload image if user picked a new one
      if (imageUri && gearId && imageUri !== initial?.image_url) {
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

        await owner.uploadGearImage(gearId, formData);
        setUploadingImage(false);
      }

      router.back();
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        data?.errors?.image?.[0] ??
        data?.errors?.name?.[0] ??
        data?.message ??
        err.message ??
        'Could not save gear.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.label}>Gear name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => update('name', v)}
        placeholder="e.g. 4-Person Camping Tent"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.description ?? ''}
        onChangeText={(v) => update('description', v)}
        placeholder="Describe the gear, condition, what's included..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={form.category}
            onChangeText={(v) => update('category', v)}
            placeholder="e.g. Tent"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price per day (₱)</Text>
          <TextInput
            style={styles.input}
            value={form.price_per_day}
            onChangeText={(v) => update('price_per_day', v)}
            placeholder="150"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Stock (units)</Text>
          <TextInput
            style={styles.input}
            value={String(form.stock)}
            onChangeText={(v) => update('stock', Number(v) || 0)}
            placeholder="1"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Availability</Text>
          <TouchableOpacity
            onPress={() => update('is_available', !form.is_available)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, form.is_available && styles.checkboxOn]}>
              {form.is_available && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Available</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Gear image</Text>
      <TouchableOpacity onPress={pickImage} style={styles.pickBtn}>
        <Ionicons name="image-outline" size={20} color="#15803d" />
        <Text style={styles.pickBtnText}>
          {imageUri ? 'Change image' : 'Pick an image'}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: imgSrc(imageUri) }}
            style={styles.preview}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {mode === 'create' ? 'Add Gear' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#15803d', borderColor: '#15803d' },
  checkboxLabel: { fontSize: 14, color: '#374151' },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: '#f0fdf4',
  },
  pickBtnText: { color: '#15803d', fontWeight: '600', fontSize: 14 },
  previewWrap: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  preview: { width: '100%', height: 200, backgroundColor: '#f3f4f6' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  submitBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
