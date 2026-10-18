'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PricingLine } from '@gearup/shared';

type Unit = 'per_person' | 'per_tent' | 'per_night' | 'flat';
type AppliesTo = 'any' | 'adult' | 'child' | 'senior' | 'pwd';

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

const EMPTY_FORM = {
  label: '',
  amount: '',
  unit: 'per_person' as Unit,
  applies_to: 'any' as AppliesTo,
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
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(
        `/api/owner/campsites/${campsiteId}/pricing-lines`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Could not load pricing lines.');
      }
      const data: PricingLine[] = await res.json();
      setLines(data);
    } catch (err: any) {
      setError(err?.message ?? 'Network error.');
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

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setEditError('');
    if (!editForm.label.trim() || !editForm.amount) {
      setEditError('Label and amount are required.');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/owner/pricing-lines/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editForm.label.trim(),
          amount: Number(editForm.amount),
          unit: editForm.unit,
          applies_to: editForm.applies_to,
          is_optional: editForm.is_optional,
          description: editForm.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Could not update pricing line.');
      }
      const updated: PricingLine = await res.json();
      setLines((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l)),
      );
      setEditingId(null);
    } catch (err: any) {
      setEditError(err?.message ?? 'Network error.');
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
      const res = await fetch(
        `/api/owner/campsites/${campsiteId}/pricing-lines`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: addForm.label.trim(),
            amount: Number(addForm.amount),
            unit: addForm.unit,
            applies_to: addForm.applies_to,
            is_optional: addForm.is_optional,
            description: addForm.description.trim() || null,
            sort_order: lines.length,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Could not create pricing line.');
      }
      const created: PricingLine = await res.json();
      setLines((prev) => [...prev, created]);
      setAddForm(EMPTY_FORM);
      setAdding(false);
    } catch (err: any) {
      setAddError(err?.message ?? 'Network error.');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleDelete = async (line: PricingLine) => {
    if (
      !confirm(
        `Delete "${line.label}"? If this line is on any existing bookings, it cannot be removed.`,
      )
    ) {
      return;
    }
    setDeletingId(line.id);
    try {
      const res = await fetch(`/api/owner/pricing-lines/${line.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Could not delete pricing line.');
      }
      setLines((prev) => prev.filter((l) => l.id !== line.id));
    } catch (err: any) {
      alert(err?.message ?? 'Network error.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-4">Loading pricing lines...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">
          Pricing lines
        </h3>
        <p className="text-xs text-gray-500">
          Itemize how you charge guests. Each line is applied to bookings
          based on its unit and target. Per-tent lines let the customer pick
          quantity at booking time.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Existing lines */}
      {lines.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
          No pricing lines yet. Add your first line below.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg divide-y divide-gray-100">
          {lines.map((line) => {
            const isEditing = editingId === line.id;
            return (
              <div key={line.id} className="p-4">
                {!isEditing ? (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {line.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        PHP {parseFloat(line.amount).toFixed(2)} -{' '}
                        {UNIT_LABELS[line.unit]}
                        {line.unit === 'per_person'
                          ? ` (${APPLIES_LABELS[line.applies_to]})`
                          : ''}
                        {line.is_optional ? ' - optional' : ''}
                      </p>
                      {line.description && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          {line.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(line)}
                        disabled={disabled}
                        className="text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(line)}
                        disabled={disabled || deletingId === line.id}
                        className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {deletingId === line.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-900">
                      Edit pricing line
                    </p>
                    <PricingLineFields
                      form={editForm}
                      onChange={(patch) =>
                        setEditForm((f) => ({ ...f, ...patch }))
                      }
                    />
                    {editError && (
                      <p className="text-xs text-red-600">{editError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 disabled:opacity-50 px-4 py-1.5 rounded-lg"
                      >
                        {savingEdit ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="bg-white border border-gray-100 rounded-lg p-4 space-y-3">
          <p className="text-sm font-bold text-gray-900">New pricing line</p>
          <PricingLineFields
            form={addForm}
            onChange={(patch) => setAddForm((f) => ({ ...f, ...patch }))}
          />
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setAddForm(EMPTY_FORM);
                setAddError('');
              }}
              className="text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={savingAdd}
              className="text-xs font-semibold text-white bg-gearup-600 hover:bg-gearup-700 disabled:opacity-50 px-4 py-1.5 rounded-lg"
            >
              {savingAdd ? 'Adding...' : 'Add line'}
            </button>
          </div>
        </div>
      ) : (
        !disabled && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full text-sm font-semibold text-gearup-600 border-2 border-dashed border-gearup-200 hover:bg-gearup-50 rounded-lg py-3 transition"
          >
            + Add pricing line
          </button>
        )
      )}
    </div>
  );
}

function PricingLineFields({
  form,
  onChange,
}: {
  form: typeof EMPTY_FORM;
  onChange: (patch: Partial<typeof EMPTY_FORM>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label *
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. Visitor fee (adult)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Amount (PHP) *
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Unit
          </label>
          <select
            value={form.unit}
            onChange={(e) => onChange({ unit: e.target.value as Unit })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-600"
          >
            {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
              <option key={u} value={u} className="text-gray-900 bg-white">
                {UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Applies to
          </label>
          <select
            value={form.applies_to}
            onChange={(e) =>
              onChange({ applies_to: e.target.value as AppliesTo })
            }
            disabled={form.unit !== 'per_person'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-600 disabled:opacity-50 disabled:bg-gray-50"
          >
            {(Object.keys(APPLIES_LABELS) as AppliesTo[]).map((a) => (
              <option key={a} value={a} className="text-gray-900 bg-white">
                {APPLIES_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Shown to customers under the label"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gearup-600"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_optional}
          onChange={(e) => onChange({ is_optional: e.target.checked })}
          className="h-4 w-4 accent-gearup-600"
        />
        <span className="text-xs font-medium text-gray-700">
          Optional (customer picks whether to include it)
        </span>
      </label>
    </>
  );
}