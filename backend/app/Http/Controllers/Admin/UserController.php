<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
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
     * Approve a pending owner (or any user).
     */
    public function approve(User $user)
    {
        $user->update(['is_approved' => true]);

        return response()->json($user->fresh());
    }

    /**
     * POST /api/admin/users/{user}/reject
     * Reject a pending owner — sends them back to customer.
     */
    public function reject(User $user)
    {
        $user->update([
            'is_approved' => true,
            'role' => 'customer',
        ]);

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