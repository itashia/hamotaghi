<?php

namespace App\Services;

use App\Models\Room;

class RoomFinanceService
{
    /** @return array<string, int> Net balances: positive is owed to the member, negative is owed by the member. */
    public function balances(Room $room): array
    {
        $balances = [];
        foreach ($room->expenses()->with('shares')->get() as $expense) {
            $payerId = (string) $expense->payer_id;
            $balances[$payerId] = ($balances[$payerId] ?? 0) + $expense->amount;
            foreach ($expense->shares as $share) {
                $memberId = (string) $share->user_id;
                $balances[$memberId] = ($balances[$memberId] ?? 0) - $share->amount;
            }
        }
        foreach ($room->settlements()->get() as $settlement) {
            $fromId = (string) $settlement->from_user_id;
            $toId = (string) $settlement->to_user_id;
            $balances[$fromId] = ($balances[$fromId] ?? 0) + $settlement->amount;
            $balances[$toId] = ($balances[$toId] ?? 0) - $settlement->amount;
        }

        return $balances;
    }
}
