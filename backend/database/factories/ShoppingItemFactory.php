<?php

namespace Database\Factories;

use App\Models\Room;
use App\Models\ShoppingItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShoppingItem>
 */
class ShoppingItemFactory extends Factory
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
            'added_by' => User::factory(),
            'name' => fake()->randomElement(['نان', 'مایع ظرف‌شویی', 'دستمال کاغذی']),
            'quantity' => fake()->optional()->randomElement(['یک عدد', 'دو بسته']),
        ];
    }
}
