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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { myGear } from '../../lib/api';
import { imgSrc } from '../../lib/images';

export default function NewMyGearScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tent');
  const [pricePerDay, setPricePerDay] = useState('');
  const [stock, setStock] = useState('1');
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pickup fields
  const [pickupMethod, setPickupMethod] = useState<
    'meetup' | 'pickup' | 'deliver' | 'all'
  >('meetup');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [pickupHours, setPickupHours] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      const res = await myGear.create({
        name: name.trim(),
        description: description.trim(),
        category,
        price_per_day: Number(pricePerDay) || 0,
        stock: Number(stock) || 1,
        is_available: isAvailable,
        image_url: '',
        pickup_method: pickupMethod,
        pickup_address: pickupAddress.trim() || null,
        pickup_landmark: pickupLandmark.trim() || null,
        pickup_hours: pickupHours.trim() || null,
        pickup_instructions: pickupInstructions.trim() || null,
        contact_number: contactNumber.trim() || null,
      });
      const gearId = res.data.id;

      if (imageUri && gearId) {
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
        await myGear.uploadMyGearImage(gearId, formData);
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Gear</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
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

        <View style={styles.pickupSection}>
          <Text style={styles.pickupHeading}>Pickup Information</Text>
          <Text style={styles.pickupHelp}>
            Tell renters how they'll get the gear. Shown after a booking is confirmed.
          </Text>

          <Text style={styles.label}>How should renters get the gear?</Text>
          <View style={styles.pickupRadioGroup}>
            {(
              [
                { value: 'meetup', label: 'Meet-up at a place' },
                { value: 'pickup', label: 'Pick up at my place' },
                { value: 'deliver', label: 'Deliver to them' },
                { value: 'all', label: 'All three options' },
              ] as const
            ).map((opt) => {
              const active = pickupMethod === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPickupMethod(opt.value)}
                  style={[
                    styles.pickupRadio,
                    active && styles.pickupRadioActive,
                  ]}
                >
                  <View style={[styles.radioDot, active && styles.radioDotActive]}>
                    {active && <View style={styles.radioDotInner} />}
                  </View>
                  <Text
                    style={[
                      styles.pickupRadioLabel,
                      active && styles.pickupRadioLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>
            {pickupMethod === 'meetup' ? 'Meet-up location' : 'Pickup address'}
            {['pickup', 'all'].includes(pickupMethod) ? ' *' : ''}
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="e.g. Purok 3, Brgy. San Jose, Valencia City, Bukidnon"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={2}
          />

          {['meetup', 'all'].includes(pickupMethod) && (
            <>
              <Text style={styles.label}>Landmark (optional but helpful)</Text>
              <TextInput
                style={styles.input}
                value={pickupLandmark}
                onChangeText={setPickupLandmark}
                placeholder="e.g. Near the barangay hall, blue gate"
                placeholderTextColor="#9ca3af"
              />
            </>
          )}

          <Text style={styles.label}>Pickup hours (optional)</Text>
          <TextInput
            style={styles.input}
            value={pickupHours}
            onChangeText={setPickupHours}
            placeholder="e.g. Mon–Sat 9AM–6PM, Sun by appointment"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Instructions (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={pickupInstructions}
            onChangeText={setPickupInstructions}
            placeholder="e.g. Text me 30 minutes before arriving."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Contact number (optional)</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="e.g. 0917 123 4567"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
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
              <Text style={styles.submitBtnText}>Add Gear</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4, width: 32 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: { width: 32 },
  scroll: { flex: 1 },
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
  pickupSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pickupHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  pickupHelp: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 17,
  },
  pickupRadioGroup: {
    gap: 8,
    marginBottom: 4,
  },
  pickupRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  pickupRadioActive: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  pickupRadioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  pickupRadioLabelActive: {
    color: '#14532d',
    fontWeight: '700',
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  radioDotActive: {
    borderColor: '#15803d',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803d',
  },
});