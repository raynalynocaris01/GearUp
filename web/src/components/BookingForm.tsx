'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PricingLine {
  id: number;
  campsite_id: number;
  label: string;
  amount: string;
  unit: 'per_person' | 'per_tent' | 'per_night' | 'flat';
  applies_to: 'any' | 'adult' | 'child' | 'senior' | 'pwd';
  is_optional: boolean;
  description: string | null;
  sort_order: number;
}

interface Campsite {
  id: number;
  owner_id: number | null;
  name: string;
  location: string;
  price_per_night: string;
  price_unit: string;
  capacity: number;
  pricing_mode?: 'simple' | 'detailed';
  pricing_lines?: PricingLine[];
  children?: {
    id: number;
    name: string;
    description: string | null;
    price_per_night: string;
    price_unit: string;
    capacity: number;
  }[];
}

interface GearItem {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  category: string;
  price_per_day: string;
  image_url: string | null;
  stock: number;
  is_available: boolean;
}

interface TourGuide {
  id: number;
  name: string;
  description: string | null;
  price_per_trip: string;
  campsite_id: number | null;
}

interface BookingFormProps {
  campsite?: Campsite;
  presetGearItem?: GearItem;
  initialGearItemId?: number;
}

function toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function nightsBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diffMs = e.getTime() - s.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function BookingForm({
  campsite,
  presetGearItem,
  initialGearItemId,
}: BookingFormProps) {
  const router = useRouter();

  const tomorrow = useMemo(() => toDateInput(addDays(new Date(), 1)), []);
  const dayAfter = useMemo(() => toDateInput(addDays(new Date(), 2)), []);

  const isGearOnly = !campsite;

  // Dates (used for campsite OR gear-only)
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);

  const [guests, setGuests] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [pwd, setPwd] = useState(0);
  const [notes, setNotes] = useState('');
  const [preferredArrival, setPreferredArrival] = useState<"Morning" | "Afternoon" | "Evening">("Afternoon");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [conflictBookings, setConflictBookings] = useState<{ id: number; campsite_name: string; check_in: string; check_out: string }[]>([]);
  const [confirmedOverride, setConfirmedOverride] = useState(false);

  // Optional pricing-line selections: line_id -> quantity
  // (per_person/per_night/flat lines ignore quantity; per_tent uses it)
  const [selectedPricingLines, setSelectedPricingLines] = useState<
    Record<number, number>
  >({});

  const isDetailed = campsite?.pricing_mode === 'detailed';
  const effectiveGuests = isDetailed ? adults + children + seniors + pwd : guests;

  // Tour guides (only relevant when campsite is present)
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const toggleGear = (id: number) => {
    setSelectedGear((prev) => {
      const existing = prev.find((r) => r.gear_item_id === id);
      if (existing) {
        return prev.filter((r) => r.gear_item_id !== id);
      }
      return [...prev, { gear_item_id: id, quantity: 1 }];
    });
  };

  const setGearQty = (id: number, qty: number) => {
    setSelectedGear((prev) =>
      prev.map((r) =>
        r.gear_item_id === id ? { ...r, quantity: qty } : r,
      ),
    );
  };
  // Gear picker (only relevant when campsite is present)
  const [availableGear, setAvailableGear] = useState<GearItem[]>([]);

  // Legacy single-gear (used by the gear-only rental flow)
  const [selectedGearId, setSelectedGearId] = useState<number | null>(
    initialGearItemId ?? null,
  );
  const [gearQuantity, setGearQuantity] = useState(1);

  // Multi-gear (campsite bookings only)
  const [selectedGear, setSelectedGear] = useState<
    { gear_item_id: number; quantity: number }[]
  >([]);

  // Accommodation variant — null = book the campsite itself.
  // When set, it's the id of a child campsite (a room).
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // Fetch tour guides for this campsite
  useEffect(() => {
    if (!campsite) return;
    (async () => {
      try {
        const [campsiteRes, independentRes] = await Promise.all([
          fetch(`/api/tour-guides?campsite_id=${campsite.id}`),
          fetch(`/api/tour-guides?independent=true`),
        ]);
        const campsiteData: TourGuide[] = campsiteRes.ok
          ? await campsiteRes.json()
          : [];
        const independentData: TourGuide[] = independentRes.ok
          ? await independentRes.json()
          : [];
        setGuides([...campsiteData, ...independentData]);
      } catch {
        // silent
      }
    })();
  }, [campsite]);

  // Fetch all gear — section split happens below (ownerGear / individualGear)
  useEffect(() => {
    if (!campsite) return;
    (async () => {
      try {
        const res = await fetch(`/api/gear`);
        if (!res.ok) return;
        const data: GearItem[] = await res.json();
        setAvailableGear(data);
      } catch {
        // silent
      }
    })();
  }, [campsite]);

 

  // Multi-select gear sections (campsite bookings only)
  const ownerGear = useMemo(
    () =>
      availableGear.filter(
        (g) => g.owner_id === campsite?.owner_id && g.is_available && g.stock > 0,
      ),
    [availableGear, campsite?.owner_id],
  );

  const individualGear = useMemo(
    () =>
      availableGear.filter(
        (g) => g.owner_id !== campsite?.owner_id && g.is_available && g.stock > 0,
      ),
    [availableGear, campsite?.owner_id],
  );

  // When a room is selected, clear any guide or gear selection —
  // rooms don't offer guides and we hide gear for room bookings.
  useEffect(() => {
    if (selectedRoomId !== null) {
      setSelectedGuideId(null);
      setSelectedGear([]);
    }
  }, [selectedRoomId]);

  // The gear item to use for pricing (either preset or picked from list)
  const activeGear: GearItem | null = useMemo(() => {
    if (presetGearItem) return presetGearItem;
    if (!selectedGearId) return null;
    return availableGear.find((g) => g.id === selectedGearId) ?? null;
  }, [presetGearItem, selectedGearId, availableGear]);

  // Price preview
  const {
    nights,
    campsitePrice,
    guidePrice,
    gearPrice,
    gearLines,
    pricingLineRows,
    totalPrice,
  } = useMemo(() => {
    const n = nightsBetween(checkIn, checkOut);

    // Campsite price (0 if none)
    let cPrice = 0;
    const pricingLineRows: {
      id: number;
      label: string;
      amount: number;
      unit: 'per_person' | 'per_tent' | 'per_night' | 'flat';
      qty: number;
      subtotal: number;
    }[] = [];

    if (campsite) {
      if (selectedRoomId !== null) {
        // Room variant: priced per-room per-night. Guests is a limit,
        // not a multiplier.
        const room = campsite.children?.find((c) => c.id === selectedRoomId);
        if (room) {
          const unit = parseFloat(room.price_per_night);
          cPrice = unit * Math.max(n, 1);
        }
      } else if (isDetailed && campsite.pricing_lines) {
        // Detailed mode: sum pricing lines (mandatory + selected optional)
        const nightsForLines = Math.max(n, 1);
        const bodiesByCategory = {
          adult: adults,
          child: children,
          senior: seniors,
          pwd: pwd,
          any: adults + children + seniors + pwd,
        };
        for (const line of campsite.pricing_lines) {
          if (line.is_optional && !selectedPricingLines[line.id]) continue;
          const amount = parseFloat(line.amount);
          let qty = 1;
          if (line.unit === 'per_person') {
            qty = bodiesByCategory[line.applies_to] ?? 0;
          } else if (line.unit === 'per_tent') {
            qty = selectedPricingLines[line.id] ?? 1;
          } else if (line.unit === 'per_night') {
            qty = nightsForLines;
          }
          const subtotal = amount * qty;
          cPrice += subtotal;
          pricingLineRows.push({
            id: line.id,
            label: line.label,
            amount,
            unit: line.unit,
            qty,
            subtotal,
          });
        }
      } else {
        // Simple campsite pricing
        const unit = parseFloat(campsite.price_per_night);
        cPrice =
          campsite.price_unit === 'entrance'
            ? unit * guests
            : unit * n * guests;
      }
    }

    // Guide price
    const selectedGuide = guides.find((g) => g.id === selectedGuideId);
    const gPrice = selectedGuide
      ? parseFloat(selectedGuide.price_per_trip)
      : 0;

        // Gear price: price_per_day × days × quantity
    // Campsite mode → sum across all multi-selected gear lines.
    // Gear-only mode → legacy single-gear math.
    let gearTotal = 0;
    const gearLines: {
      gear_item_id: number;
      name: string;
      unit: number;
      qty: number;
      subtotal: number;
    }[] = [];

    if (campsite && !presetGearItem) {
      for (const row of selectedGear) {
        const item = availableGear.find((g) => g.id === row.gear_item_id);
        if (!item) continue;
        const unit = parseFloat(item.price_per_day);
        const subtotal = unit * Math.max(n, 1) * row.quantity;
        gearTotal += subtotal;
        gearLines.push({
          gear_item_id: item.id,
          name: item.name,
          unit,
          qty: row.quantity,
          subtotal,
        });
      }
    } else if (activeGear) {
      const unit = parseFloat(activeGear.price_per_day);
      const subtotal = unit * Math.max(n, 1) * gearQuantity;
      gearTotal = subtotal;
      gearLines.push({
        gear_item_id: activeGear.id,
        name: activeGear.name,
        unit,
        qty: gearQuantity,
        subtotal,
      });
    }

    return {
      nights:
        selectedRoomId !== null
          ? Math.max(n, 1)
          : campsite?.price_unit === 'entrance'
            ? 0
            : n,
      campsitePrice: cPrice,
      guidePrice: gPrice,
      gearPrice: gearTotal,
      gearLines,
      pricingLineRows,
      totalPrice: cPrice + gPrice + gearTotal,
    };
  }, [
    campsite,
    checkIn,
    checkOut,
    guests,
    adults,
    children,
    seniors,
    pwd,
    isDetailed,
    selectedPricingLines,
    guides,
    selectedGuideId,
    activeGear,
    availableGear,
    selectedGear,
    gearQuantity,
    presetGearItem,
    selectedRoomId,
  ]);

  const handleOverride = () => {
    setConfirmedOverride(true);
    setConflictBookings([]);
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      form?.requestSubmit();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    if (checkIn >= checkOut) {
      setGeneralError('Return date must be after start date.');
      return;
    }
    if (campsite && selectedRoom && effectiveGuests > selectedRoom.capacity) {
      setGeneralError(`This room allows up to ${selectedRoom.capacity} guests.`);
      return;
    }
    if (campsite && !selectedRoom && effectiveGuests > campsite.capacity) {
      setGeneralError(`This campsite allows up to ${campsite.capacity} guests.`);
      return;
    }
    if (isGearOnly && !presetGearItem) {
      setGeneralError('No gear item selected.');
      return;
    }
    if (activeGear && gearQuantity > activeGear.stock) {
      setGeneralError(`Only ${activeGear.stock} units available.`);
      return;
    }
    for (const row of selectedGear) {
      const item = availableGear.find((g) => g.id === row.gear_item_id);
      if (item && row.quantity > item.stock) {
        setGeneralError(`Only ${item.stock} of ${item.name} available.`);
        return;
      }
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      guests: campsite ? effectiveGuests : 1,
      check_in: checkIn,
      check_out: checkOut,
      notes: notes.trim() || null,
      preferred_arrival: preferredArrival,
      confirmed_override: confirmedOverride,
    };

    if (campsite && isDetailed) {
      payload.adults = adults;
      payload.children = children;
      payload.seniors = seniors;
      payload.pwd = pwd;

      // Send only selected optional lines. Mandatory lines are auto-included
      // server-side. quantity is required by backend validation for every
      // row; only per_tent uses it as a multiplier.
      const selectedRows = campsite.pricing_lines
        ?.filter((line) => line.is_optional && selectedPricingLines[line.id])
        .map((line) => ({
          pricing_line_id: line.id,
          quantity: selectedPricingLines[line.id] ?? 1,
        }));
      if (selectedRows && selectedRows.length > 0) {
        payload.pricing_lines = selectedRows;
      }
    }

    if (campsite) {
      payload.campsite_id = campsite.id;
      payload.room_campsite_id = selectedRoomId;
      payload.tour_guide_id = selectedGuideId;
    }

    if (campsite && !presetGearItem) {
      // Multi-gear (campsite bookings)
      if (selectedGear.length > 0) {
        payload.gear_items = selectedGear.map((row) => ({
          gear_item_id: row.gear_item_id,
          quantity: row.quantity,
        }));
        payload.gear_start_date = checkIn;
        payload.gear_end_date = checkOut;
      }
    } else if (activeGear) {
      // Legacy single-gear (gear-only rental flow)
      payload.gear_item_id = activeGear.id;
      payload.gear_quantity = gearQuantity;
      payload.gear_start_date = checkIn;
      payload.gear_end_date = checkOut;
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok && data.requires_confirmation) {
      setConflictBookings(data.existing_bookings || []);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if (!res.ok) {
      if (data.errors) {
        setErrors(data.errors);
        // Show the first field error as a general error too, so users see it
        // even if the field has no UI slot (e.g., room_campsite_id)
        const firstError = Object.values(data.errors).flat()[0];
        if (firstError) setGeneralError(firstError as string);
      } else {
        setGeneralError(data.message ?? 'Booking failed');
      }
      return;
    }

    router.push(`/bookings/${data.id}/confirmed`);
  };

  const selectedRoom =
    selectedRoomId !== null
      ? campsite?.children?.find((c) => c.id === selectedRoomId) ?? null
      : null;

  const maxGuests = selectedRoom?.capacity ?? campsite?.capacity ?? 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {isGearOnly ? 'Rental Dates' : 'Dates'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {isGearOnly ? 'Pick-up' : 'Check-in'}
            </label>
            <input
              type="date"
              value={checkIn}
              min={tomorrow}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
            {errors.check_in && (
              <p className="text-red-600 text-xs mt-1">{errors.check_in[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              {isGearOnly ? 'Return' : 'Check-out'}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent"
            />
            {errors.check_out && (
              <p className="text-red-600 text-xs mt-1">{errors.check_out[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Accommodation picker — only if the campsite has room variants */}
      {campsite && campsite.children && campsite.children.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Accommodation
          </h3>
          <div className="space-y-2">
            <label
              className={`block border rounded-lg p-4 cursor-pointer transition ${
                selectedRoomId === null
                  ? 'border-gearup-600 bg-gearup-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="accommodation"
                  checked={selectedRoomId === null}
                  onChange={() => setSelectedRoomId(null)}
                  className="mt-1 h-4 w-4 accent-gearup-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900 text-sm">
                      Camping spot
                    </p>
                    <p className="text-sm font-bold text-gearup-600 shrink-0">
                      {campsite.price_unit === 'entrance'
                        ? `PHP ${campsite.price_per_night} / entrance`
                        : `PHP ${campsite.price_per_night} / night`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Up to {campsite.capacity} guests.
                  </p>
                </div>
              </div>
            </label>

            {campsite.children.map((room) => {
              const active = selectedRoomId === room.id;
              return (
                <label
                  key={room.id}
                  className={`block border rounded-lg p-4 cursor-pointer transition ${
                    active
                      ? 'border-gearup-600 bg-gearup-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="accommodation"
                      checked={active}
                      onChange={() => setSelectedRoomId(room.id)}
                      className="mt-1 h-4 w-4 accent-gearup-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900 text-sm">
                          {room.name}
                        </p>
                        <p className="text-sm font-bold text-gearup-600 shrink-0">
                          PHP {room.price_per_night} / night
                        </p>
                      </div>
                      {room.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {room.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Up to {room.capacity}{' '}
                        {room.capacity === 1 ? 'guest' : 'guests'}.
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Guests — only if campsite */}
      {campsite && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Guests
          </h3>

          {isDetailed && selectedRoomId === null ? (
            // Detailed mode: four category steppers
            <div className="space-y-2">
              {[
                { key: 'adults', label: 'Adults', value: adults, setter: setAdults, min: 1 },
                { key: 'children', label: 'Children', value: children, setter: setChildren, min: 0 },
                { key: 'seniors', label: 'Seniors', value: seniors, setter: setSeniors, min: 0 },
                { key: 'pwd', label: 'PWD', value: pwd, setter: setPwd, min: 0 },
              ].map((row) => {
                const atMax = effectiveGuests >= maxGuests;
                const canDecrement = row.value > row.min;
                const canIncrement = !atMax;
                return (
                  <div
                    key={row.key}
                    className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {row.label}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => row.setter(Math.max(row.min, row.value - 1))}
                        disabled={!canDecrement}
                        className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`Decrease ${row.label.toLowerCase()}`}
                      >
                        −
                      </button>
                      <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
                        {row.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => row.setter(row.value + 1)}
                        disabled={!canIncrement}
                        className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`Increase ${row.label.toLowerCase()}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 pt-1">
                Total: {effectiveGuests} of {maxGuests} max
              </p>
            </div>
          ) : (
            // Simple mode + room mode: single stepper (unchanged)
            <div className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Number of guests
                </p>
                <p className="text-xs text-gray-500">
                  {selectedRoom
                    ? `Max ${selectedRoom.capacity} for this room`
                    : `Max ${campsite.capacity} for this campsite`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                  aria-label="Decrease guests"
                >
                  −
                </button>
                <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGuests((g) => Math.min(maxGuests, g + 1))
                  }
                  className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                  aria-label="Increase guests"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {errors.guests && (
            <p className="text-red-600 text-xs mt-1">{errors.guests[0]}</p>
          )}
        </div>
      )}

      {selectedRoomId !== null && (
        <>
          {/* Preferred Arrival Time */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Arrival Time</label>
        <select
          value={preferredArrival}
          onChange={(e) => setPreferredArrival(e.target.value as "Morning" | "Afternoon" | "Evening")}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gearup-500"
        >
          <option value="Morning">Morning (8:00 AM - 12:00 PM)</option>
          <option value="Afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
          <option value="Evening">Evening (5:00 PM - 9:00 PM)</option>
        </select>
      </div>
        </>
      )}

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Notes (optional)
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the host should know?"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gearup-600 focus:border-transparent resize-none"
        />
      </div>

      {/* Optional pricing lines — detailed mode, no room selected */}
      {isDetailed &&
        selectedRoomId === null &&
        campsite?.pricing_lines &&
        campsite.pricing_lines.some((l) => l.is_optional) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Optional add-ons
            </h3>
            <div className="space-y-2">
              {campsite.pricing_lines
                .filter((l) => l.is_optional)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((line) => {
                  const selected = !!selectedPricingLines[line.id];
                  const amount = parseFloat(line.amount);
                  const qty = selectedPricingLines[line.id] ?? 1;
                  const unitLabel =
                    line.unit === 'per_person'
                      ? line.applies_to === 'any'
                        ? '/ person'
                        : `/ ${line.applies_to}`
                      : line.unit === 'per_tent'
                        ? '/ tent'
                        : line.unit === 'per_night'
                          ? '/ night'
                          : '';
                  const isPerTent = line.unit === 'per_tent';

                  const toggle = () => {
                    setSelectedPricingLines((prev) => {
                      const next = { ...prev };
                      if (next[line.id]) {
                        delete next[line.id];
                      } else {
                        next[line.id] = 1;
                      }
                      return next;
                    });
                  };

                  const setQty = (newQty: number) => {
                    setSelectedPricingLines((prev) => ({
                      ...prev,
                      [line.id]: Math.max(1, newQty),
                    }));
                  };

                  return (
                    <div
                      key={line.id}
                      className={`border rounded-lg p-4 transition ${
                        selected
                          ? 'border-gearup-600 bg-gearup-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={toggle}
                          className="mt-1 h-4 w-4 accent-gearup-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-gray-900 text-sm">
                              {line.label}
                            </p>
                            <p className="text-sm font-bold text-gearup-600 shrink-0">
                              +PHP {amount.toFixed(0)} {unitLabel}
                            </p>
                          </div>
                          {line.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {line.description}
                            </p>
                          )}
                        </div>
                      </label>

                      {selected && isPerTent && (
                        <div className="mt-3 flex items-center justify-between border-t border-green-200 pt-3">
                          <p className="text-xs text-gray-600">
                            Quantity
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setQty(qty - 1)}
                              disabled={qty <= 1}
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="text-base font-bold text-gray-900 min-w-[2ch] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(qty + 1)}
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      {/* Tour guide picker — only if campsite AND has guides AND no room */}
      {campsite && selectedRoomId === null && guides.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Add a tour guide? (optional)
          </h3>
          <div className="space-y-2">
            <label
              className={`block border rounded-lg p-4 cursor-pointer transition ${
                selectedGuideId === null
                  ? 'border-gearup-600 bg-gearup-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="guide"
                  checked={selectedGuideId === null}
                  onChange={() => setSelectedGuideId(null)}
                  className="mt-1 h-4 w-4 accent-gearup-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    No guide
                  </p>
                  <p className="text-xs text-gray-500">
                    Just book the campsite.
                  </p>
                </div>
              </div>
            </label>

            {(() => {
              const campsiteGuides = guides.filter(
                (g) => g.campsite_id !== null,
              );
              const independentGuides = guides.filter(
                (g) => g.campsite_id === null,
              );

              const renderRow = (g: TourGuide) => {
                const price = parseFloat(g.price_per_trip);
                const active = selectedGuideId === g.id;
                return (
                  <label
                    key={g.id}
                    className={`block border rounded-lg p-4 cursor-pointer transition ${
                      active
                        ? 'border-gearup-600 bg-gearup-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="guide"
                        checked={active}
                        onChange={() => setSelectedGuideId(g.id)}
                        className="mt-1 h-4 w-4 accent-gearup-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-gray-900 text-sm">
                            {g.name}
                          </p>
                          <p className="text-sm font-bold text-gearup-600 shrink-0">
                            {price > 0 ? `+₱${price.toFixed(0)}` : 'Free'}
                          </p>
                        </div>
                        {g.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {g.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                );
              };

              return (
                <>
                  {campsiteGuides.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-4 mb-1">
                        Guides at this campsite
                      </p>
                      {campsiteGuides.map(renderRow)}
                    </>
                  )}
                  {independentGuides.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-4 mb-1">
                        Independent guides (available anywhere)
                      </p>
                      {independentGuides.map(renderRow)}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

            {/* Gear picker — multi-select, only if campsite AND no room selected */}
      {campsite && selectedRoomId === null && !presetGearItem && (ownerGear.length > 0 || individualGear.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Add gear to your trip? (optional)
          </h3>

          {ownerGear.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Provided by this campsite
              </p>
              <div className="space-y-2">
                {ownerGear.map((g) => {
                  const price = parseFloat(g.price_per_day);
                  const row = selectedGear.find(
                    (r) => r.gear_item_id === g.id,
                  );
                  const active = !!row;
                  return (
                    <div
                      key={g.id}
                      className={`border rounded-lg p-4 transition ${
                        active
                          ? 'border-gearup-600 bg-gearup-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleGear(g.id)}
                          className="mt-1 h-4 w-4 accent-gearup-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {g.name}
                              </p>
                              <p className="text-xs text-gearup-600 font-semibold">
                                {g.category} · {g.stock} in stock
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gearup-600 shrink-0">
                              +₱{price.toFixed(0)}/day
                            </p>
                          </div>
                          {g.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {g.description}
                            </p>
                          )}
                        </div>
                      </label>

                      {active && row && (
                        <div className="mt-3 flex items-center justify-between border-t border-green-200 pt-3">
                          <p className="text-xs text-gray-600">Quantity</p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setGearQty(
                                  g.id,
                                  Math.max(1, row.quantity - 1),
                                )
                              }
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="text-base font-bold text-gray-900 min-w-[2ch] text-center">
                              {row.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGearQty(
                                  g.id,
                                  Math.min(g.stock, row.quantity + 1),
                                )
                              }
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {individualGear.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                From individuals
              </p>
              <div className="space-y-2">
                {individualGear.map((g) => {
                  const price = parseFloat(g.price_per_day);
                  const row = selectedGear.find(
                    (r) => r.gear_item_id === g.id,
                  );
                  const active = !!row;
                  return (
                    <div
                      key={g.id}
                      className={`border rounded-lg p-4 transition ${
                        active
                          ? 'border-gearup-600 bg-gearup-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleGear(g.id)}
                          className="mt-1 h-4 w-4 accent-gearup-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {g.name}
                              </p>
                              <p className="text-xs text-gearup-600 font-semibold">
                                {g.category} · {g.stock} in stock
                              </p>
                            </div>
                            <p className="text-sm font-bold text-gearup-600 shrink-0">
                              +₱{price.toFixed(0)}/day
                            </p>
                          </div>
                          {g.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {g.description}
                            </p>
                          )}
                        </div>
                      </label>

                      {active && row && (
                        <div className="mt-3 flex items-center justify-between border-t border-green-200 pt-3">
                          <p className="text-xs text-gray-600">Quantity</p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setGearQty(
                                  g.id,
                                  Math.max(1, row.quantity - 1),
                                )
                              }
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="text-base font-bold text-gray-900 min-w-[2ch] text-center">
                              {row.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGearQty(
                                  g.id,
                                  Math.min(g.stock, row.quantity + 1),
                                )
                              }
                              className="w-8 h-8 rounded-full border-2 border-gearup-600 text-gearup-600 text-lg font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gear quantity picker in gear-only mode */}
      {isGearOnly && presetGearItem && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quantity
          </h3>
          <div className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Units to rent
              </p>
              <p className="text-xs text-gray-500">
                Max {presetGearItem.stock} available
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setGearQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-lg font-bold text-gray-900 min-w-[2ch] text-center">
                {gearQuantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setGearQuantity((q) =>
                    Math.min(presetGearItem.stock, q + 1),
                  )
                }
                className="w-9 h-9 rounded-full border-2 border-gearup-600 text-gearup-600 text-xl font-bold hover:bg-gearup-50 transition flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
          {errors.gear_quantity && (
            <p className="text-red-600 text-xs mt-1">
              {errors.gear_quantity[0]}
            </p>
          )}
        </div>
      )}

      {/* Price summary */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="space-y-2 text-sm text-green-900">
          {campsite && selectedRoom && (
            <div className="flex justify-between items-center">
              <span>
                {selectedRoom.name}: ₱{selectedRoom.price_per_night} ×{' '}
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span className="font-semibold">
                ₱{campsitePrice.toFixed(2)}
              </span>
            </div>
          )}

          {campsite && !selectedRoom && (
            isDetailed ? (
              pricingLineRows.length > 0 ? (
                <>
                  {pricingLineRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {row.label}
                        {row.qty !== 1 ? ` × ${row.qty}` : ''}
                        {` × PHP ${row.amount.toFixed(0)}`}
                      </span>
                      <span className="font-semibold">
                        PHP {row.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-red-700">
                  Select at least one add-on to continue.
                </p>
              )
            ) : (
              <div className="flex justify-between items-center">
                <span>
                  {campsite.price_unit === 'entrance'
                    ? `Campsite: ₱${campsite.price_per_night} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`
                    : `Campsite: ₱${campsite.price_per_night} × ${nights} ${nights === 1 ? 'night' : 'nights'} × ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
                </span>
                <span className="font-semibold">
                  ₱{campsitePrice.toFixed(2)}
                </span>
              </div>
            )
          )}

          {selectedGuideId !== null && (
            <div className="flex justify-between items-center">
              <span>
                Tour guide:{' '}
                {guides.find((g) => g.id === selectedGuideId)?.name}
              </span>
              <span className="font-semibold">
                ₱{guidePrice.toFixed(2)}
              </span>
            </div>
          )}

                    {gearLines.map((line) => (
            <div
              key={line.gear_item_id}
              className="flex justify-between items-center"
            >
              <span>
                {line.name}: ₱{line.unit.toFixed(2)} ×{' '}
                {Math.max(nights, 1)}{' '}
                {Math.max(nights, 1) === 1 ? 'day' : 'days'} × {line.qty}
              </span>
              <span className="font-semibold">
                ₱{line.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-green-300 my-4" />

        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-green-900">Total</span>
          <span className="text-2xl font-black text-green-900">
            ₱{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {generalError && (
        <p className="text-red-600 text-sm text-center">{generalError}</p>
      )}

      {conflictBookings.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Confirm Booking</h3>
            <p className="mb-4 text-sm text-gray-600">You already have a booking on these dates:</p>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              {conflictBookings.map((b) => (
                <div key={b.id} className="mb-1 text-amber-900">
                  <span className="font-semibold">{b.campsite_name}</span>
                  {': '}
                  {new Date(b.check_in).toLocaleDateString()} to {new Date(b.check_out).toLocaleDateString()}
                </div>
              ))}
            </div>
            <p className="mb-6 text-sm text-gray-500">Do you want to continue anyway?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConflictBookings([])} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleOverride} className="flex-1 rounded-lg bg-gearup-600 px-4 py-2 font-semibold text-white hover:bg-gearup-700">Continue</button>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gearup-600 hover:bg-gearup-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition"
      >
        {submitting
          ? 'Confirming...'
          : isGearOnly
            ? 'Confirm Rental'
            : 'Confirm Booking'}
      </button>
    </form>
  );
}
