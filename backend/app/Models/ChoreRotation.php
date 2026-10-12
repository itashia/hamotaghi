<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'series_id', 'order_ids', 'last_assigned_id', 'generated_occurrence_keys'])]
class ChoreRotation extends Model
{
    protected function casts(): array
    {
        return ['order_ids' => 'array', 'generated_occurrence_keys' => 'array'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
