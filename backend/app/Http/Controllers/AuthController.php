<?php

namespace App\Http\Controllers;

use App\Models\GuideApplication;
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

        // Owners still notify admins here — their review is the user
        // account itself, nothing else is required to kick off review.
        if ($role === 'owner') {
            $this->notifyAdminsOfPendingUser($user, 'owner');
        }

        // Guides get a GuideApplication row so they can upload a resume.
        // Admins are NOT notified yet — the notification fires from
        // ResumeController::store once an actual resume exists. This
        // prevents "pending applications with no resume" noise in the
        // admin queue.
        $guideApplicationId = null;
        if ($role === 'guide') {
            $application = GuideApplication::create([
                'applicant_user_id'    => $user->id,
                'submitted_by_user_id' => $user->id,
                'submission_source'    => 'self_signup',
                'resume_url'           => null,
                'status'               => 'pending',
            ]);
            $guideApplicationId = $application->id;
        }

        $token = $user->createToken($data['device_name'])->plainTextToken;

        return response()->json([
            'user'                 => $user,
            'token'                => $token,
            'guide_application_id' => $guideApplicationId,
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

        // Reuse an existing pending application if one is already open
        // for this user. This makes rapid double-clicks idempotent and
        // also handles the case where a guide was rejected and re-applies
        // — we create a fresh row (not reusing rejected), so the previous
        // rejection history is preserved.
        $application = GuideApplication::where('applicant_user_id', $user->id)
            ->whereIn('status', ['pending', 'under_review'])
            ->orderByDesc('created_at')
            ->first();

        if (! $application) {
            $application = GuideApplication::create([
                'applicant_user_id'    => $user->id,
                'submitted_by_user_id' => $user->id,
                'submission_source'    => 'customer_upgrade',
                'resume_url'           => null,
                'status'               => 'pending',
            ]);
        }

        // Admin notification happens in ResumeController::store once
        // the resume is uploaded — see the note in register() above.

        // Return the updated user fields at the top level (backward-compat
        // with existing frontend that treats the response as the user),
        // plus guide_application_id for the onboarding redirect.
        $user = $user->fresh();

        return response()->json(array_merge(
            $user->toArray(),
            ['guide_application_id' => $application->id],
        ));
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
