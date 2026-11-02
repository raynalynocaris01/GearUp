<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * GET /api/admin/users
     * Optional: ?role=owner&status=pending
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->string('status')->toString() === 'pending') {
            $query->where('is_approved', false);
        }

        if ($request->string('status')->toString() === 'suspended') {
            $query->where('is_suspended', true);
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }

    /**
     * GET /api/admin/users/{user}
     */
    public function show(User $user)
    {
        return response()->json($user);
    }

    /**
     * POST /api/admin/users/{user}/approve
     * Approve a pending OWNER user account.
     *
     * Guides are approved through the Guide Applications review flow —
     * see Admin\GuideApplicationController::approve. This is because
     * guide approval requires seeing the resume, which the Users page
     * does not expose. Allowing approve here would let a guide skip
     * the review process and become bookable without a resume.
     */
    public function approve(User $user)
    {
        if ($user->role === 'guide') {
            return response()->json([
                'message' => 'Guides must be approved through the Guide Applications review page (resume required).',
            ], 422);
        }

        $user->update(['is_approved' => true]);

        // Owners land on the owner dashboard; customers on their bookings.
        $actionUrl = '/owner';
        $message = 'You can now list campsites, gear, and events on GearUp.';

        NotificationService::notify(
            $user->id,
            'account.approved',
            'Your account was approved',
            $message,
            $actionUrl,
        );

        return response()->json($user->fresh());
    }

    /**
     * POST /api/admin/users/{user}/reject
     * Reject a pending OWNER — sends them back to customer.
     *
     * Guides must be rejected via Admin\GuideApplicationController::reject
     * so the rejection reason is recorded and the guide is notified with
     * context.
     */
    public function reject(User $user)
    {
        if ($user->role === 'guide') {
            return response()->json([
                'message' => 'Guides must be rejected through the Guide Applications review page.',
            ], 422);
        }

        $user->update([
            'is_approved' => true,
            'role' => 'customer',
        ]);

        NotificationService::notify(
            $user->id,
            'account.rejected',
            'Your account application was declined',
            'Contact support if you think this was a mistake.',
            null,
        );

        return response()->json($user->fresh());
    }

    /**
     * POST /api/admin/users/{user}/suspend
     */
    public function suspend(User $user)
    {
        if ($user->isAdmin()) {
            abort(403, 'Cannot suspend an admin.');
        }

        $user->update(['is_suspended' => true]);

        // Revoke all their tokens so they can't keep using the app
        $user->tokens()->delete();

        NotificationService::notify(
            $user->id,
            'account.suspended',
            'Your account was suspended',
            'Please contact support for details.',
            null,
        );

        return response()->json($user->fresh());
    }

    /**
     * POST /api/admin/users/{user}/reinstate
     */
    public function reinstate(User $user)
    {
        $user->update(['is_suspended' => false]);

        return response()->json($user->fresh());
    }

    /**
     * PUT /api/admin/users/{user}
     * Change role or other fields.
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['sometimes', Rule::in(['admin', 'owner', 'customer'])],
            'is_approved' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['role']) && $user->isAdmin() && $data['role'] !== 'admin') {
            abort(403, 'Cannot change an admin to another role.');
        }

        $user->update($data);

        return response()->json($user->fresh());
    }
}