<?php

namespace Database\Seeders;

use App\Models\Dormitory;
use App\Models\Expense;
use App\Models\Room;
use App\Models\RoomActivity;
use App\Models\RoomAnnouncement;
use App\Models\RoomTask;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DevelopmentWorkspaceSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $owner = User::firstOrCreate(['email' => 'demo@example.com'], ['name' => 'سارا محمدی', 'password' => 'DemoPass123']);
            $members = collect([
                $owner,
                User::firstOrCreate(['email' => 'amir@example.com'], ['name' => 'امیر حسینی', 'password' => 'DemoPass123']),
                User::firstOrCreate(['email' => 'maryam@example.com'], ['name' => 'مریم کریمی', 'password' => 'DemoPass123']),
                User::firstOrCreate(['email' => 'ali@example.com'], ['name' => 'علی رضایی', 'password' => 'DemoPass123']),
            ]);
            $dormitory = Dormitory::firstOrCreate(['created_by' => $owner->id, 'name' => 'خوابگاه آفتاب'], ['university' => 'دانشگاه تهران', 'description' => 'خوابگاه دانشجویی']);
            $room = Room::firstOrCreate(['invite_code' => 'AFTAB5'], [
                'dormitory_id' => $dormitory->id, 'owner_id' => $owner->id, 'name' => 'اتاق ۱۲۴', 'capacity' => 5,
                'description' => 'یک اتاق دنج و پرنور در طبقه‌ی دوم', 'current_supervisor_id' => $members[1]->id,
                'next_supervisor_id' => $members[2]->id, 'supervisor_rotation_order' => $members->pluck('id')->map(fn (int $id) => (string) $id)->all(),
                'supervisor_anchor_date' => now()->startOfWeek()->toDateString(), 'supervisor_period' => 'این هفته',
            ]);
            foreach ($members as $index => $member) {
                $room->members()->syncWithoutDetaching([$member->id => ['role' => $index === 0 ? 'owner' : 'member', 'status' => 'active', 'joined_at' => now()->subDays(45 - ($index * 7))]]);
            }

            if ($room->expenses()->doesntExist()) {
                $expense = Expense::create(['room_id' => $room->id, 'payer_id' => $members[1]->id, 'created_by' => $members[1]->id, 'title' => 'خرید میوه‌ی هفته', 'amount' => 500000, 'category' => 'groceries', 'expense_date' => now()->toDateString(), 'description' => 'سیب و پرتقال']);
                foreach ([$members[0]->id, $members[1]->id, $members[2]->id] as $index => $id) {
                    $expense->shares()->create(['user_id' => $id, 'amount' => [166667, 166667, 166666][$index]]);
                }
            }
            if ($room->tasks()->doesntExist()) {
                RoomTask::create(['room_id' => $room->id, 'assigned_to' => $members[2]->id, 'created_by' => $owner->id, 'title' => 'شستن ظرف‌های شام', 'due_date' => now()->toDateString(), 'priority' => 'normal', 'status' => 'open']);
            }
            if ($room->announcements()->doesntExist()) {
                RoomAnnouncement::create(['room_id' => $room->id, 'author_id' => $owner->id, 'title' => 'جلسه‌ی کوتاه هم‌خانه‌ها', 'message' => 'امشب ساعت ۸ یک گپ کوتاه درباره‌ی برنامه‌ی هفته داریم.', 'pinned' => true]);
            }
            if ($room->activities()->doesntExist()) {
                RoomActivity::create(['room_id' => $room->id, 'actor_id' => $owner->id, 'actor_name' => $owner->name, 'type' => 'room_created', 'description' => 'اتاق را ساخت']);
            }
        });
    }
}
