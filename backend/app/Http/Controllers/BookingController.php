<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Campsite;
use App\Models\GearItem;
use App\Models\TourGuide;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Booking::with([
                'campsite',
                'roomCampsite',
                'tourGuide',
                'gearItem',
                'gearItems',
                'bookingPricingLines.pricingLine',
                'review',
            ])
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
            'room_campsite_id' => ['nullable', 'integer', 'exists:campsites,id'],
            'tour_guide_id' => ['nullable', 'integer', 'exists:tour_guides,id'],
            'gear_item_id' => ['nullable', 'integer', 'exists:gear_items,id'],
            'check_in' => ['nullable', 'date', 'after_or_equal:today'],
            'check_out' => ['nullable', 'date', 'after:check_in'],
            'gear_start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'gear_end_date' => ['nullable', 'date', 'after:gear_start_date'],
            'gear_quantity' => ['nullable', 'integer', 'min:1'],
            'gear_items' => ['nullable', 'array'],
            'gear_items.*.gear_item_id' => ['required', 'integer', 'exists:gear_items,id'],
            'gear_items.*.quantity' => ['required', 'integer', 'min:1'],
            'guests' => ['required', 'integer', 'min:1'],
            'adults' => ['nullable', 'integer', 'min:0'],
            'children' => ['nullable', 'integer', 'min:0'],
            'seniors' => ['nullable', 'integer', 'min:0'],
            'pwd' => ['nullable', 'integer', 'min:0'],
            'pricing_lines' => ['nullable', 'array'],
            'pricing_lines.*.pricing_line_id' => ['required', 'integer', 'exists:pricing_lines,id'],
            'pricing_lines.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $hasMultiGear = !empty($data['gear_items']);

        if (
            empty($data['campsite_id']) &&
            empty($data['tour_guide_id']) &&
            empty($data['gear_item_id']) &&
            !$hasMultiGear
        ) {
            throw ValidationException::withMessages([
                'campsite_id' => [
                    'You must book a campsite, tour guide, or gear item.',
                ],
            ]);
        }

        $campsite = null;
        $roomCampsite = null;
        $tourGuide = null;
        $gearItem = null;
        $campsitePrice = 0;
        $guidePrice = 0;
        $gearPrice = 0;

        /**
         * Multi-gear lines for campsite bookings. Each entry:
         *   ['gear_item_id' => int, 'quantity' => int, 'price_per_day' => float, 'subtotal' => float]
         * Legacy single-gear (gear_item_id + gear_quantity) is preserved below.
         */
        $gearLines = [];

        /**
         * Snapshot of pricing lines applied to this booking (detailed mode only).
         * Each entry: ['pricing_line_id' => int, 'quantity' => int, 'amount' => float, 'subtotal' => float]
         */
        $pricingLineSnapshots = [];

                // ─── Campsite or Room pricing ──────────────────────
        if (!empty($data['campsite_id'])) {
            $campsite = Campsite::findOrFail($data['campsite_id']);

            if (!$campsite->is_available) {
                throw ValidationException::withMessages([
                    'campsite_id' => [
                        'This campsite is currently unavailable for booking.',
                    ],
                ]);
            }

            if (empty($data['check_in']) || empty($data['check_out'])) {
                throw ValidationException::withMessages([
                    'check_in' => [
                        'Check-in and check-out dates are required when booking a campsite.',
                    ],
                ]);
            }

            $start = new \DateTime($data['check_in']);
            $end = new \DateTime($data['check_out']);
            $nights = max(1, $start->diff($end)->days);

            if (!empty($data['room_campsite_id'])) {
                // ── Room variant booking ───────────────────
                // The room is a sub-listing of the parent campsite.
                // Overlap + capacity checks run against the ROOM, not
                // the parent. Pricing uses the room's own rate.
                $roomCampsite = Campsite::findOrFail($data['room_campsite_id']);

                if ((int) $roomCampsite->parent_campsite_id !== (int) $campsite->id) {
                    throw ValidationException::withMessages([
                        'room_campsite_id' => [
                            'That room is not part of the selected campsite.',
                        ],
                    ]);
                }

                if ($data['guests'] > $roomCampsite->capacity) {
                    throw ValidationException::withMessages([
                        'guests' => [
                            "This room allows a maximum of {$roomCampsite->capacity} guests.",
                        ],
                    ]);
                }

                $existingGuests = (int) Booking::where('room_campsite_id', $roomCampsite->id)
                    ->whereNotIn('status', ['cancelled'])
                    ->where(function ($q) use ($data) {
                        $q->where('check_in', '<', $data['check_out'])
                          ->where('check_out', '>', $data['check_in']);
                    })
                    ->sum('guests');

                $remaining = $roomCampsite->capacity - $existingGuests;

                if ($data['guests'] > $remaining) {
                    $msg = $remaining > 0
                        ? "This room only has {$remaining} spot"
                            . ($remaining === 1 ? '' : 's')
                            . " left for those dates."
                        : 'This room is fully booked for those dates.';

                    throw ValidationException::withMessages([
                        'guests' => [$msg],
                    ]);
                }

                // Room pricing: per-room per-night. Guests is a limit,
                // not a multiplier.
                $campsitePrice = (float) $roomCampsite->price_per_night * $nights;
            } else {
                // ── Standard campsite booking (no room) ──────────────
                if ($data['guests'] > $campsite->capacity) {
                    throw ValidationException::withMessages([
                        'guests' => [
                            "This campsite allows a maximum of {$campsite->capacity} guests.",
                        ],
                    ]);
                }

                $existingGuests = (int) Booking::where('campsite_id', $campsite->id)
                    ->whereNull('room_campsite_id')
                    ->whereNotIn('status', ['cancelled'])
                    ->where(function ($q) use ($data) {
                        $q->where('check_in', '<', $data['check_out'])
                          ->where('check_out', '>', $data['check_in']);
                    })
                    ->sum('guests');

                $remaining = $campsite->capacity - $existingGuests;

                if ($data['guests'] > $remaining) {
                    $msg = $remaining > 0
                        ? "This campsite only has {$remaining} spot"
                            . ($remaining === 1 ? '' : 's')
                            . " left for those dates."
                        : 'This campsite is fully booked for those dates.';

                    throw ValidationException::withMessages([
                        'guests' => [$msg],
                    ]);
                }

                if ($campsite->pricing_mode === 'detailed') {
                    // ── Detailed mode: itemized pricing lines ─────────
                    $pricingLineSnapshots = $this->computeDetailedPricing(
                        $campsite,
                        $data,
                        $nights,
                    );
                    $campsitePrice = array_sum(
                        array_column($pricingLineSnapshots, 'subtotal')
                    );
                } else {
                    // ── Simple mode: existing behavior ────────────────
                    $campsitePrice = $campsite->price_unit === 'entrance'
                        ? (float) $campsite->price_per_night * $data['guests']
                        : (float) $campsite->price_per_night * $nights * $data['guests'];
                }
            }
        }

        // ── Tour guide pricing ──────────────────────────
        if (!empty($data['tour_guide_id'])) {
            $tourGuide = TourGuide::findOrFail($data['tour_guide_id']);

            if ($campsite && $tourGuide->campsite_id && $tourGuide->campsite_id !== $campsite->id) {
                throw ValidationException::withMessages([
                    'tour_guide_id' => [
                        'That tour guide is not available for this campsite.',
                    ],
                ]);
            }

            $guidePrice = (float) $tourGuide->price_per_trip;
        }

        // ── Gear pricing ────────────────────────────────
        if (!empty($data['gear_item_id'])) {
            $gearItem = GearItem::findOrFail($data['gear_item_id']);

            $qty = $data['gear_quantity'] ?? 1;

            if (!$gearItem->is_available) {
                throw ValidationException::withMessages([
                    'gear_item_id' => ['That gear item is not currently available.'],
                ]);
            }

            if ($gearItem->stock < $qty) {
                throw ValidationException::withMessages([
                    'gear_quantity' => [
                        "Only {$gearItem->stock} of this item left in stock.",
                    ],
                ]);
            }

            // Determine rental dates — fall back to campsite dates if not given
            $gStart = $data['gear_start_date'] ?? $data['check_in'] ?? null;
            $gEnd = $data['gear_end_date'] ?? $data['check_out'] ?? null;

            if (!$gStart || !$gEnd) {
                throw ValidationException::withMessages([
                    'gear_start_date' => [
                        'Rental dates are required when renting gear.',
                    ],
                ]);
            }

            $gs = new \DateTime($gStart);
            $ge = new \DateTime($gEnd);
            $days = max(1, $gs->diff($ge)->days);

            $gearPrice = (float) $gearItem->price_per_day * $days * $qty;
        }

        // ── Multi-gear pricing (campsite bookings) ─────────────────
        // Gear dates are the campsite's check_in/check_out.
        if ($hasMultiGear) {
            if (!$campsite) {
                throw ValidationException::withMessages([
                    'gear_items' => [
                        'Multiple gear items are only supported on campsite bookings.',
                    ],
                ]);
            }

            // Merge duplicate gear_item_ids into a single line (Q1 default = (a))
            $merged = [];
            foreach ($data['gear_items'] as $row) {
                $gid = (int) $row['gear_item_id'];
                $qty = (int) $row['quantity'];
                if (isset($merged[$gid])) {
                    $merged[$gid] += $qty;
                } else {
                    $merged[$gid] = $qty;
                }
            }

            $gs = new \DateTime($data['check_in']);
            $ge = new \DateTime($data['check_out']);
            $days = max(1, $gs->diff($ge)->days);

            foreach ($merged as $gid => $qty) {
                $item = GearItem::findOrFail($gid);

                if (!$item->is_available) {
                    throw ValidationException::withMessages([
                        'gear_items' => [
                            "{$item->name} is not currently available.",
                        ],
                    ]);
                }

                if ($item->stock < $qty) {
                    throw ValidationException::withMessages([
                        'gear_items' => [
                            "Only {$item->stock} of {$item->name} left in stock.",
                        ],
                    ]);
                }

                $linePrice = (float) $item->price_per_day;
                $subtotal = $linePrice * $days * $qty;
                $gearLines[] = [
                    'gear_item_id' => $item->id,
                    'quantity' => $qty,
                    'price_per_day' => $linePrice,
                    'subtotal' => $subtotal,
                ];

                $gearPrice += $subtotal;
            }
        }

        $total = $campsitePrice + $guidePrice + $gearPrice;

        $booking = DB::transaction(function () use ($data, $request, $campsite, $roomCampsite, $tourGuide, $gearItem, $gearLines, $pricingLineSnapshots, $total) {
            $adults = (int) ($data['adults'] ?? $data['guests']);
            $children = (int) ($data['children'] ?? 0);
            $seniors = (int) ($data['seniors'] ?? 0);
            $pwd = (int) ($data['pwd'] ?? 0);

            // If guest categories were provided, derive 'guests' from them
            // so simple-mode bookings with categories stay consistent.
            $guestsTotal = $adults + $children + $seniors + $pwd;
            if ($guestsTotal > 0 && $guestsTotal !== (int) $data['guests']) {
                $data['guests'] = $guestsTotal;
            }

            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'campsite_id' => $campsite?->id,
                'room_campsite_id' => $roomCampsite?->id,
                'tour_guide_id' => $tourGuide?->id,
                'gear_item_id' => $gearItem?->id,
                'check_in' => $data['check_in'] ?? null,
                'check_out' => $data['check_out'] ?? null,
                'gear_start_date' => $data['gear_start_date'] ?? $data['check_in'] ?? null,
                'gear_end_date' => $data['gear_end_date'] ?? $data['check_out'] ?? null,
                'gear_quantity' => $gearItem ? ($data['gear_quantity'] ?? 1) : null,
                'guests' => $data['guests'],
                'adults' => $adults,
                'children' => $children,
                'seniors' => $seniors,
                'pwd' => $pwd,
                'total_price' => $total,
                'status' => 'pending',
                'guide_status' => $tourGuide ? 'pending' : null,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($gearLines as $line) {
                $booking->gearItems()->attach($line['gear_item_id'], [
                    'quantity' => $line['quantity'],
                    'price_per_day' => $line['price_per_day'],
                    'subtotal' => $line['subtotal'],
                ]);
            }

            foreach ($pricingLineSnapshots as $snap) {
                $booking->bookingPricingLines()->create($snap);
            }

            return $booking;
        });

        $this->notifyBookingCreated($booking);

        return response()->json(
            $booking->load(['campsite', 'roomCampsite', 'tourGuide', 'gearItem', 'gearItems']),
            201
        );
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        return response()->json(
            $booking->load([
                'campsite',
                'roomCampsite',
                'tourGuide',
                'gearItem',
                'gearItems',
                'bookingPricingLines.pricingLine',
                'review',
            ])
        );
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json(
            $booking->load(['campsite', 'roomCampsite', 'tourGuide', 'gearItem', 'gearItems'])
        );
    }

        /**
     * Compute pricing line subtotals for a detailed-mode campsite booking.
     * Returns array of snapshots ready to persist via bookingPricingLines().
     */
    private function computeDetailedPricing(Campsite $campsite, array $data, int $nights): array
    {
        $pricingLines = $campsite->pricingLines()->get();

        if ($pricingLines->isEmpty()) {
            throw ValidationException::withMessages([
                'pricing_lines' => [
                    'This campsite has no pricing lines configured.',
                ],
            ]);
        }

        $adults = (int) ($data['adults'] ?? $data['guests']);
        $children = (int) ($data['children'] ?? 0);
        $seniors = (int) ($data['seniors'] ?? 0);
        $pwd = (int) ($data['pwd'] ?? 0);
        $allGuests = $adults + $children + $seniors + $pwd;

        // Map the request's selected optional lines by pricing_line_id
        $selectedOptional = [];
        foreach ($data['pricing_lines'] ?? [] as $row) {
            $selectedOptional[(int) $row['pricing_line_id']] = (int) $row['quantity'];
        }

        $snapshots = [];

        foreach ($pricingLines as $line) {
            // Determine quantity (for per_tent lines) and whether to include
            $qty = 1;
            $include = true;

            if ($line->is_optional) {
                if (!isset($selectedOptional[$line->id])) {
                    $include = false;
                } else {
                    $qty = $selectedOptional[$line->id];
                }
            } elseif ($line->unit === 'per_tent') {
                // Non-optional per_tent line — assume 1 tent by default
                $qty = 1;
            }

            if (!$include) {
                continue;
            }

            $amount = (float) $line->amount;
            $subtotal = 0;

            switch ($line->unit) {
                case 'per_person':
                    $multiplier = match ($line->applies_to) {
                        'adult' => $adults,
                        'child' => $children,
                        'senior' => $seniors,
                        'pwd' => $pwd,
                        default => $allGuests,
                    };
                    $subtotal = $amount * $multiplier;
                    break;

                case 'per_tent':
                    $subtotal = $amount * $qty;
                    break;

                case 'per_night':
                    $subtotal = $amount * $nights;
                    break;

                case 'flat':
                default:
                    $subtotal = $amount;
                    break;
            }

            $snapshots[] = [
                'pricing_line_id' => $line->id,
                'quantity' => $qty,
                'amount' => $amount,
                'subtotal' => $subtotal,
            ];
        }

        if (empty($snapshots)) {
            throw ValidationException::withMessages([
                'pricing_lines' => [
                    'At least one pricing line must apply to this booking.',
                ],
            ]);
        }

        return $snapshots;
    }


        /**
     * Notify the owner (campsite/gear/tour-guide) of a new booking.
     */
    private function notifyBookingCreated(Booking $booking): void
    {
        $actorId = $booking->user_id;

        // Campsite owner notification
        if ($booking->campsite_id) {
            $booking->loadMissing('campsite');
            $ownerId = $booking->campsite?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'booking.created',
                    'New campsite booking',
                    "Booking #{$booking->id} for {$booking->campsite->name}",
                    '/owner/bookings',
                );
            }
        }

        // Tour guide owner notification (only when no campsite owner was notified)
        if (!$booking->campsite_id && $booking->tour_guide_id) {
            $booking->loadMissing('tourGuide.campsite');
            $ownerId = $booking->tourGuide?->campsite?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'booking.created',
                    'New tour guide booking',
                    "Booking #{$booking->id} for {$booking->tourGuide->name}",
                    '/owner/bookings',
                );
            }
        }

        // Independent guide notification — the guide's own user account
        if ($booking->tour_guide_id) {
            $booking->loadMissing('tourGuide');
            $guideUserId = $booking->tourGuide?->user_id;
            if ($guideUserId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $guideUserId,
                    'guide.booking.created',
                    'New tour guide booking',
                    "Booking #{$booking->id} — you've been hired",
                    '/guide',
                );
            }
        }

        // Legacy single-gear notification (standalone gear rental flow)
        if ($booking->gear_item_id) {
            $booking->loadMissing('gearItem');
            $ownerId = $booking->gearItem?->owner_id;
            if ($ownerId) {
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'gear.rented',
                    'Your gear was rented',
                    "Booking #{$booking->id} for {$booking->gearItem->name}",
                    '/my-gear/bookings',
                );
            }
        }

        // Multi-gear notification: one per gear owner, summarized (Q3 default = (a))
        $booking->loadMissing('gearItems');
        if ($booking->gearItems->isNotEmpty()) {
            $byOwner = [];
            foreach ($booking->gearItems as $item) {
                $byOwner[$item->owner_id][] = $item->name;
            }

            foreach ($byOwner as $ownerId => $names) {
                $count = count($names);
                $label = $count === 1
                    ? $names[0]
                    : "{$count} gear items";
                NotificationService::notifyOthers(
                    $actorId,
                    $ownerId,
                    'gear.rented',
                    'Your gear was rented',
                    "Booking #{$booking->id} includes {$label}",
                    '/my-gear/bookings',
                );
            }
        }
    }
}