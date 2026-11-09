<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PayMongoWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhook_marks_booking_as_paid(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $booking = Booking::factory()->create([
            'user_id' => $user->id,
            'total_price' => 100,
            'amount_paid' => 0,
            'balance_due' => 100,
            'payment_status' => 'pending',
            'status' => 'pending',
        ]);

        $payload = [
            'data' => [
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => [
                        'id' => 'cs_test_123',
                        'attributes' => [
                            'reference_number' => (string) $booking->id,
                            'payments' => [
                                ['attributes' => ['source' => ['type' => 'gcash']]],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $payloadJson = json_encode($payload);
        $timestamp = (string) now()->timestamp;
        $secret = env('PAYMONGO_WEBHOOK_SECRET', 'test_secret');
        $signature = hash_hmac('sha256', $timestamp . '.' . $payloadJson, $secret);

        config(['app.env' => 'testing']);
        putenv("PAYMONGO_WEBHOOK_SECRET={$secret}");

        $response = $this->postJson('/api/webhooks/paymongo', $payload, [
            'Paymongo-Signature' => "t={$timestamp},te={$signature}",
        ]);

        $response->assertOk();
        $booking->refresh();
        $this->assertEquals('paid', $booking->payment_status);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $response = $this->postJson('/api/webhooks/paymongo', ['foo' => 'bar'], [
            'Paymongo-Signature' => 't=123,te=invalid',
        ]);

        $response->assertStatus(401);
    }
}