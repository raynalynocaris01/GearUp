<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CompletePastBookings extends Command
{
    protected $signature = 'bookings:complete-past';
    protected $description = 'Mark confirmed bookings as completed once their check-out date has passed.';

    public function handle(): int
    {
        $today = Carbon::today();

        $count = Booking::where('status', 'confirmed')
            ->whereDate('check_out', '<=', $today)
            ->update(['status' => 'completed']);

        $this->info("Marked {$count} booking(s) as completed.");

        return self::SUCCESS;
    }
}