<?php

namespace App\Models;

use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['room_id', 'payer_id', 'created_by', 'title', 'amount', 'category', 'expense_date', 'description'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['amount' => 'integer', 'expense_date' => 'date:Y-m-d'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(ExpenseShare::class);
    }
}
