<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Campsite;
use App\Models\PricingLine;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PricingLineController extends Controller
{
    /**
     * GET /api/owner/campsites/{campsite}/pricing-lines
     */
    public function index(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        return response()->json(
            $campsite->pricingLines()->get()
        );
    }

    /**
     * POST /api/owner/campsites/{campsite}/pricing-lines
     */
    public function store(Request $request, Campsite $campsite)
    {
        $this->authorizeOwner($request, $campsite);

        $data = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', Rule::in(['per_person', 'per_tent', 'per_night', 'flat'])],
            'applies_to' => ['sometimes', Rule::in(['any', 'adult', 'child', 'senior', 'pwd'])],
            'is_optional' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $line = $campsite->pricingLines()->create([
            'label' => $data['label'],
            'amount' => $data['amount'],
            'unit' => $data['unit'],
            'applies_to' => $data['applies_to'] ?? 'any',
            'is_optional' => $data['is_optional'] ?? false,
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json($line, 201);
    }

    /**
     * PUT /api/owner/pricing-lines/{pricingLine}
     */
    public function update(Request $request, PricingLine $pricingLine)
    {
        $this->authorizeOwner($request, $pricingLine->campsite);

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'unit' => ['sometimes', Rule::in(['per_person', 'per_tent', 'per_night', 'flat'])],
            'applies_to' => ['sometimes', Rule::in(['any', 'adult', 'child', 'senior', 'pwd'])],
            'is_optional' => ['sometimes', 'boolean'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $pricingLine->update($data);

        return response()->json($pricingLine->fresh());
    }

    /**
     * DELETE /api/owner/pricing-lines/{pricingLine}
     */
    public function destroy(Request $request, PricingLine $pricingLine)
    {
        $this->authorizeOwner($request, $pricingLine->campsite);

        try {
            $pricingLine->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            // Blocked by booking_pricing_lines foreign key
            return response()->json([
                'message' => 'This pricing line has already been used in bookings and cannot be deleted.',
            ], 422);
        }

        return response()->json(['message' => 'Pricing line deleted.']);
    }

    private function authorizeOwner(Request $request, ?Campsite $campsite): void
    {
        if (!$campsite) {
            abort(404, 'Campsite not found.');
        }
        if ($campsite->owner_id !== $request->user()->id) {
            abort(403, 'You do not own this campsite.');
        }
    }
}