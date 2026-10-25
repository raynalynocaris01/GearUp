import { useEffect, useState, useMemo } from 'react';
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
  Pressable,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { campsites, bookings, tourGuides, gear } from '../../lib/api';
import type { Campsite, GearItem } from '@gearup/shared';
import { colors } from '../../theme';
import { imgSrc } from '../../lib/images';

function toDateString(d: Date): string {
  // YYYY-MM-DD in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDisplay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NewBookingScreen() {
  const router = useRouter();
  const { campsiteId } = useLocalSearchParams<{ campsiteId: string }>();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Default: tomorrow → day after
  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const dayAfter = useMemo(() => addDays(new Date(), 2), []);

  const [checkIn, setCheckIn] = useState(toDateString(tomorrow));
  const [checkOut, setCheckOut] = useState(toDateString(dayAfter));
  const [showPicker, setShowPicker] = useState<null | 'checkIn' | 'checkOut'>(null);
  const [guests, setGuests] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [pwd, setPwd] = useState(0);
  const [notes, setNotes] = useState('');
  const [preferredArrival, setPreferredArrival] = useState('Afternoon');
  const [availableGuides, setAvailableGuides] = useState<
  {
    id: number;
    name: string;
    description: string | null;
    price_per_trip: string;
    campsite_id: number | null;
  }[]
  >([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // Optional pricing-line selections: line_id -> quantity.
  // Only relevant when the campsite is in detailed pricing mode.
  const [selectedPricingLines, setSelectedPricingLines] = useState<
    Record<number, number>
  >({});

  const isDetailed = campsite?.pricing_mode === 'detailed';
  const effectiveGuests = isDetailed
    ? adults + children + seniors + pwd
    : guests;

  // Gear picker — multi-select on campsite bookings
  const [availableGear, setAvailableGear] = useState<GearItem[]>([]);
  const [selectedGear, setSelectedGear] = useState<
    { gear_item_id: number; quantity: number }[]
  >([]);

  const toggleGear = (id: number) => {
    setSelectedGear((prev) => {
      const existing = prev.find((r) => r.gear_item_id === id);
      if (existing) return prev.filter((r) => r.gear_item_id !== id);
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

  // When a room is selected, clear any guide or gear selection —
  // rooms don't offer guides and we hide gear for room bookings.
  useEffect(() => {
    if (selectedRoomId !== null) {
      setSelectedGuideId(null);
      setSelectedGear([]);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (!campsite) return;
    (async () => {
      try {
        const [campsiteRes, independentRes] = await Promise.all([
          tourGuides.list({ campsite_id: campsite.id }),
          tourGuides.list({ independent: true }),
        ]);
        setAvailableGuides([...campsiteRes.data, ...independentRes.data]);
      } catch {
        // silent
      }
    })();
  }, [campsite]);

  // Fetch all available gear (campsite owner + individuals)
  useEffect(() => {
    if (!campsite) return;
    (async () => {
      try {
        const res = await gear.list();
        setAvailableGear(
          res.data.filter((g: GearItem) => g.is_available && g.stock > 0),
        );
      } catch {
        // silent
      }
    })();
  }, [campsite]);

  useEffect(() => {
    (async () => {
      try {
        const res = await campsites.get(campsiteId);
        setCampsite(res.data);
      } catch {
        Alert.alert('Error', 'Could not load campsite details.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [campsiteId]);

    // Section split: campsite owner's gear vs individuals
  const ownerGear = useMemo(
    () =>
      availableGear.filter((g) => g.owner_id === campsite?.owner_id),
    [availableGear, campsite?.owner_id],
  );

  const individualGear = useMemo(
    () =>
      availableGear.filter((g) => g.owner_id !== campsite?.owner_id),
    [availableGear, campsite?.owner_id],
  );

  // Live price preview
  const {
    nights,
    campsitePrice,
    guidePrice,
    gearPrice,
    gearLines,
    pricingLineRows,
    totalPrice,
  } = useMemo(() => {
    if (!campsite) {
      return {
        nights: 0,
        campsitePrice: 0,
        guidePrice: 0,
        gearPrice: 0,
        gearLines: [] as {
          gear_item_id: number;
          name: string;
          unit: number;
          qty: number;
          subtotal: number;
        }[],
        pricingLineRows: [] as {
          id: number;
          label: string;
          amount: number;
          unit: 'per_person' | 'per_tent' | 'per_night' | 'flat';
          qty: number;
          subtotal: number;
        }[],
        totalPrice: 0,
      };
    }
    const start = new Date(checkIn + 'T00:00:00');
    const end = new Date(checkOut + 'T00:00:00');
    const diffMs = end.getTime() - start.getTime();
    const n = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const unit = parseFloat(campsite.price_per_night);

    let cPrice = 0;
    const pricingLineRows: {
      id: number;
      label: string;
      amount: number;
      unit: 'per_person' | 'per_tent' | 'per_night' | 'flat';
      qty: number;
      subtotal: number;
    }[] = [];

    if (selectedRoomId !== null) {
      // Room variant: priced per-room per-night.
      const room = campsite.children?.find((c) => c.id === selectedRoomId);
      if (room) {
        cPrice = parseFloat(room.price_per_night) * Math.max(n, 1);
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
      cPrice =
        campsite.price_unit === 'entrance'
          ? unit * guests
          : unit * n * guests;
    }

    const selectedGuide = availableGuides.find((g) => g.id === selectedGuideId);
    const gPrice = selectedGuide
      ? parseFloat(selectedGuide.price_per_trip)
      : 0;

    // Gear: sum across all selected lines
    let grPrice = 0;
    const lines: {
      gear_item_id: number;
      name: string;
      unit: number;
      qty: number;
      subtotal: number;
    }[] = [];

    for (const row of selectedGear) {
      const item = availableGear.find((g) => g.id === row.gear_item_id);
      if (!item) continue;
      const linePrice = parseFloat(item.price_per_day);
      const subtotal = linePrice * n * row.quantity;
      grPrice += subtotal;
      lines.push({
        gear_item_id: item.id,
        name: item.name,
        unit: linePrice,
        qty: row.quantity,
        subtotal,
      });
    }

    return {
      nights:
        selectedRoomId !== null
          ? Math.max(n, 1)
          : campsite.price_unit === 'entrance'
            ? 0
            : n,
      campsitePrice: cPrice,
      guidePrice: gPrice,
      gearPrice: grPrice,
      gearLines: lines,
      pricingLineRows,
      totalPrice: cPrice + gPrice + grPrice,
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
    availableGuides,
    selectedGuideId,
    availableGear,
    selectedGear,
    selectedRoomId,
  ]);

  const handleSubmit = async () => {
    if (!campsite) return;

    // Simple client-side validation
    if (checkIn >= checkOut) {
      Alert.alert('Invalid dates', 'Check-out must be after check-in.');
      return;
    }
    if (selectedRoom && effectiveGuests > selectedRoom.capacity) {
      Alert.alert(
        'Too many guests',
        `This room allows up to ${selectedRoom.capacity} guests.`,
      );
      return;
    }
    if (!selectedRoom && effectiveGuests > campsite.capacity) {
      Alert.alert(
        'Too many guests',
        `This campsite allows up to ${campsite.capacity} guests.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: Parameters<typeof bookings.create>[0] = {
        campsite_id: campsite.id,
        room_campsite_id: selectedRoomId ?? undefined,
        tour_guide_id: selectedGuideId ?? undefined,
        check_in: checkIn,
        check_out: checkOut,
        guests: effectiveGuests,
        notes: notes.trim() || undefined,
      };

      if (isDetailed) {
        payload.adults = adults;
        payload.children = children;
        payload.seniors = seniors;
        payload.pwd = pwd;

        // Only send selected optional lines. Mandatory lines are
        // auto-included server-side. quantity is required by backend
        // validation for every row; only per_tent uses it as a multiplier.
        const selectedRows = campsite.pricing_lines
          ?.filter(
            (line) => line.is_optional && selectedPricingLines[line.id],
          )
          .map((line) => ({
            pricing_line_id: line.id,
            quantity: selectedPricingLines[line.id] ?? 1,
          }));
        if (selectedRows && selectedRows.length > 0) {
          payload.pricing_lines = selectedRows;
        }
      }

      if (selectedGear.length > 0) {
        payload.gear_items = selectedGear.map((row) => ({
          gear_item_id: row.gear_item_id,
          quantity: row.quantity,
        }));
        payload.gear_start_date = checkIn;
        payload.gear_end_date = checkOut;
      }

      const res = await bookings.create(payload);
      const newBookingId = res.data.id;

      router.replace(`/booking/${newBookingId}/confirmed` as any);
    } catch (err: any) {
      const data = err.response?.data;
      const message =
        Object.values(data?.errors || {}).flat()[0] as string ??
        data?.message ??
        err.message ??
        'Could not create booking.';
      Alert.alert('Booking failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gearupGreen} />
      </View>
    );
  }

  if (!campsite) return null;

  const selectedRoom =
    selectedRoomId !== null
      ? campsite.children?.find((c) => c.id === selectedRoomId) ?? null
      : null;

  const maxGuests = selectedRoom?.capacity ?? campsite.capacity;

  const renderGearRow = (g: GearItem) => {
    const price = parseFloat(g.price_per_day);
    const row = selectedGear.find((r) => r.gear_item_id === g.id);
    const active = !!row;
    return (
      <View
        key={g.id}
        style={[styles.gearRow, active && styles.gearRowActive]}
      >
        <TouchableOpacity
          style={styles.gearCheckRow}
          onPress={() => toggleGear(g.id)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={active ? 'checkbox' : 'square-outline'}
            size={22}
            color={active ? colors.gearupGreen : '#9ca3af'}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.guideRow}>
              <Text style={styles.guideName}>{g.name}</Text>
              <Text style={styles.guidePrice}>
                +PHP {price.toFixed(0)}/day
              </Text>
            </View>
            <Text style={styles.guideDesc} numberOfLines={2}>
              {g.category} - {g.stock} in stock
              {g.description ? ` - ${g.description}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {active && row && (
          <View style={styles.gearQtyRow}>
            <Text style={styles.hint}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setGearQty(g.id, Math.max(1, row.quantity - 1))
                }
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={colors.gearupGreen}
                />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{row.quantity}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() =>
                  setGearQty(g.id, Math.min(g.stock, row.quantity + 1))
                }
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={colors.gearupGreen}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar with back */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>New Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campsite summary */}
        <View style={styles.campsiteCard}>
          <Image
            source={{ uri: imgSrc(campsite.image_url) }}
            style={styles.campsiteImage}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.campsiteName} numberOfLines={1}>
              {campsite.name}
            </Text>
            <Text style={styles.campsiteLocation} numberOfLines={1}>
              📍 {campsite.location}
            </Text>
            <Text style={styles.campsitePrice}>
              ₱{campsite.price_per_night} / {campsite.price_unit}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <Text style={styles.sectionTitle}>Dates</Text>
        <View style={styles.fieldCard}>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowPicker('checkIn')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.dateRowLabel}>CHECK-IN</Text>
              <Text style={styles.dateRowValue}>{formatDateLabel(checkIn)}</Text>
            </View>
            <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowPicker('checkOut')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.dateRowLabel}>CHECK-OUT</Text>
              <Text style={styles.dateRowValue}>{formatDateLabel(checkOut)}</Text>
            </View>
            <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={isoToDate(showPicker === 'checkIn' ? checkIn : checkOut)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={
              showPicker === 'checkIn'
                ? new Date()
                : isoToDate(checkIn)
            }
            onValueChange={(event, date) => {
              if (Platform.OS === 'android') setShowPicker(null);
              if (!date) return;
              const iso = toDateString(date);
              if (showPicker === 'checkIn') {
                setCheckIn(iso);
                if (iso >= checkOut) {
                  setCheckOut(toDateString(addDays(date, 1)));
                }
              } else {
                setCheckOut(iso);
              }
            }}
            onDismiss={() => setShowPicker(null)}
          />
        )}

        {/* Accommodation picker */}
        {campsite.children && campsite.children.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Accommodation</Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[
                  styles.guideOption,
                  selectedRoomId === null && styles.guideOptionActive,
                ]}
                onPress={() => setSelectedRoomId(null)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    selectedRoomId === null
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={20}
                  color={
                    selectedRoomId === null
                      ? colors.gearupGreen
                      : '#9ca3af'
                  }
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.guideRow}>
                    <Text style={styles.guideName}>Camping spot</Text>
                    <Text style={styles.guidePrice}>
                      {campsite.price_unit === 'entrance'
                        ? `PHP ${campsite.price_per_night} / entrance`
                        : `PHP ${campsite.price_per_night} / night`}
                    </Text>
                  </View>
                  <Text style={styles.guideDesc}>
                    Up to {campsite.capacity} guests.
                  </Text>
                </View>
              </TouchableOpacity>

              {campsite.children.map((room) => {
                const active = selectedRoomId === room.id;
                return (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.guideOption,
                      active && styles.guideOptionActive,
                    ]}
                    onPress={() => setSelectedRoomId(room.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={active ? colors.gearupGreen : '#9ca3af'}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.guideRow}>
                        <Text style={styles.guideName}>{room.name}</Text>
                        <Text style={styles.guidePrice}>
                          PHP {room.price_per_night} / night
                        </Text>
                      </View>
                      <Text style={styles.guideDesc} numberOfLines={2}>
                        {room.description ? `${room.description} - ` : ''}
                        Up to {room.capacity}{' '}
                        {room.capacity === 1 ? 'guest' : 'guests'}.
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Guests */}
        <Text style={styles.sectionTitle}>Guests</Text>
        {isDetailed && selectedRoomId === null ? (
          <View style={styles.fieldCard}>
            {[
              {
                key: 'adults' as const,
                label: 'Adults',
                value: adults,
                setter: setAdults,
                min: 1,
              },
              {
                key: 'children' as const,
                label: 'Children',
                value: children,
                setter: setChildren,
                min: 0,
              },
              {
                key: 'seniors' as const,
                label: 'Seniors',
                value: seniors,
                setter: setSeniors,
                min: 0,
              },
              {
                key: 'pwd' as const,
                label: 'PWD',
                value: pwd,
                setter: setPwd,
                min: 0,
              },
            ].map((row) => {
              const atMax = effectiveGuests >= maxGuests;
              const canDec = row.value > row.min;
              const canInc = !atMax;
              return (
                <View key={row.key} style={styles.stepperRow}>
                  <Text style={styles.fieldLabel}>{row.label}</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={[
                        styles.stepperButton,
                        !canDec && { opacity: 0.4 },
                      ]}
                      onPress={() =>
                        row.setter(Math.max(row.min, row.value - 1))
                      }
                      disabled={!canDec}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={colors.gearupGreen}
                      />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{row.value}</Text>
                    <TouchableOpacity
                      style={[
                        styles.stepperButton,
                        !canInc && { opacity: 0.4 },
                      ]}
                      onPress={() => row.setter(row.value + 1)}
                      disabled={!canInc}
                    >
                      <Ionicons
                        name="add"
                        size={20}
                        color={colors.gearupGreen}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <Text style={styles.hint}>
              Total: {effectiveGuests} of {maxGuests} max
            </Text>
          </View>
        ) : (
          <View style={styles.fieldCard}>
            <View style={styles.stepperRow}>
              <View>
                <Text style={styles.fieldLabel}>Number of guests</Text>
                <Text style={styles.hint}>
                  {selectedRoom
                    ? `Max ${selectedRoom.capacity} for this room`
                    : `Max ${campsite.capacity} for this campsite`}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setGuests((g) => Math.max(1, g - 1))}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={colors.gearupGreen}
                  />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{guests}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={colors.gearupGreen}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Optional pricing add-ons (detailed mode) */}
        {isDetailed &&
          selectedRoomId === null &&
          campsite.pricing_lines &&
          campsite.pricing_lines.some((l) => l.is_optional) && (
            <>
              <Text style={styles.sectionTitle}>Optional add-ons</Text>
              <View style={styles.fieldCard}>
                {campsite.pricing_lines
                  .filter((l) => l.is_optional)
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((line) => {
                    const selected = !!selectedPricingLines[line.id];
                    const amount = parseFloat(line.amount);
                    const qty = selectedPricingLines[line.id] ?? 1;
                    const isPerTent = line.unit === 'per_tent';
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
                      <View
                        key={line.id}
                        style={[
                          styles.addOnRow,
                          selected && styles.addOnRowActive,
                        ]}
                      >
                        <TouchableOpacity
                          onPress={toggle}
                          style={styles.addOnHeader}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={
                              selected
                                ? 'checkbox'
                                : 'square-outline'
                            }
                            size={22}
                            color={
                              selected
                                ? colors.gearupGreen
                                : colors.textMuted
                            }
                          />
                          <View style={styles.addOnTextWrap}>
                            <Text style={styles.addOnLabel}>
                              {line.label}
                            </Text>
                            {line.description ? (
                              <Text style={styles.addOnDesc}>
                                {line.description}
                              </Text>
                            ) : null}
                            <Text style={styles.addOnPrice}>
                              +PHP {amount.toFixed(0)} {unitLabel}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {selected && isPerTent && (
                          <View style={styles.addOnQtyRow}>
                            <Text style={styles.hint}>Quantity</Text>
                            <View style={styles.stepper}>
                              <TouchableOpacity
                                style={[
                                  styles.stepperButton,
                                  qty <= 1 && { opacity: 0.4 },
                                ]}
                                onPress={() => setQty(qty - 1)}
                                disabled={qty <= 1}
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color={colors.gearupGreen}
                                />
                              </TouchableOpacity>
                              <Text style={styles.stepperValue}>{qty}</Text>
                              <TouchableOpacity
                                style={styles.stepperButton}
                                onPress={() => setQty(qty + 1)}
                              >
                                <Ionicons
                                  name="add"
                                  size={16}
                                  color={colors.gearupGreen}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            </>
          )}

        {/* Notes */}
        {/* Preferred Arrival Time — only for rooms */}
        {selectedRoomId !== null && (
          <>
            <Text style={styles.sectionTitle}>Preferred Arrival Time</Text>
            <View style={[styles.fieldCard, { flexDirection: "row", gap: 8 }]}>
              {["Morning", "Afternoon", "Evening"].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: preferredArrival === slot ? colors.gearupGreen : "#e5e7eb",
                    backgroundColor: preferredArrival === slot ? colors.gearup50 : "#fff",
                    alignItems: "center",
                  }}
                  onPress={() => setPreferredArrival(slot)}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: preferredArrival === slot ? colors.gearupGreen : "#6b7280" }}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <View style={styles.fieldCard}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything the host should know?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>
        {/* Tour guide picker — hidden when a room is selected */}
        {selectedRoomId === null && availableGuides.length > 0 && (
  <View>
    <Text style={styles.sectionTitle}>
      Add a tour guide? (optional)
    </Text>
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        style={[
          styles.guideOption,
          selectedGuideId === null && styles.guideOptionActive,
        ]}
        onPress={() => setSelectedGuideId(null)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={selectedGuideId === null ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selectedGuideId === null ? colors.gearupGreen : '#9ca3af'}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.guideName}>No guide</Text>
          <Text style={styles.guideDesc}>Just book the campsite.</Text>
        </View>
      </TouchableOpacity>

      {(() => {
        const campsiteGuides = availableGuides.filter(
          (g) => g.campsite_id !== null,
        );
        const independentGuides = availableGuides.filter(
          (g) => g.campsite_id === null,
        );

        const renderRow = (g: (typeof availableGuides)[number]) => {
          const price = parseFloat(g.price_per_trip);
          const active = selectedGuideId === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.guideOption,
                active && styles.guideOptionActive,
              ]}
              onPress={() => setSelectedGuideId(g.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={active ? colors.gearupGreen : '#9ca3af'}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.guideRow}>
                  <Text style={styles.guideName}>{g.name}</Text>
                  <Text style={styles.guidePrice}>
                    {price > 0 ? `+₱${price.toFixed(0)}` : 'Free'}
                  </Text>
                </View>
                {g.description && (
                  <Text style={styles.guideDesc} numberOfLines={2}>
                    {g.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        };

        return (
          <>
            {campsiteGuides.length > 0 && (
              <>
                <Text style={styles.gearSectionLabel}>
                  Guides at this campsite
                </Text>
                <View style={{ gap: 8 }}>
                  {campsiteGuides.map(renderRow)}
                </View>
              </>
            )}
            {independentGuides.length > 0 && (
              <>
                <Text style={styles.gearSectionLabel}>
                  Independent guides (available anywhere)
                </Text>
                <View style={{ gap: 8 }}>
                  {independentGuides.map(renderRow)}
                </View>
              </>
            )}
          </>
        );
      })()}
    </View>
  </View>
)}

                       {/* Gear picker — hidden when a room is selected */}
        {selectedRoomId === null && (ownerGear.length > 0 || individualGear.length > 0) && (
          <View>
            <Text style={styles.sectionTitle}>
              Add gear to your trip? (optional)
            </Text>

            {ownerGear.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.gearSectionLabel}>
                  Provided by this campsite
                </Text>
                <View style={{ gap: 8 }}>
                  {ownerGear.map((g) => renderGearRow(g))}
                </View>
              </View>
            )}

            {individualGear.length > 0 && (
              <View>
                <Text style={styles.gearSectionLabel}>
                  From individuals
                </Text>
                <View style={{ gap: 8 }}>
                  {individualGear.map((g) => renderGearRow(g))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Price summary */}
                <View style={styles.summary}>
          {selectedRoom ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {selectedRoom.name}: PHP {selectedRoom.price_per_night} x{' '}
                {nights} {nights === 1 ? 'night' : 'nights'}
              </Text>
              <Text style={styles.summaryValue}>
                PHP {campsitePrice.toFixed(2)}
              </Text>
            </View>
          ) : isDetailed ? (
            pricingLineRows.length > 0 ? (
              <>
                {pricingLineRows.map((row) => (
                  <View key={row.id} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {row.label}
                      {row.qty !== 1 ? ` x ${row.qty}` : ''}
                      {` x PHP ${row.amount.toFixed(2)}`}
                    </Text>
                    <Text style={styles.summaryValue}>
                      PHP {row.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#b91c1c' }]}>
                  Select at least one add-on to continue.
                </Text>
              </View>
            )
          ) : (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {campsite.price_unit === 'entrance'
                  ? `Campsite: PHP ${campsite.price_per_night} x ${guests} ${guests === 1 ? 'guest' : 'guests'}`
                  : `Campsite: PHP ${campsite.price_per_night} x ${nights} ${nights === 1 ? 'night' : 'nights'} x ${guests} ${guests === 1 ? 'guest' : 'guests'}`}
              </Text>
              <Text style={styles.summaryValue}>
                PHP {campsitePrice.toFixed(2)}
              </Text>
            </View>
          )}

                    {selectedGuideId !== null && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Guide: {availableGuides.find((g) => g.id === selectedGuideId)?.name}
              </Text>
              <Text style={styles.summaryValue}>
                ₱{guidePrice.toFixed(2)}
              </Text>
            </View>
          )}

                    {gearLines.map((line) => (
            <View key={line.gear_item_id} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {line.name}: PHP {line.unit.toFixed(2)} x {nights}{' '}
                {nights === 1 ? 'day' : 'days'} x {line.qty}
              </Text>
              <Text style={styles.summaryValue}>
                PHP {line.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              ₱{totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
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
  backButton: { padding: 4 },
  topBarTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  scrollContent: { padding: 20, gap: 12 },

  campsiteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    marginBottom: 8,
  },
  campsiteImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  campsiteName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  campsiteLocation: { fontSize: 12, color: colors.textMuted },
  campsitePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginLeft: 4,
  },

  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldLabel: { fontSize: 14, color: '#111827', fontWeight: '600' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateRowLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gearupGreen,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    marginTop: 4,
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.gearupGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    minWidth: 24,
    textAlign: 'center',
  },

  // Optional pricing-line add-ons
  addOnRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  addOnRowActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  addOnHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addOnTextWrap: {
    flex: 1,
  },
  addOnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  addOnDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addOnPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gearupGreen,
    marginTop: 4,
  },
  addOnQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },

  notesInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 70,
    textAlignVertical: 'top',
    padding: 0,
  },

  // Tour guide picker
  guideOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  guideOptionActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  guideName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  guidePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gearupGreen,
  },
  guideDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },

  gearSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 6,
  },
  gearRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  gearRowActive: {
    borderColor: colors.gearupGreen,
    backgroundColor: colors.gearup50,
  },
  gearCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  gearQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },

  // Price summary
  summary: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    paddingRight: 8,
  },
  summaryValue: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#86efac',
    marginVertical: 10,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532d',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14532d',
  },

  submitButton: {
    backgroundColor: colors.gearupGreen,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
