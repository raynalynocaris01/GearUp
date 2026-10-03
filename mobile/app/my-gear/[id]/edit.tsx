import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { myGear } from '../../../lib/api';
import type { GearItem } from '@gearup/shared';
import { colors } from '../../../theme';

export default function EditMyGearScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<GearItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const res = await myGear.get(id);
      const it = res.data;
      setItem(it);
      setName(it.name);
      setDescription(it.description ?? '');
      setCategory(it.category);
      setPricePerDay(String(it.price_per_day));
      setImageUrl(it.image_url ?? '');
      setStock(String(it.stock));
      setIsAvailable(it.is_available);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id]),
  );

  const submit = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await myGear.update(item.id, {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price_per_day: Number(pricePerDay),
        image_url: imageUrl.trim(),
        stock: Number(stock),
        is_available: isAvailable,
      });
      router.replace('/my-gear' as any);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ?? 'Could not update gear.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Item not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit gear</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textarea]}
          multiline
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          value={category}
          onChangeText={setCategory}
          style={styles.input}
        />

        <Text style={styles.label}>Price per day (PHP)</Text>
        <TextInput
          value={pricePerDay}
          onChangeText={setPricePerDay}
          style={styles.input}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Stock</Text>
        <TextInput
          value={stock}
          onChangeText={setStock}
          style={styles.input}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          value={imageUrl}
          onChangeText={setImageUrl}
          style={styles.input}
          autoCapitalize="none"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Available for rent</Text>
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{ true: colors.gearupGreen }}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
          onPress={submit}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {saving ? 'Saving...' : 'Save changes'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: 16 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  primaryBtn: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});