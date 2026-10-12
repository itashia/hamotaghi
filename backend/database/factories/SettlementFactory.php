<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\Settlement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Settlement>
 */
class SettlementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'room_id' => Room::factory(),
            'from_user_id' => User::factory(),
            'to_user_id' => User::factory(),
            'recorded_by' => User::factory(),
            'amount' => fake()->numberBetween(10000, 500000),
            'settled_on' => fake()->date(),
            'note' => fake()->optional()->sentence(4),
        ];
    }
}
