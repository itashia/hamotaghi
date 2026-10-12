<?php

namespace Database\Factories;

use App\Models\Dormitory;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
 */
class RoomFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dormitory_id' => Dormitory::factory(),
            'owner_id' => User::factory(),
            'name' => 'اتاق '.fake()->numberBetween(100, 500),
            'capacity' => 5,
            'description' => fake()->optional()->sentence(),
            'invite_code' => strtoupper(fake()->unique()->bothify('????####')),
            'supervisor_rotation_order' => [],
        ];
    }
}
