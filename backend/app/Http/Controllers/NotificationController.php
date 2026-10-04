<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * List the authenticated user's notifications, newest first.
     * Optional: ?limit=N (default 50, max 200)
     */
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 50);
        if ($limit < 1) $limit = 50;
        if ($limit > 200) $limit = 200;

        $items = AppNotification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return response()->json($items);
    }

    /**
     * GET /api/notifications/unread-count
     * Returns { count: N }
     */
    public function unreadCount(Request $request)
    {
        $count = AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * POST /api/notifications/{notification}/read
     */
    public function markRead(Request $request, AppNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json($notification->fresh());
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllRead(Request $request)
    {
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}