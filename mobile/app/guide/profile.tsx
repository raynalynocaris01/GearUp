import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { guide as guideApi } from '../../lib/api';
import { colors } from '../../theme';

interface GuideProfile {
  id: number;
  name: string;
  price_per_trip: string;
  location: string | null;
  description: string | null;
  contact_number: string;
  is_independent: boolean;
  campsite_id: number | null;
}

export default function GuideProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await guideApi.profile.get();
        setProfile(res.data);
        setPrice(res.data.price_per_trip);
        setLocation(res.data.location ?? '');
        setContact(res.data.contact_number);
        setDescription(res.data.description ?? '');
      } catch {
        Alert.alert('Error', 'Could not load your guide profile.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!price.trim()) {
      Alert.alert('Invalid price', 'Please enter a valid price per trip.');
      return;
    }
    if (!contact.trim()) {
      Alert.alert('Invalid contact', 'Please enter a contact number.');
      return;
    }

    setSaving(true);
    try {
      await guideApi.profile.update({
        price_per_trip: Number(price),
        location: location.trim() || null,
        contact_number: contact.trim(),
        description: description.trim() || null,
      });
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Could not save profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Guide Profile</Text>
        </View>

        {/* Read-only context */}
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>ACCOUNT</Text>
          <Text style={styles.contextLine}>
            <Text style={styles.contextKey}>Name: </Text>
            {profile.name}
          </Text>
          <Text style={styles.contextLine}>
            <Text style={styles.contextKey}>Type: </Text>
            {profile.is_independent ? 'Independent guide' : 'Attached to a campsite'}
          </Text>
          <Text style={styles.contextHint}>
            Name and account type are managed from your account settings.
          </Text>
        </View>

        {/* Form fields */}
        <Field label="Price per trip (PHP) *">
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="1500"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="Location">
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Valencia, Negros Oriental"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="Contact number *">
          <TextInput
            value={contact}
            onChangeText={setContact}
            placeholder="09171234567"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="Description">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell customers about your guiding experience."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.charCount}>
            {description.length}/2000 characters
          </Text>
        </Field>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', flex: 1 },
  contextCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    marginBottom: 20,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginBottom: 8,
  },
  contextLine: { fontSize: 13, color: '#374151', marginBottom: 4 },
  contextKey: { fontWeight: '700', color: '#111827' },
  contextHint: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});