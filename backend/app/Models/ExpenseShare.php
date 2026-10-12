<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['expense_id', 'user_id', 'amount'])]
class ExpenseShare extends Model
{
    protected function casts(): array
    {
        return ['amount' => 'integer'];
    }

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
