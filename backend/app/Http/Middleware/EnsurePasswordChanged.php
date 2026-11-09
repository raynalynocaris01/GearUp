<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only enforce on authenticated users who must change password
        if ($user && $user->password_must_change) {
            // Allow these specific routes to pass through:
            //   - The password change endpoint itself
            //   - Logout (so they can log out if they don't want to change)
            //   - GET requests (so the UI can still load, show banner)
            $allowedPaths = [
                'api/user/change-password',
                'api/logout',
                'api/user',
            ];

            $isAllowed = in_array($request->path(), $allowedPaths, true)
                || $request->method() === 'GET';

            if (!$isAllowed) {
                return response()->json([
                    'message' => 'You must change your password before continuing.',
                    'code'    => 'PASSWORD_CHANGE_REQUIRED',
                ], 403);
            }
        }

        return $next($request);
    }
}