import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  PricingLine,
  CreatePricingLinePayload,
  UpdatePricingLinePayload,
} from '@gearup/shared';
import { owner } from '../../lib/api';
import { colors } from '../../theme';

type Unit = 'per_person' | 'per_tent' | 'per_night' | 'flat';
type AppliesTo = 'any' | 'adult' | 'child' | 'senior' | 'pwd';

const UNIT_OPTIONS: Unit[] = ['per_person', 'per_tent', 'per_night', 'flat'];
const APPLIES_OPTIONS: AppliesTo[] = ['any', 'adult', 'child', 'senior', 'pwd'];

const UNIT_LABELS: Record<Unit, string> = {
  per_person: 'Per person',
  per_tent: 'Per tent',
  per_night: 'Per night',
  flat: 'Flat amount',
};

const APPLIES_LABELS: Record<AppliesTo, string> = {
  any: 'All guests',
  adult: 'Adults only',
  child: 'Children only',
  senior: 'Seniors only',
  pwd: 'PWD only',
};

interface FormState {
  label: string;
  amount: string;
  unit: Unit;
  applies_to: AppliesTo;
  is_optional: boolean;
  description: string;
}

const EMPTY_FORM: FormState = {
  label: '',
  amount: '',
  unit: 'per_person',
  applies_to: 'any',
  is_optional: false,
  description: '',
};

interface Props {
  campsiteId: number;
  disabled?: boolean;
}

export function PricingLinesEditor({ campsiteId, disabled = false }: Props) {
  const [lines, setLines] = useState<PricingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await owner.listPricingLines(campsiteId);
      setLines(res.data);
    } catch (err: any) {
      setError(err?.message ?? 'Could not load pricing lines.');
    } finally {
      setLoading(false);
    }
  }, [campsiteId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (line: PricingLine) => {
    setEditingId(line.id);
    setEditError('');
    setEditForm({
      label: line.label,
      amount: line.amount,
      unit: line.unit,
      applies_to: line.applies_to,
      is_optional: line.is_optional,
      description: line.description ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const buildPayload = (form: FormState): CreatePricingLinePayload => ({
    label: form.label.trim(),
    amount: Number(form.amount),
    unit: form.unit,
    applies_to: form.applies_to,
    is_optional: form.is_optional,
    description: form.description.trim() || undefined,
  });

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setEditError('');
    if (!editForm.label.trim() || !editForm.amount) {
      setEditError('Label and amount are required.');
      return;
    }
    setSavingEdit(true);
    try {
      const payload: UpdatePricingLinePayload = buildPayload(editForm);
      const res = await owner.updatePricingLine(editingId, payload);
      const updated = res.data;
      setLines((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l)),
      );
      setEditingId(null);
    } catch (err: any) {
      setEditError(err?.message ?? 'Could not update pricing line.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdd = async () => {
    setAddError('');
    if (!addForm.label.trim() || !addForm.amount) {
      setAddError('Label and amount are required.');
      return;
    }
    setSavingAdd(true);
    try {
      const payload: CreatePricingLinePayload = {
        ...buildPayload(addForm),
        sort_order: lines.length,
      };
      const res = await owner.createPricingLine(campsiteId, payload);
      setLines((prev) => [...prev, res.data]);
      setAddForm(EMPTY_FORM);
      setAdding(false);
    } catch (err: any) {
      setAddError(err?.message ?? 'Could not create pricing line.');
    } finally {
      setSavingAdd(false);
    }
  };

  const performDelete = async (line: PricingLine) => {
    setDeletingId(line.id);
    try {
      await owner.deletePricingLine(line.id);
      setLines((prev) => prev.filter((l) => l.id !== line.id));
    } catch (err: any) {
      Alert.alert(
        'Delete failed',
        err?.message ?? 'Could not delete pricing line.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = (line: PricingLine) => {
    Alert.alert(
      'Delete pricing line',
      `Delete "${line.label}"? If this line is on any existing bookings, it cannot be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(line),
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.gearupGreen} />
        <Text style={styles.loadingText}>Loading pricing lines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Pricing lines</Text>
        <Text style={styles.subtitle}>
          Itemize how you charge guests. Each line is applied to bookings
          based on its unit and target. Per-tent lines let the customer pick
          quantity at booking time.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {lines.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No pricing lines yet. Add your first line below.
          </Text>
        </View>
      ) : (
        <View style={styles.listBox}>
          {lines.map((line, idx) => {
            const isEditing = editingId === line.id;
            const isDeleting = deletingId === line.id;
            return (
              <View
                key={line.id}
                style={[
                  styles.rowContainer,
                  idx < lines.length - 1 && styles.rowContainerDivider,
                ]}
              >
                {!isEditing ? (
                  <View>
                    <View style={styles.rowTop}>
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowLabel}>{line.label}</Text>
                        <Text style={styles.rowMeta}>
                          PHP {parseFloat(line.amount).toFixed(2)} -{' '}
                          {UNIT_LABELS[line.unit]}
                          {line.unit === 'per_person'
                            ? ` (${APPLIES_LABELS[line.applies_to]})`
                            : ''}
                          {line.is_optional ? ' - optional' : ''}
                        </Text>
                        {line.description ? (
                          <Text style={styles.rowDescription}>
                            {line.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        onPress={() => startEdit(line)}
                        disabled={disabled || isDeleting}
                        style={styles.actionBtn}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={colors.gearupGreen}
                        />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(line)}
                        disabled={disabled || isDeleting}
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                      >
                        {isDeleting ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.red}
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={colors.red}
                            />
                            <Text
                              style={[
                                styles.actionBtnText,
                                styles.actionBtnTextDanger,
                              ]}
                            >
                              Delete
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <LineForm
                    form={editForm}
                    onChange={setEditForm}
                    error={editError}
                    saving={savingEdit}
                    submitLabel="Save"
                    onCancel={cancelEdit}
                    onSubmit={handleSaveEdit}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {adding ? (
        <View style={styles.addBox}>
          <LineForm
            form={addForm}
            onChange={setAddForm}
            error={addError}
            saving={savingAdd}
            submitLabel="Add line"
            onCancel={() => {
              setAdding(false);
              setAddForm(EMPTY_FORM);
              setAddError('');
            }}
            onSubmit={handleAdd}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setAdding(true)}
          disabled={disabled}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>Add pricing line</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function LineForm({
  form,
  onChange,
  error,
  saving,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  form: FormState;
  onChange: (next: FormState) => void;
  error: string;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.formContainer}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Label</Text>
        <TextInput
          value={form.label}
          onChangeText={(v) => onChange({ ...form, label: v })}
          placeholder="e.g. Visitor fee (adult)"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Amount (PHP)</Text>
        <TextInput
          value={form.amount}
          onChangeText={(v) => onChange({ ...form, amount: v })}
          keyboardType="decimal-pad"
          placeholder="30"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Unit</Text>
        <View style={styles.pillRow}>
          {UNIT_OPTIONS.map((u) => {
            const active = form.unit === u;
            return (
              <TouchableOpacity
                key={u}
                onPress={() => onChange({ ...form, unit: u })}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {UNIT_LABELS[u]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {form.unit === 'per_person' ? (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Applies to</Text>
          <View style={styles.pillRow}>
            {APPLIES_OPTIONS.map((a) => {
              const active = form.applies_to === a;
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => onChange({ ...form, applies_to: a })}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {APPLIES_LABELS[a]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.switchRow}>
        <View style={styles.switchLabelWrap}>
          <Text style={styles.fieldLabel}>Optional</Text>
          <Text style={styles.switchHint}>
            Customers must opt in to optional lines.
          </Text>
        </View>
        <Switch
          value={form.is_optional}
          onValueChange={(v) => onChange({ ...form, is_optional: v })}
          trackColor={{ false: colors.border, true: colors.gearupGreenLight }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput
          value={form.description}
          onChangeText={(v) => onChange({ ...form, description: v })}
          placeholder="Shown to customers when booking"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.inputMultiline]}
          multiline
          numberOfLines={2}
        />
      </View>

      {error ? <Text style={styles.formError}>{error}</Text> : null}

      <View style={styles.formActions}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={saving}
          style={[styles.formActionBtn, styles.formCancelBtn]}
        >
          <Text style={styles.formCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={saving}
          style={[styles.formActionBtn, styles.formSubmitBtn]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.formSubmitText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorBannerText: {
    color: colors.red,
    fontSize: 13,
  },
  emptyBox: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listBox: {
    backgroundColor: colors.white,
    borderColor: '#f3f4f6',
    borderWidth: 1,
    borderRadius: 8,
  },
  rowContainer: {
    padding: 14,
  },
  rowContainerDivider: {
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowDescription: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderColor: colors.border,
    borderWidth: 1,
  },
  actionBtnDanger: {
    borderColor: '#fecaca',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gearupGreen,
  },
  actionBtnTextDanger: {
    color: colors.red,
  },
  addBtn: {
    backgroundColor: colors.gearupGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  addBox: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  formContainer: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.white,
  },
  pillActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  pillText: {
    fontSize: 12,
    color: colors.text,
  },
  pillTextActive: {
    color: colors.gearupGreen,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  switchLabelWrap: {
    flex: 1,
  },
  switchHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  formError: {
    color: colors.red,
    fontSize: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  formActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCancelBtn: {
    backgroundColor: colors.background,
  },
  formCancelText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  formSubmitBtn: {
    backgroundColor: colors.gearupGreen,
  },
  formSubmitText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});