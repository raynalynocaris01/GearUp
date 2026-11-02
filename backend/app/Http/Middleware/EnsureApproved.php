<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_approved) {
            return response()->json([
                'message' => 'Your account is pending admin approval.',
                'code'    => 'pending_approval',
            ], 403);
        }

        return $next($request);
    }
}