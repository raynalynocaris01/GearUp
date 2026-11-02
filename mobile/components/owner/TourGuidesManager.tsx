import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { owner } from '../../lib/api';

interface TourGuide {
  id: number;
  name: string;
  contact_number: string;
  email: string | null;
  description: string | null;
  price_per_trip?: string;
  is_independent?: boolean;
}

interface Props {
  campsiteId: number;
  initialGuides: TourGuide[];
  onRefresh?: () => void;
}

export function TourGuidesManager({ campsiteId, initialGuides, onRefresh }: Props) {
  const [guides, setGuides] = useState(initialGuides);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    contact_number: '',
    price_per_trip: '',
    email: '',
    description: '',
  });

  const [myGuides, setMyGuides] = useState<TourGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [resumeFile, setResumeFile] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);

  useEffect(() => {
    if (!adding) {
      setSelectedGuideId(null);
      return;
    }
    let cancelled = false;
    owner.listAllMyGuides()
      .then((res) => {
        if (cancelled) return;
        const all = res.data || [];
        const available = all.filter(
          (g: any) => !g.campsite_id || g.campsite_id !== campsiteId,
        );
        setMyGuides(available);
      })
      .catch(() => {
        if (!cancelled) setMyGuides([]);
      });
    return () => { cancelled = true; };
  }, [adding, campsiteId]);

  const handleSelectGuide = (g: TourGuide) => {
    setSelectedGuideId(g.id);
    setForm({
      name: g.name,
      contact_number: g.contact_number,
      price_per_trip: g.price_per_trip ? String(g.price_per_trip) : '',
      email: g.email ?? '',
      description: g.description ?? '',
    });
  };

  const resetForm = () => {
    setForm({
      name: '',
      contact_number: '',
      price_per_trip: '',
      email: '',
      description: '',
    });
    setSelectedGuideId(null);
    setResumeFile(null);
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      const asset = result.assets[0];
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Resume must be 5 MB or smaller.');
        return;
      }
      setResumeFile({
        uri: asset.uri,
        name: asset.name ?? 'resume.pdf',
        size: asset.size ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Could not open the document picker.');
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.contact_number.trim() || !form.price_per_trip.trim()) {
      Alert.alert(
        'Missing fields',
        'Name, contact number, and price per trip are required.'
      );
      return;
    }
    if (!form.email.trim()) {
      Alert.alert('Missing email', 'Email is required.');
      return;
    }

    setLoading(true);
    // If a chip is selected, attach by ID (no new account created)
    if (selectedGuideId !== null) {
      setLoading(true);
      try {
        const attachRes = await owner.attachGuide(campsiteId, selectedGuideId);
        const attachedGuide = attachRes.data.guide ?? attachRes.data;
        setGuides((prev) => {
          const exists = prev.some((g) => g.id === attachedGuide.id);
          return exists
            ? prev.map((g) => (g.id === attachedGuide.id ? attachedGuide : g))
            : [...prev, attachedGuide];
        });
        resetForm();
        setAdding(false);
        if (onRefresh) onRefresh();
        return;
      } catch (err: any) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || 'Could not attach guide.',
        );
        return;
      } finally {
        setLoading(false);
      }
    }


    try {
      if (!resumeFile) {
        Alert.alert(
          'Resume required',
          'Please attach a PDF resume to create this guide.',
        );
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('contact_number', form.contact_number.trim());
      fd.append(
        'price_per_trip',
        form.price_per_trip ? String(Number(form.price_per_trip)) : '0',
      );
      fd.append('email', form.email.trim());
      if (form.description.trim()) {
        fd.append('description', form.description.trim());
      }
      fd.append('resume', {
        uri: resumeFile.uri,
        name: resumeFile.name,
        type: 'application/pdf',
      } as any);

      const res = await owner.createTourGuide(campsiteId, fd);

      const savedGuide = res.data.guide ?? res.data;
      setGuides((prev) => { const exists = prev.some((g) => g.id === savedGuide.id); return exists ? prev.map((g) => g.id === savedGuide.id ? savedGuide : g) : [...prev, savedGuide]; });
      if (res.data.temp_password) setTempPassword(res.data.temp_password);

      resetForm();
      setAdding(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not create guide.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Remove this tour guide?',
      `Remove ${name}? They will no longer appear on this campsite.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await owner.deleteTourGuide(id);
              setGuides((prev) => prev.filter((g) => g.id !== id));
              if (onRefresh) onRefresh();
            } catch {
              Alert.alert('Error', 'Could not delete tour guide.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {tempPassword && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Tour guide created</Text>
          <Text style={styles.successText}>
            Share this temp password with the guide so they can log in:
          </Text>
          <View style={styles.passwordBox}>
            <Text style={styles.passwordText}>{tempPassword}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setTempPassword(null)}
            style={styles.dismissBtn}
          >
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.list}>
        {guides.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No tour guides yet. Add one below so customers know who can guide their trip.
            </Text>
          </View>
        ) : (
          guides.map((g) => (
            <View key={g.id} style={styles.guideCard}>
              <View style={styles.guideInfo}>
                <Text style={styles.guideName}>{g.name}</Text>
                <Text style={styles.guideContact}>{g.contact_number}</Text>
                {g.email && <Text style={styles.guideEmail}>{g.email}</Text>}
                {g.price_per_trip && Number(g.price_per_trip) > 0 && (
                  <Text style={styles.guidePrice}>
                    PHP {Number(g.price_per_trip).toFixed(0)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(g.id, g.name)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {adding ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add a tour guide</Text>

          {myGuides.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.chipLabel}>
                Select an existing guide (optional)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {myGuides.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => handleSelectGuide(g)}
                    style={[
                      styles.chip,
                      selectedGuideId === g.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedGuideId === g.id && styles.chipTextActive,
                      ]}
                    >
                      {g.name}
                      {g.is_independent ? ' (Independent)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedGuideId === null && (
            <>
              <Text style={styles.label}>Full name *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Juan Dela Cruz"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Contact number *</Text>
              <TextInput
                style={styles.input}
                value={form.contact_number}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, contact_number: v }))
                }
                placeholder="e.g. 0917-123-4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Price per trip (PHP) *</Text>
              <TextInput
                style={styles.input}
                value={form.price_per_trip}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, price_per_trip: v }))
                }
                placeholder="e.g. 1800"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="juan@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.description}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, description: v }))
                }
                placeholder="Experience, specialties..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Resume (PDF) *</Text>
              <TouchableOpacity
                style={styles.resumePicker}
                onPress={pickResume}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document-outline"
                  size={18}
                  color="#15803d"
                />
                <Text style={styles.resumePickerText}>
                  {resumeFile ? 'Change PDF file' : 'Choose PDF file'}
                </Text>
              </TouchableOpacity>
              {resumeFile ? (
                <Text style={styles.resumeHint}>
                  Selected: {resumeFile.name}
                  {resumeFile.size
                    ? ` (${Math.round(resumeFile.size / 1024)} KB)`
                    : ''}
                </Text>
              ) : (
                <Text style={styles.resumeHint}>
                  Required — the admin reviews this before the guide goes live.
                </Text>
              )}
            </>
          )}

          {selectedGuideId !== null && (
            <View style={styles.attachNote}>
              <Text style={styles.attachNoteText}>
                You&apos;re attaching an existing guide — no need to re-enter
                their info or upload a resume. The guide is already approved.
              </Text>
            </View>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={() => {
                setAdding(false);
                resetForm();
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Add tour guide</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={20} color="#15803d" />
          <Text style={styles.addBtnText}>Add a tour guide</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  list: { gap: 12, marginBottom: 16 },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  guideInfo: { flex: 1 },
  guideName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  guideContact: { fontSize: 13, color: '#4b5563', marginBottom: 2 },
  guideEmail: { fontSize: 13, color: '#4b5563', marginBottom: 2 },
  guidePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 6,
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 20,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#15803d' },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: { color: '#fff' },
  resumePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  resumePickerText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  resumeHint: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 15,
  },
  attachNote: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  attachNoteText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 17,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  successCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 12,
  },
  passwordBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 8,
    padding: 12,
  },
  passwordText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 1,
  },
  dismissBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#a7f3d0',
    borderRadius: 6,
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
});
