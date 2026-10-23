import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { myGear } from '../../../lib/api';
import { imgSrc } from '../../../lib/images';

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

export default function EditMyGearScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tent');
  const [pricePerDay, setPricePerDay] = useState('');
  const [stock, setStock] = useState('1');
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await myGear.get(id);
        const item: GearItem = res.data;
        setName(item.name);
        setDescription(item.description ?? '');
        setCategory(item.category);
        setPricePerDay(String(item.price_per_day));
        setStock(String(item.stock));
        setIsAvailable(item.is_available);
        setImageUri(item.image_url);
        setOriginalImageUrl(item.image_url);
      } catch {
        Alert.alert('Error', 'Could not load gear.');
        router.back();
      }
    })();
  }, [id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload an image.');
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
    if (!name.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: update gear (skip image_url if we're uploading a new one)
      const willUploadNewImage =
        !!imageUri && imageUri !== originalImageUrl;

      const payload: {
        name: string;
        description: string;
        category: string;
        price_per_day: number;
        stock: number;
        is_available: boolean;
        image_url?: string;
      } = {
        name: name.trim(),
        description: description.trim(),
        category,
        price_per_day: Number(pricePerDay) || 0,
        stock: Number(stock) || 1,
        is_available: isAvailable,
        ...(willUploadNewImage ? {} : { image_url: imageUri || '' }),
      };

      await myGear.update(id, payload);

      // Step 2: upload new image if picked
      if (willUploadNewImage && imageUri) {
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
        await myGear.uploadMyGearImage(id, formData);
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
        value={name}
        onChangeText={setName}
        placeholder="e.g. 4-Person Camping Tent"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
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
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Tent"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price per day (₱)</Text>
          <TextInput
            style={styles.input}
            value={pricePerDay}
            onChangeText={setPricePerDay}
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
            value={stock}
            onChangeText={setStock}
            placeholder="1"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Availability</Text>
          <TouchableOpacity
            onPress={() => setIsAvailable(!isAvailable)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, isAvailable && styles.checkboxOn]}>
              {isAvailable && <Ionicons name="checkmark" size={16} color="#fff" />}
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
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
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
            <Text style={styles.submitBtnText}>Save Changes</Text>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
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