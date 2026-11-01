<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\GearItem;
use Illuminate\Http\Request;

class GearItemController extends Controller
{
    /**
     * GET /api/gear
     * Optional: ?category=Tent, ?owner_id=6, ?available=1
     */
    public function index(Request $request)
    {
        $query = GearItem::with('owner:id,name,email,role');

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->integer('owner_id'));
        }

        if ($request->boolean('available')) {
            $query->where('is_available', true)->where('stock', '>', 0);
        }

        $items = $query->orderByDesc('created_at')->get();

        $privileged = $this->privilegedGearIds($request, $items);
        $viewerId = $request->user()?->id;

        $items->each(function (GearItem $item) use ($privileged, $viewerId) {
            $this->applyPickupPrivacy($item, $viewerId, $privileged);
        });

        return response()->json($items);
    }

    /**
     * GET /api/gear/{gearItem}
     */
    public function show(Request $request, GearItem $gearItem)
    {
        $gearItem->load('owner:id,name,email,role');

        $privileged = $this->privilegedGearIds($request, collect([$gearItem]));
        $viewerId = $request->user()?->id;

        $this->applyPickupPrivacy($gearItem, $viewerId, $privileged);

        return response()->json($gearItem);
    }

    /**
     * Determine which of the given gear items the viewer may see full
     * pickup info for. A gear item is "privileged" for the viewer when:
     *   - The viewer is the owner of that gear, OR
     *   - The viewer has a confirmed/completed booking for that gear.
     *
     * Unauthenticated viewers never get privileged access.
     *
     * @param  \Illuminate\Support\Collection<int, GearItem>  $items
     * @return array<int, true>  Map of gear_id => true for privileged items
     */
    private function privilegedGearIds(Request $request, $items): array
    {
        $viewerId = $request->user()?->id;
        if (!$viewerId || $items->isEmpty()) {
            return [];
        }

        $gearIds = $items->pluck('id')->all();
        $privileged = [];

        // Owner of the gear
        foreach ($items as $item) {
            if ((int) $item->owner_id === (int) $viewerId) {
                $privileged[(int) $item->id] = true;
            }
        }

        // Confirmed/completed bookings for any remaining gear
        $bookedIds = Booking::where('user_id', $viewerId)
            ->whereIn('gear_item_id', $gearIds)
            ->whereIn('status', ['confirmed', 'completed'])
            ->pluck('gear_item_id')
            ->all();

        foreach ($bookedIds as $gid) {
            $privileged[(int) $gid] = true;
        }

        return $privileged;
    }

    /**
     * Strip sensitive pickup fields from the gear item when the viewer
     * is not privileged. Always exposes a derived `pickup_city` so the
     * public gear page can still show a geographic hint.
     */
    private function applyPickupPrivacy(GearItem $item, ?int $viewerId, array $privileged): void
    {
        // Derive city regardless of viewer (it's the only geo-hint we
        // expose publicly).
        $item->setAttribute('pickup_city', $this->derivePickupCity($item->pickup_address));

        $isPrivileged = $viewerId !== null && !empty($privileged[(int) $item->id]);

        if (!$isPrivileged) {
            $item->setAttribute('pickup_address', null);
            $item->setAttribute('pickup_landmark', null);
            $item->setAttribute('pickup_instructions', null);
            $item->setAttribute('contact_number', null);
        }
    }

    /**
     * Best-effort city extraction from a free-text pickup address.
     * Assumes the common PH shape "Street, Barangay, City, Province"
     * and returns the second-to-last comma-separated segment.
     */
    private function derivePickupCity(?string $address): ?string
    {
        if (!$address) {
            return null;
        }

        $parts = array_values(array_filter(
            array_map('trim', explode(',', $address)),
            fn ($p) => $p !== ''
        ));

        if (count($parts) < 2) {
            return $parts[0] ?? null;
        }

        return $parts[count($parts) - 2];
    }
}