<?php

namespace App\Models;

use Database\Factories\SettlementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['room_id', 'from_user_id', 'to_user_id', 'recorded_by', 'amount', 'settled_on', 'note'])]
class Settlement extends Model
{
    /** @use HasFactory<SettlementFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['amount' => 'integer', 'settled_on' => 'date:Y-m-d'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function debtor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function creditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
