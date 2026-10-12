<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'member_id', 'changed_by', 'started_at', 'ended_at', 'kind'])]
class SupervisorHistory extends Model
{
    protected $table = 'supervisor_history';

    protected function casts(): array
    {
        return ['started_at' => 'date:Y-m-d', 'ended_at' => 'date:Y-m-d'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }
}
