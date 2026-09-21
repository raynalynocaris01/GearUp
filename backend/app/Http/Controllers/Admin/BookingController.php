<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * GET /api/admin/bookings
     * Optional: ?status=pending, ?campsite_id=5
     */
    public function index(Request $request)
    {
        $query = Booking::with([
            'campsite:id,name,location,image_url,owner_id',
            'campsite.owner:id,name,email',
            'user:id,name,email',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('campsite_id')) {
            $query->where('campsite_id', $request->integer('campsite_id'));
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }
}