import { useEffect, useState } from 'react';
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
import type { Campsite, CreateCampsitePayload } from '@gearup/shared';
import { colors } from '../../theme';
import { PricingLinesEditor } from './PricingLinesEditor';

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
  is_available: true,
  pricing_mode: 'simple' as 'simple' | 'detailed',
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
    is_available: initial?.is_available ?? EMPTY.is_available,
    pricing_mode:
      (initial?.pricing_mode as 'simple' | 'detailed') ?? EMPTY.pricing_mode,
  });

  // Expo Router reuses the same mounted component when navigating between
  // /owner/campsites/{id}/edit pages with different IDs (e.g., parent → room).
  // useState keeps the first initial forever, so reset the form when the
  // underlying campsite ID changes.
  useEffect(() => {
    if (!initial) return;
    setForm({
      name: initial.name ?? EMPTY.name,
      description: initial.description ?? EMPTY.description,
      location: initial.location ?? EMPTY.location,
      region: initial.region ?? EMPTY.region,
      price_per_night: initial.price_per_night ?? EMPTY.price_per_night,
      price_unit:
        (initial.price_unit as 'night' | 'entrance') ?? EMPTY.price_unit,
      image_url: initial.image_url ?? EMPTY.image_url,
      capacity: initial.capacity ?? EMPTY.capacity,
      is_available: initial.is_available ?? EMPTY.is_available,
      pricing_mode:
        (initial.pricing_mode as 'simple' | 'detailed') ?? EMPTY.pricing_mode,
    });
  }, [initial?.id]);

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
      // Build the payload with only the fields we know we have.
      // image_url is intentionally omitted when a new file is picked —
      // the upload step sets it server-side.
      const willUploadNewImage =
        !!imageUri && imageUri !== initial?.image_url;

      const payload: {
        name: string;
        description: string;
        location: string;
        region: string;
        price_per_night?: number;
        price_unit: 'night' | 'entrance';
        capacity: number;
        is_available: boolean;
        pricing_mode: 'simple' | 'detailed';
        image_url?: string;
      } = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        region: form.region.trim(),
        price_unit: form.price_unit,
        capacity: Number(form.capacity),
        is_available: form.is_available,
        pricing_mode: form.pricing_mode,
        ...(willUploadNewImage ? {} : { image_url: form.image_url }),
      };
      // Only send price_per_night in simple mode. In detailed mode it is
      // unused and sending 0 would overwrite the preserved simple-mode value.
      if (form.pricing_mode === 'simple') {
        payload.price_per_night = Number(form.price_per_night);
      }

      let campsiteId = initial?.id;

      // 1. Save campsite
      if (mode === 'create') {
        // Create mode is always simple (the Detailed radio is disabled in
        // this mode), so price_per_night is guaranteed to be set.
        const res = await owner.createCampsite(
          payload as CreateCampsitePayload,
        );
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

        {mode === 'edit' && initial?.id && !initial?.parent_campsite_id && (
          <RoomVariantsSection
            campsiteId={initial.id}
            initialRooms={(initial.children ?? []) as RoomVariant[]}
            parentImageUrl={initial.image_url}
            parentRegion={initial.region}
          />
        )}

        <Field label="Pricing mode">
          <View style={styles.segmentRow}>
            <TouchableOpacity
              style={[
                styles.segment,
                (form.pricing_mode ?? 'simple') === 'simple' &&
                  styles.segmentActive,
              ]}
              onPress={() =>
                setForm((f) => ({ ...f, pricing_mode: 'simple' }))
              }
            >
              <Text
                style={[
                  styles.segmentText,
                  (form.pricing_mode ?? 'simple') === 'simple' &&
                    styles.segmentTextActive,
                ]}
              >
                Simple
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                form.pricing_mode === 'detailed' && styles.segmentActive,
                mode === 'create' && styles.segmentDisabled,
              ]}
              onPress={() =>
                setForm((f) => ({ ...f, pricing_mode: 'detailed' }))
              }
              disabled={mode === 'create'}
            >
              <Text
                style={[
                  styles.segmentText,
                  form.pricing_mode === 'detailed' &&
                    styles.segmentTextActive,
                  mode === 'create' && styles.segmentTextDisabled,
                ]}
              >
                Detailed
              </Text>
            </TouchableOpacity>
          </View>
          {mode === 'create' && (
            <Text style={styles.hint}>
              Save the campsite first, then switch to Detailed to add
              pricing lines.
            </Text>
          )}
        </Field>

        {form.pricing_mode === 'simple' && (
          <>
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
                  onPress={() =>
                    setForm((f) => ({ ...f, price_unit: 'night' }))
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      form.price_unit === 'night' &&
                        styles.segmentTextActive,
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
                  onPress={() =>
                    setForm((f) => ({ ...f, price_unit: 'entrance' }))
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      form.price_unit === 'entrance' &&
                        styles.segmentTextActive,
                    ]}
                  >
                    Per entrance
                  </Text>
                </TouchableOpacity>
              </View>
            </Field>
          </>
        )}

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

        {/* Availability toggle */}
        <View style={styles.availabilityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.availabilityTitle}>
              Accepting bookings
            </Text>
            <Text style={styles.availabilityHint}>
              When off, customers can still see this campsite but cannot place
              new bookings. Existing bookings are not affected.
            </Text>
            <View
              style={[
                styles.availabilityBadge,
                form.is_available
                  ? styles.availabilityBadgeOpen
                  : styles.availabilityBadgeClosed,
              ]}
            >
              <Text
                style={[
                  styles.availabilityBadgeText,
                  form.is_available
                    ? styles.availabilityBadgeTextOpen
                    : styles.availabilityBadgeTextClosed,
                ]}
              >
                {form.is_available ? 'BOOKINGS OPEN' : 'TEMPORARILY CLOSED'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              setForm((f) => ({ ...f, is_available: !f.is_available }))
            }
            style={[
              styles.toggleTrack,
              form.is_available
                ? styles.toggleTrackOn
                : styles.toggleTrackOff,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                form.is_available
                  ? styles.toggleThumbOn
                  : styles.toggleThumbOff,
              ]}
            />
          </TouchableOpacity>
        </View>

        {form.pricing_mode === 'detailed' &&
          mode === 'edit' &&
          initial?.id && (
            <View style={styles.pricingEditorWrap}>
              <PricingLinesEditor campsiteId={initial.id} />
            </View>
          )}

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

interface RoomVariant {
  id: number;
  name: string;
  description: string | null;
  price_per_night: string;
  price_unit: string;
  capacity: number;
  is_available: boolean;
}

interface RoomVariantsProps {
  campsiteId: number;
  initialRooms: RoomVariant[];
  parentImageUrl: string;
  parentRegion: string;
}

function RoomVariantsSection({
  campsiteId,
  initialRooms,
  parentImageUrl,
  parentRegion,
}: RoomVariantsProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomVariant[]>(initialRooms);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setPrice('');
    setCapacity('2');
    setDescription('');
    setError('');
  };

  const handleAdd = async () => {
    setError('');
    if (!name.trim() || !price) {
      setError('Name and price are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        parent_campsite_id: campsiteId,
        name: name.trim(),
        description: description.trim() || 'Room variant',
        location: 'Same as parent',
        region: parentRegion,
        price_per_night: Number(price),
        price_unit: 'night' as const,
        image_url: parentImageUrl,
        capacity: Number(capacity) || 1,
        is_available: true,
        pricing_mode: 'simple' as const,
      };
      
      const res = await owner.createCampsite(payload as any);
      
      // Add the new room to the local state instantly
      setRooms((prev) => [...prev, res.data]);
      resetForm();
      setAdding(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Could not create room.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (room: RoomVariant) => {
    Alert.alert(
      'Delete room?',
      `Delete "${room.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await owner.deleteCampsite(room.id);
              // Remove the room from the local state instantly
              setRooms((prev) => prev.filter((r) => r.id !== room.id));
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ??
                err?.message ??
                'Could not delete room.';
              Alert.alert('Delete failed', msg);
            }
          },
        },
      ],
    );
  };

  return (
    <Field label="Room Variants">
      <Text style={styles.roomVariantsHint}>
        Add bookable rooms or sub-listings under this campsite. Each room has
        its own price and capacity.
      </Text>

      {rooms.length === 0 ? (
        <View style={styles.roomEmptyBox}>
          <Text style={styles.roomEmptyText}>No rooms yet.</Text>
        </View>
      ) : (
        <View style={styles.roomListBox}>
          {rooms.map((room, idx) => (
            <View
              key={room.id}
              style={[
                styles.roomRow,
                idx < rooms.length - 1 && styles.roomRowDivider,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomMeta}>
                  PHP {parseFloat(room.price_per_night).toFixed(2)} /{' '}
                  {room.price_unit} - Up to {room.capacity}{' '}
                  {room.capacity === 1 ? 'guest' : 'guests'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/owner/campsites/${room.id}/edit` as any)
                }
                style={styles.roomEditBtn}
              >
                <Text style={styles.roomEditText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(room)}
                style={styles.roomDeleteBtn}
              >
                <Text style={styles.roomDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {adding ? (
        <View style={styles.roomAddForm}>
          <View style={styles.roomFieldGroup}>
            <Text style={styles.roomFieldLabel}>Room name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Native Room"
              placeholderTextColor={colors.textMuted}
              style={styles.roomInput}
            />
          </View>
          <View style={styles.roomFieldGroup}>
            <Text style={styles.roomFieldLabel}>Price per night (PHP) *</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="800"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.roomInput}
            />
          </View>
          <View style={styles.roomFieldGroup}>
            <Text style={styles.roomFieldLabel}>Max guests *</Text>
            <TextInput
              value={capacity}
              onChangeText={setCapacity}
              placeholder="2"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.roomInput}
            />
          </View>
          <View style={styles.roomFieldGroup}>
            <Text style={styles.roomFieldLabel}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Simple native room"
              placeholderTextColor={colors.textMuted}
              style={styles.roomInput}
            />
          </View>

          {error ? <Text style={styles.roomError}>{error}</Text> : null}

          <View style={styles.roomFormActions}>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setAdding(false);
              }}
              disabled={submitting}
              style={[styles.roomFormBtn, styles.roomCancelBtn]}
            >
              <Text style={styles.roomCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={submitting}
              style={[styles.roomFormBtn, styles.roomSaveBtn]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.roomSaveText}>Save Room</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          style={styles.roomAddBtn}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.roomAddBtnText}>Add Room</Text>
        </TouchableOpacity>
      )}
    </Field>
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
  segmentDisabled: { opacity: 0.5 },
  segmentTextDisabled: { color: colors.textMuted },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },

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

  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  availabilityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  availabilityHint: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availabilityBadgeOpen: {
    backgroundColor: '#dcfce7',
  },
  availabilityBadgeClosed: {
    backgroundColor: '#fef3c7',
  },
  availabilityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  availabilityBadgeTextOpen: {
    color: '#15803d',
  },
  availabilityBadgeTextClosed: {
    color: '#92400e',
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    marginTop: 2,
  },
  toggleTrackOn: {
    backgroundColor: colors.gearupGreen,
    alignItems: 'flex-end',
  },
  toggleTrackOff: {
    backgroundColor: '#d1d5db',
    alignItems: 'flex-start',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbOn: {},
  toggleThumbOff: {},

  submit: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  pricingEditorWrap: {
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Room Variants
  roomVariantsHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  roomEmptyBox: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  roomEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  roomListBox: {
    backgroundColor: colors.white,
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  roomRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  roomMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  roomEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gearupGreen,
  },
  roomDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roomDeleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.red,
  },
  roomAddForm: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  roomFieldGroup: {
    gap: 4,
  },
  roomFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  roomInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  roomError: {
    fontSize: 12,
    color: colors.red,
  },
  roomFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  roomFormBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCancelBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomCancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  roomSaveBtn: {
    backgroundColor: colors.gearupGreen,
  },
  roomSaveText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  roomAddBtn: {
    backgroundColor: colors.gearupGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  roomAddBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});