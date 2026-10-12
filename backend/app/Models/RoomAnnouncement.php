<?php

namespace App\Models;

use Database\Factories\RoomAnnouncementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'author_id', 'title', 'message', 'pinned'])]
class RoomAnnouncement extends Model
{
    /** @use HasFactory<RoomAnnouncementFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['pinned' => 'boolean'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
