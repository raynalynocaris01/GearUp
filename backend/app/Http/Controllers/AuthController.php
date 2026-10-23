<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'email'        => ['required', 'email', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:8', 'confirmed'],
            'device_name'  => ['required', 'string'],
            'role'         => ['sometimes', 'in:customer,owner,guide'],
            'terms_accepted' => ['required', 'accepted'],
        ]);

        $role = $data['role'] ?? 'customer';

        $user = User::create([
            'name'         => $data['name'],
            'email'        => $data['email'],
            'password'     => $data['password'],
            'role'         => $role,
            'is_approved'  => $role === 'customer', // owners and guides need approval
            'is_suspended' => false,
            'terms_accepted_at' => now(),
        ]);

        if ($role === 'owner' || $role === 'guide') {
            $this->notifyAdminsOfPendingUser($user, $role);
        }

        $token = $user->createToken($data['device_name'])->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
        {
            $data = $request->validate([
                'email'        => ['required', 'email'],
                'password'     => ['required', 'string'],
                'device_name'  => ['required', 'string'],
            ]);

            $user = User::where('email', $data['email'])->first();

            if (! $user || ! Hash::check($data['password'], $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            if ($user->is_suspended) {
                throw ValidationException::withMessages([
                    'email' => ['Your account has been suspended. Contact support.'],
                ]);
            }

            $token = $user->createToken($data['device_name'])->plainTextToken;

            return response()->json([
                'user'  => $user,
                'token' => $token,
            ]);
        }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * POST /api/user/become-guide
     * Upgrade an existing customer account to a tour guide account.
     * Guide status requires admin approval before the profile goes live.
     */
    public function becomeGuide(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'guide') {
            return response()->json([
                'message' => 'You are already a tour guide.',
            ], 400);
        }

        if ($user->role !== 'customer') {
            return response()->json([
                'message' => 'Only customer accounts can become tour guides.',
            ], 400);
        }

        $user->update([
            'role'         => 'guide',
            'is_approved'  => false,
        ]);

        $this->notifyAdminsOfPendingUser($user->fresh(), 'guide');

        return response()->json($user->fresh());
    }

    /**
     * Notify all admin users that a new owner or guide needs approval.
     */
    private function notifyAdminsOfPendingUser(User $user, string $role): void
    {
        $roleLabel = $role === 'owner' ? 'owner' : 'guide';
        $title =
            $roleLabel === 'owner'
                ? 'New owner pending approval'
                : 'New guide pending approval';

        $body = "{$user->name} ({$user->email}) just signed up as a {$roleLabel}.";

        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            NotificationService::notify(
                $admin->id,
                "admin.pending_{$roleLabel}",
                $title,
                $body,
                '/admin/users?status=pending',
            );
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * POST /api/user/avatar
     * Upload (or replace) the authenticated user's profile picture.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,jfif,png,webp',
                'max:2048', // 2 MB
            ],
        ]);

        $user = $request->user();

        // Delete previous avatar file if it was a local storage upload
        $oldUrl = $user->avatar_url;
        if ($oldUrl && str_contains($oldUrl, '/storage/avatars/')) {
            $oldPath = 'avatars/' . basename($oldUrl);
            if (\Storage::disk('public')->exists($oldPath)) {
                \Storage::disk('public')->delete($oldPath);
            }
        }

        // Store new avatar
        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension();
        $filename = 'avatar-' . $user->id . '-' . time() . '.' . $extension;
        $file->storeAs('avatars', $filename, 'public');

        $url = '/storage/avatars/' . $filename;

        $user->update(['avatar_url' => $url]);

        return response()->json([
            'message' => 'Avatar uploaded.',
            'avatar_url' => $url,
            'user' => $user->fresh(),
        ]);
    }

    /**
     * POST /api/user/change-password
     * Universal password change for any authenticated user (customer, owner, guide, admin).
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!\Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => [
                    'current_password' => ['Current password is incorrect.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => \Hash::make($data['password']),
            'password_must_change' => false,
        ]);

        return response()->json(['message' => 'Password updated.']);
    }
}
