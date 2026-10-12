<?php

namespace App\Models;

use Database\Factories\RoomTaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'assigned_to', 'created_by', 'series_id', 'occurrence_key', 'title', 'description', 'due_date', 'priority', 'status', 'recurrence', 'completed_at'])]
class RoomTask extends Model
{
    /** @use HasFactory<RoomTaskFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['due_date' => 'date:Y-m-d', 'completed_at' => 'datetime'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
