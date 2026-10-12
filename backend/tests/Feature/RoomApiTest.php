<?php

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

function createTestRoom(User $owner): array
{
    $response = test()->actingAs($owner)->postJson('/api/v1/rooms', [
        'dormitory' => ['name' => 'خوابگاه آفتاب', 'university' => 'دانشگاه تهران'],
        'name' => 'اتاق ۱۲۴', 'capacity' => 5,
    ]);
    $response->assertCreated();

    return $response->json('room');
}

it('registers an account and never returns a password', function (): void {
    $response = $this->withHeader('Origin', 'http://localhost:1420')->postJson('/api/v1/auth/register', [
        'name' => 'آرمان یوسفی', 'email' => 'arman@example.com', 'password' => 'SafePass123', 'password_confirmation' => 'SafePass123',
    ]);

    $response->assertCreated()->assertJsonPath('user.fullName', 'آرمان یوسفی')->assertJsonMissingPath('user.password');
    $this->assertDatabaseHas('users', ['email' => 'arman@example.com']);
});

it('logs an account in and out using the web session guard', function (): void {
    User::factory()->create(['email' => 'student@example.com', 'password' => 'SafePass123']);

    $this->withHeader('Origin', 'http://localhost:1420')->postJson('/api/v1/auth/login', ['identifier' => 'student@example.com', 'password' => 'SafePass123'])
        ->assertOk()->assertJsonPath('user.identifier', 'student@example.com');
    $this->getJson('/api/v1/auth/me')->assertOk();
    $this->postJson('/api/v1/auth/logout')->assertOk();
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('normalizes Persian phone digits during registration and login', function (): void {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'نگار رضایی', 'phone' => '۰۹۱۲۱۲۳۴۵۶۷', 'password' => 'SafePass123', 'password_confirmation' => 'SafePass123',
    ])->assertCreated();

    $this->postJson('/api/v1/auth/login', ['identifier' => '۰۹۱۲۱۲۳۴۵۶۷', 'password' => 'SafePass123'])
        ->assertOk()->assertJsonPath('user.identifier', '09121234567');
});

it('resets a password using a broker token', function (): void {
    $user = User::factory()->create(['email' => 'reset@example.com']);
    $token = Password::createToken($user);

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => $user->email, 'token' => $token, 'password' => 'UpdatedPass456', 'password_confirmation' => 'UpdatedPass456',
    ])->assertOk();

    expect(Hash::check('UpdatedPass456', $user->fresh()->password))->toBeTrue();
});

it('issues and revokes a bearer token for the Tauri client', function (): void {
    $response = $this->withHeader('X-Tauri-App', '1')->postJson('/api/v1/auth/register', [
        'name' => 'کیان موسوی', 'email' => 'kian@example.com', 'password' => 'SafePass123', 'password_confirmation' => 'SafePass123',
    ])->assertCreated();
    $token = $response->json('token');
    expect($token)->toBeString();

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();
    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
    $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('joins by invitation and rejects a full room', function (): void {
    $owner = User::factory()->create();
    $room = $this->actingAs($owner)->postJson('/api/v1/rooms', [
        'dormitory' => ['name' => 'خوابگاه سرو', 'university' => 'دانشگاه تهران'], 'name' => 'اتاق ۲۰۸', 'capacity' => 2,
    ])->assertCreated()->json('room');
    $member = User::factory()->create();
    $stranger = User::factory()->create();

    $this->actingAs($member)->getJson('/api/v1/rooms/invitations/'.$room['code'])->assertOk()->assertJsonPath('room.memberCount', 1);
    $this->postJson('/api/v1/rooms/join', ['code' => $room['code']])->assertOk()->assertJsonPath('room.memberIds', [(string) $owner->id, (string) $member->id]);
    $this->actingAs($stranger)->postJson('/api/v1/rooms/join', ['code' => $room['code']])->assertStatus(409);
});

it('isolates room data from users who are not members', function (): void {
    $owner = User::factory()->create();
    $room = createTestRoom($owner);
    $stranger = User::factory()->create();

    $this->actingAs($stranger)->getJson('/api/v1/rooms/current')->assertOk()->assertJsonPath('room', null);
    $this->actingAs($stranger)->putJson('/api/v1/rooms/'.$room['id'].'/workspace', [])->assertNotFound();
});

it('splits integer expense shares deterministically and rejects excessive settlement', function (): void {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $room = createTestRoom($owner);
    $roomModel = Room::findOrFail($room['id']);
    $roomModel->members()->attach($member->id, ['role' => 'member', 'status' => 'active', 'joined_at' => now()]);
    $this->actingAs($member)->putJson('/api/v1/rooms/'.$room['id'].'/workspace', [
        'name' => 'اتاق دست‌کاری‌شده', 'capacity' => 5, 'description' => null,
        'dormitory' => ['name' => 'خوابگاه آفتاب', 'university' => 'دانشگاه تهران'],
    ])->assertForbidden();

    $payload = [
        'name' => $room['name'], 'capacity' => 5, 'description' => null,
        'dormitory' => ['name' => 'خوابگاه آفتاب', 'university' => 'دانشگاه تهران'],
        'expenses' => [[
            'id' => 'new-expense', 'title' => 'خرید میوه', 'amount' => 100001, 'category' => 'groceries', 'date' => now()->toDateString(),
            'payerId' => (string) $owner->id, 'participantIds' => [(string) $owner->id, (string) $member->id],
        ]],
        'settlements' => [], 'tasks' => [], 'choreRotations' => [], 'shoppingItems' => [], 'announcements' => [],
    ];

    $saved = $this->actingAs($owner)->putJson('/api/v1/rooms/'.$room['id'].'/workspace', $payload)->assertOk()->json('room');
    $this->assertDatabaseHas('expense_shares', ['expense_id' => $saved['expenses'][0]['id'], 'user_id' => $owner->id, 'amount' => 50001]);
    $this->assertDatabaseHas('expense_shares', ['expense_id' => $saved['expenses'][0]['id'], 'user_id' => $member->id, 'amount' => 50000]);

    $payload['settlements'] = [[
        'id' => 'new-settlement', 'fromMemberId' => (string) $member->id, 'toMemberId' => (string) $owner->id,
        'amount' => 50002, 'date' => now()->toDateString(), 'recordedBy' => (string) $owner->id,
    ]];
    $this->putJson('/api/v1/rooms/'.$room['id'].'/workspace', $payload)->assertUnprocessable();
    $this->assertDatabaseCount('settlements', 0);
});
