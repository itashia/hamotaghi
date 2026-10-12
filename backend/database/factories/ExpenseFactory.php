<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
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
            'payer_id' => User::factory(),
            'created_by' => User::factory(),
            'title' => fake()->randomElement(['خرید خوراکی', 'قبض برق', 'وسایل نظافت']),
            'amount' => fake()->numberBetween(50000, 2500000),
            'category' => fake()->randomElement(['groceries', 'utilities', 'supplies', 'maintenance', 'other']),
            'expense_date' => fake()->date(),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
