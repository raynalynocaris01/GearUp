<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Usage: ->middleware('role:admin') or ->middleware('role:admin,owner')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->is_suspended) {
            return response()->json([
                'message' => 'Your account has been suspended. Contact support.',
            ], 403);
        }

        if (! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'You do not have permission to access this resource.',
            ], 403);
        }

        // Owners must be approved before they can use owner routes.
        if ($user->role === 'owner' && ! $user->is_approved) {
            return response()->json([
                'message' => 'Your business account is pending admin approval.',
                'code' => 'pending_approval',
            ], 403);
        }

        return $next($request);
    }
}