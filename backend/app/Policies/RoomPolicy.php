<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    public function view(User $user, Room $room): bool
    {
        return $room->members()
            ->where('users.id', $user->id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    public function update(User $user, Room $room): bool
    {
        return $user->id === $room->owner_id && $this->view($user, $room);
    }
}
