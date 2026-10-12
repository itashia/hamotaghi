<?php

namespace Database\Factories;

use App\Models\Dormitory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dormitory>
 */
class DormitoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'name' => 'خوابگاه '.fake()->unique()->city(),
            'university' => 'دانشگاه '.fake()->city(),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
