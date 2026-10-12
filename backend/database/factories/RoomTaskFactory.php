<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\RoomTask;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RoomTask>
 */
class RoomTaskFactory extends Factory
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
            'assigned_to' => User::factory(),
            'created_by' => User::factory(),
            'title' => fake()->randomElement(['شستن ظرف‌ها', 'خرید نان', 'نظافت اتاق']),
            'due_date' => fake()->date(),
            'priority' => 'normal',
            'status' => 'open',
        ];
    }
}
