<?php

namespace App\Models;

use Database\Factories\RoomFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['dormitory_id', 'owner_id', 'current_supervisor_id', 'next_supervisor_id', 'manual_supervisor_id', 'name', 'capacity', 'description', 'invite_code', 'supervisor_rotation_order', 'supervisor_anchor_date', 'manual_supervisor_week_start', 'supervisor_period'])]
class Room extends Model
{
    /** @use HasFactory<RoomFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['supervisor_rotation_order' => 'array', 'supervisor_anchor_date' => 'date:Y-m-d', 'manual_supervisor_week_start' => 'date:Y-m-d'];
    }

    public function dormitory(): BelongsTo
    {
        return $this->belongsTo(Dormitory::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function currentSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_supervisor_id');
    }

    public function nextSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'next_supervisor_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot(['role', 'status', 'joined_at', 'last_activity_read_at'])->withTimestamps();
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(Settlement::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(RoomTask::class);
    }

    public function choreRotations(): HasMany
    {
        return $this->hasMany(ChoreRotation::class);
    }

    public function shoppingItems(): HasMany
    {
        return $this->hasMany(ShoppingItem::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(RoomAnnouncement::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(RoomActivity::class);
    }

    public function supervisorHistory(): HasMany
    {
        return $this->hasMany(SupervisorHistory::class);
    }
}
