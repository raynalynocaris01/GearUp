<?php

namespace App\Services;

use App\Models\AppNotification;

class NotificationService
{
    /**
     * Create a notification for a user.
     *
     * @param int $userId         Recipient user id
     * @param string $type        Short type key, e.g. 'booking.created'
     * @param string $title       Short headline shown in the bell list
     * @param string|null $body   Optional longer description
     * @param string|null $url    Optional in-app link (relative, e.g. '/owner/bookings')
     */
    public static function notify(
        int $userId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $url = null,
    ): AppNotification {
        return AppNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'action_url' => $url,
        ]);
    }

    /**
     * Notify a user only if the actor is different from the recipient.
     * Prevents "you booked your own gear" noise.
     */
    public static function notifyOthers(
        int $actorId,
        int $recipientId,
        string $type,
        string $title,
        ?string $body = null,
        ?string $url = null,
    ): ?AppNotification {
        if ($actorId === $recipientId) {
            return null;
        }

        return self::notify($recipientId, $type, $title, $body, $url);
    }
}