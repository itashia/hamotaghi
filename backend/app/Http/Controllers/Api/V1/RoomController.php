<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Models\Dormitory;
use App\Models\Room;
use App\Models\RoomActivity;
use App\Models\User;
use App\Services\RoomFinanceService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $room = $request->user()->rooms()->wherePivot('status', 'active')->with('dormitory')->first();

        return response()->json(['room' => $room ? $this->serializeRoom($room) : null]);
    }

    public function store(StoreRoomRequest $request): JsonResponse
    {
        abort_if($request->user()->rooms()->wherePivot('status', 'active')->exists(), 409, 'ابتدا از اتاق فعلی خارج شوید.');
        $data = $request->validated();

        $room = DB::transaction(function () use ($data, $request): Room {
            $dormitory = Dormitory::create([
                ...$data['dormitory'], 'created_by' => $request->user()->id,
            ]);
            $room = $dormitory->rooms()->create([
                'owner_id' => $request->user()->id, 'name' => $data['name'], 'capacity' => $data['capacity'],
                'description' => $data['description'] ?? null, 'invite_code' => $this->newInviteCode(),
                'supervisor_rotation_order' => [(string) $request->user()->id], 'supervisor_anchor_date' => now()->toDateString(),
                'current_supervisor_id' => $request->user()->id,
            ]);
            $room->members()->attach($request->user()->id, ['role' => 'owner', 'status' => 'active', 'joined_at' => now()]);
            $this->activity($room, $request->user(), 'room_created', 'اتاق را ساخت');

            return $room;
        });

        return response()->json(['room' => $this->serializeRoom($room->fresh())], 201);
    }

    public function preview(Request $request, string $code): JsonResponse
    {
        $room = Room::where('invite_code', strtoupper($code))->with(['dormitory', 'members'])->firstOrFail();

        return response()->json(['room' => [
            'id' => (string) $room->id, 'name' => $room->name, 'dormitory' => $room->dormitory->name,
            'university' => $room->dormitory->university, 'capacity' => $room->capacity,
            'memberCount' => $room->members->where('pivot.status', 'active')->count(),
        ]]);
    }

    public function join(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:16']]);
        $user = $request->user();
        abort_if($user->rooms()->wherePivot('status', 'active')->exists(), 409, 'شما در حال حاضر عضو یک اتاق هستید.');

        $room = DB::transaction(function () use ($data, $user): Room {
            $room = Room::where('invite_code', strtoupper(trim($data['code'])))->lockForUpdate()->firstOrFail();
            abort_if($room->members()->wherePivot('status', 'active')->count() >= $room->capacity, 409, 'ظرفیت این اتاق تکمیل است.');
            $room->members()->syncWithoutDetaching([$user->id => ['role' => 'member', 'status' => 'active', 'joined_at' => now()]]);
            $order = $room->supervisor_rotation_order ?? [];
            if (! in_array((string) $user->id, $order, true)) {
                $order[] = (string) $user->id;
            }
            $room->update(['supervisor_rotation_order' => $order]);
            $this->activity($room, $user, 'member_joined', 'به اتاق پیوست');

            return $room;
        });

        return response()->json(['room' => $this->serializeRoom($room->fresh())], 200);
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $this->authorizeOwner($request, $room);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:80'], 'capacity' => ['sometimes', 'required', 'integer', 'between:2,20'],
            'description' => ['nullable', 'string', 'max:2000'],
            'dormitory.name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'dormitory.university' => ['sometimes', 'required', 'string', 'min:2', 'max:160'], 'dormitory.description' => ['nullable', 'string', 'max:2000'],
        ]);
        if (isset($data['capacity'])) {
            abort_if($data['capacity'] < $room->members()->wherePivot('status', 'active')->count(), 422, 'ظرفیت نمی‌تواند از تعداد اعضای فعلی کمتر باشد.');
        }
        $dormitory = $data['dormitory'] ?? null;
        unset($data['dormitory']);
        $room->fill($data)->save();
        if ($dormitory) {
            $room->dormitory->fill($dormitory)->save();
        }
        $this->activity($room, $request->user(), 'room_updated', 'اطلاعات اتاق را به‌روزرسانی کرد');

        return response()->json(['room' => $this->serializeRoom($room->fresh())]);
    }

    public function updateWorkspace(Request $request, Room $room): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'], 'capacity' => ['required', 'integer', 'between:2,20'],
            'description' => ['nullable', 'string', 'max:2000'],
            'dormitory.name' => ['required', 'string', 'min:2', 'max:120'], 'dormitory.university' => ['required', 'string', 'min:2', 'max:160'], 'dormitory.description' => ['nullable', 'string', 'max:2000'],
            'supervisorRotationOrder' => ['array'], 'supervisorRotationOrder.*' => ['string'],
            'currentSupervisorId' => ['sometimes', 'string'], 'nextSupervisorId' => ['sometimes', 'string'], 'supervisorPeriod' => ['sometimes', 'string', 'max:80'], 'supervisorAnchorDate' => ['nullable', 'date_format:Y-m-d'], 'manualSupervisorId' => ['nullable', 'string'], 'manualSupervisorWeekStart' => ['nullable', 'date_format:Y-m-d'],
            'supervisorHistory' => ['array'], 'supervisorHistory.*.memberId' => ['required', 'string'], 'supervisorHistory.*.startedAt' => ['required', 'date_format:Y-m-d'], 'supervisorHistory.*.endedAt' => ['nullable', 'date_format:Y-m-d'], 'supervisorHistory.*.changedBy' => ['required', 'string'], 'supervisorHistory.*.kind' => ['required', Rule::in(['rotation', 'manual'])],
            'expenses' => ['array'], 'expenses.*.id' => ['required', 'string'], 'expenses.*.title' => ['required', 'string', 'max:120'], 'expenses.*.amount' => ['required', 'integer', 'min:1'], 'expenses.*.category' => ['required', 'string', 'max:32'], 'expenses.*.date' => ['required', 'date_format:Y-m-d'], 'expenses.*.description' => ['nullable', 'string', 'max:2000'], 'expenses.*.payerId' => ['required', 'string'], 'expenses.*.participantIds' => ['required', 'array', 'min:1'], 'expenses.*.participantIds.*' => ['string'],
            'settlements' => ['array'], 'settlements.*.id' => ['required', 'string'], 'settlements.*.fromMemberId' => ['required', 'string'], 'settlements.*.toMemberId' => ['required', 'string'], 'settlements.*.amount' => ['required', 'integer', 'min:1'], 'settlements.*.date' => ['required', 'date_format:Y-m-d'], 'settlements.*.recordedBy' => ['required', 'string'], 'settlements.*.note' => ['nullable', 'string', 'max:255'],
            'tasks' => ['array'], 'tasks.*.id' => ['required', 'string'], 'tasks.*.title' => ['required', 'string', 'max:120'], 'tasks.*.description' => ['nullable', 'string', 'max:2000'], 'tasks.*.assignedToId' => ['required', 'string'], 'tasks.*.dueDate' => ['required', 'date_format:Y-m-d'], 'tasks.*.priority' => ['required', Rule::in(['low', 'normal', 'high'])], 'tasks.*.status' => ['required', Rule::in(['open', 'completed'])], 'tasks.*.recurrence' => ['nullable', Rule::in(['daily', 'weekly'])], 'tasks.*.seriesId' => ['nullable', 'string'], 'tasks.*.occurrenceKey' => ['nullable', 'string'], 'tasks.*.completedAt' => ['nullable', 'date'],
            'choreRotations' => ['array'], 'choreRotations.*.seriesId' => ['required', 'string'], 'choreRotations.*.orderIds' => ['array'], 'choreRotations.*.orderIds.*' => ['string'], 'choreRotations.*.lastAssignedId' => ['nullable', 'string'], 'choreRotations.*.generatedOccurrenceKeys' => ['array'],
            'shoppingItems' => ['array'], 'shoppingItems.*.id' => ['required', 'string'], 'shoppingItems.*.name' => ['required', 'string', 'max:120'], 'shoppingItems.*.quantity' => ['nullable', 'string', 'max:80'], 'shoppingItems.*.addedBy' => ['required', 'string'], 'shoppingItems.*.completedBy' => ['nullable', 'string'], 'shoppingItems.*.completedAt' => ['nullable', 'date'], 'shoppingItems.*.createdAt' => ['nullable', 'date'],
            'announcements' => ['array'], 'announcements.*.id' => ['required', 'string'], 'announcements.*.title' => ['required', 'string', 'max:150'], 'announcements.*.message' => ['required', 'string', 'max:5000'], 'announcements.*.pinned' => ['required', 'boolean'], 'announcements.*.authorId' => ['nullable', 'string'],
        ]);

        abort_if($data['capacity'] < $room->members()->wherePivot('status', 'active')->count(), 422, 'ظرفیت نمی‌تواند از تعداد اعضای فعلی کمتر باشد.');
        DB::transaction(function () use ($data, $room, $request): void {
            $room = $room->newQuery()->whereKey($room->getKey())->lockForUpdate()->firstOrFail();
            $previousSupervisorId = $room->current_supervisor_id;
            $roomChanged = $room->name !== $data['name'] || $room->capacity !== $data['capacity'] || $room->description !== ($data['description'] ?? null) || $room->dormitory->name !== $data['dormitory']['name'] || $room->dormitory->university !== $data['dormitory']['university'] || $room->dormitory->description !== ($data['dormitory']['description'] ?? null);
            abort_unless(! $roomChanged || $request->user()->id === $room->owner_id, 403);
            $room->update(['name' => $data['name'], 'capacity' => $data['capacity'], 'description' => $data['description'] ?? null]);
            $room->dormitory()->update($data['dormitory']);
            if ($roomChanged) {
                $this->activity($room, $request->user(), 'room_updated', 'اطلاعات اتاق را به‌روزرسانی کرد');
            }
            $activeIds = $room->members()->wherePivot('status', 'active')->pluck('users.id')->map(fn ($id) => (string) $id)->all();
            $this->assertMembers($activeIds, $data);
            if (array_key_exists('supervisorRotationOrder', $data)) {
                abort_unless($request->user()->id === $room->owner_id, 403);
                $order = array_values(array_unique($data['supervisorRotationOrder']));
                abort_if(array_diff($order, $activeIds), 422, 'ترتیب سرپرستی شامل عضو نامعتبر است.');
                $room->update(['supervisor_rotation_order' => $order]);
            }
            if (array_key_exists('currentSupervisorId', $data) || array_key_exists('manualSupervisorId', $data) || array_key_exists('supervisorHistory', $data)) {
                abort_unless($request->user()->id === $room->owner_id, 403);
                foreach (['currentSupervisorId', 'nextSupervisorId', 'manualSupervisorId'] as $key) {
                    if (! empty($data[$key])) {
                        $this->member($room, $data[$key]);
                    }
                }
                $room->update([
                    'current_supervisor_id' => $data['currentSupervisorId'] ?? $room->current_supervisor_id,
                    'next_supervisor_id' => $data['nextSupervisorId'] ?? $room->next_supervisor_id,
                    'manual_supervisor_id' => $data['manualSupervisorId'] ?? null,
                    'manual_supervisor_week_start' => $data['manualSupervisorWeekStart'] ?? null,
                    'supervisor_period' => $data['supervisorPeriod'] ?? $room->supervisor_period,
                    'supervisor_anchor_date' => $data['supervisorAnchorDate'] ?? $room->supervisor_anchor_date,
                ]);
                if (array_key_exists('supervisorHistory', $data)) {
                    $history = $data['supervisorHistory'];
                    foreach ($history as $item) {
                        $this->member($room, $item['memberId']);
                    }
                    foreach ($history as $index => $item) {
                        $room->supervisorHistory()->updateOrCreate(['started_at' => $item['startedAt']], ['member_id' => $item['memberId'], 'changed_by' => $request->user()->id, 'ended_at' => $item['endedAt'] ?? null, 'kind' => $item['kind']]);
                    }
                }
                if ((string) $room->current_supervisor_id !== (string) $previousSupervisorId) {
                    $this->activity($room, $request->user(), 'supervisor_changed', 'سرپرست این هفته را تغییر داد');
                }
            }
            if (array_key_exists('expenses', $data)) {
                $this->syncExpenses($room, $data['expenses'], $request->user());
            }
            if (array_key_exists('settlements', $data)) {
                $this->syncSettlements($room, $data['settlements'], $request->user());
            }
            if (array_key_exists('tasks', $data)) {
                $this->syncTasks($room, $data['tasks'], $request->user());
            }
            if (array_key_exists('choreRotations', $data)) {
                $this->syncRotations($room, $data['choreRotations'], $activeIds);
            }
            if (array_key_exists('shoppingItems', $data)) {
                $this->syncShopping($room, $data['shoppingItems'], $request->user());
            }
            if (array_key_exists('announcements', $data)) {
                $this->syncAnnouncements($room, $data['announcements'], $request->user());
            }
        });

        return response()->json(['room' => $this->serializeRoom($room->fresh())]);
    }

    public function regenerateInvitation(Request $request, Room $room): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $this->authorizeOwner($request, $room);
        $room->update(['invite_code' => $this->newInviteCode()]);

        return response()->json(['room' => $this->serializeRoom($room->fresh())]);
    }

    public function removeMember(Request $request, Room $room, User $user): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $this->authorizeOwner($request, $room);
        abort_if($user->id === $room->owner_id, 422, 'مالک اتاق قابل حذف نیست.');
        abort_unless($room->members()->whereKey($user->id)->exists(), 404);
        DB::transaction(function () use ($room, $user, $request): void {
            $room->members()->updateExistingPivot($user->id, ['status' => 'removed']);
            $room->update(['supervisor_rotation_order' => array_values(array_diff($room->supervisor_rotation_order ?? [], [(string) $user->id])), 'current_supervisor_id' => $room->current_supervisor_id === $user->id ? $room->owner_id : $room->current_supervisor_id]);
            $this->activity($room, $request->user(), 'member_left', $user->name.' از اتاق حذف شد');
        });

        return response()->json(['room' => $this->serializeRoom($room->fresh())]);
    }

    public function leave(Request $request, Room $room): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $data = $request->validate(['transferTo' => ['nullable', 'string']]);
        if ($room->owner_id === $request->user()->id) {
            abort_unless(isset($data['transferTo']), 422, 'برای خروج، ابتدا مالکیت را به یکی از اعضا واگذار کنید.');
            $newOwner = $this->member($room, $data['transferTo']);
            abort_if($newOwner->id === $request->user()->id, 422, 'مالک جدید باید عضو دیگری باشد.');
        } else {
            abort_if(isset($data['transferTo']), 422, 'فقط مالک می‌تواند مالکیت را واگذار کند.');
        }
        DB::transaction(function () use ($request, $room, $data): void {
            if (isset($data['transferTo'])) {
                $room->members()->updateExistingPivot($data['transferTo'], ['role' => 'owner']);
                $room->members()->updateExistingPivot($request->user()->id, ['role' => 'member']);
                $room->update(['owner_id' => $data['transferTo']]);
            }
            $room->members()->updateExistingPivot($request->user()->id, ['status' => 'left']);
            $room->update([
                'supervisor_rotation_order' => array_values(array_diff($room->supervisor_rotation_order ?? [], [(string) $request->user()->id])),
                'current_supervisor_id' => $room->current_supervisor_id === $request->user()->id ? ($data['transferTo'] ?? null) : $room->current_supervisor_id,
                'next_supervisor_id' => $room->next_supervisor_id === $request->user()->id ? ($data['transferTo'] ?? null) : $room->next_supervisor_id,
            ]);
            $this->activity($room, $request->user(), 'member_left', 'از اتاق خارج شد');
        });

        return response()->json(['message' => 'از اتاق خارج شدید.']);
    }

    public function markActivityRead(Request $request, Room $room): JsonResponse
    {
        $this->authorizeMember($request, $room);
        $room->members()->updateExistingPivot($request->user()->id, ['last_activity_read_at' => now()]);

        return response()->json(['message' => 'اعلان‌ها خوانده شدند.']);
    }

    private function serializeRoom(Room $room): array
    {
        $room->load(['dormitory', 'members' => fn ($query) => $query->wherePivot('status', 'active'), 'expenses.shares', 'settlements', 'tasks', 'choreRotations', 'shoppingItems', 'announcements.author', 'activities' => fn ($query) => $query->latest()->limit(30), 'supervisorHistory']);
        $members = $room->members->map(fn (User $member) => ['id' => (string) $member->id, 'fullName' => $member->name, 'identifier' => $member->email ?? $member->phone, 'role' => $member->pivot->role, 'joinedAt' => $member->pivot->joined_at, 'status' => 'active'])->values();

        return [
            'id' => (string) $room->id, 'code' => $room->invite_code, 'name' => $room->name, 'capacity' => $room->capacity, 'description' => $room->description,
            'dormitory' => ['name' => $room->dormitory->name, 'university' => $room->dormitory->university, 'description' => $room->dormitory->description],
            'memberIds' => $members->pluck('id'), 'ownerId' => (string) $room->owner_id, 'members' => $members,
            'currentSupervisorId' => (string) ($room->current_supervisor_id ?? $room->owner_id), 'nextSupervisorId' => (string) ($room->next_supervisor_id ?? $room->owner_id), 'supervisorPeriod' => $room->supervisor_period ?? 'این هفته',
            'supervisorRotationOrder' => array_map('strval', $room->supervisor_rotation_order ?? []), 'supervisorAnchorDate' => optional($room->supervisor_anchor_date)->format('Y-m-d'), 'manualSupervisorId' => $room->manual_supervisor_id ? (string) $room->manual_supervisor_id : null, 'manualSupervisorWeekStart' => optional($room->manual_supervisor_week_start)->format('Y-m-d'),
            'expenses' => $room->expenses->map(fn ($expense) => ['id' => (string) $expense->id, 'title' => $expense->title, 'amount' => $expense->amount, 'category' => $expense->category, 'date' => $expense->expense_date->format('Y-m-d'), 'description' => $expense->description, 'payerId' => (string) $expense->payer_id, 'participantIds' => $expense->shares->pluck('user_id')->map(fn ($id) => (string) $id)->all(), 'createdAt' => $expense->created_at->toISOString()])->values(),
            'settlements' => $room->settlements->map(fn ($item) => ['id' => (string) $item->id, 'fromMemberId' => (string) $item->from_user_id, 'toMemberId' => (string) $item->to_user_id, 'amount' => $item->amount, 'date' => $item->settled_on->format('Y-m-d'), 'note' => $item->note, 'recordedBy' => (string) $item->recorded_by])->values(),
            'tasks' => $room->tasks->map(fn ($item) => ['id' => (string) $item->id, 'seriesId' => $item->series_id, 'occurrenceKey' => $item->occurrence_key, 'title' => $item->title, 'description' => $item->description, 'assignedToId' => (string) $item->assigned_to, 'createdById' => (string) $item->created_by, 'dueDate' => $item->due_date->format('Y-m-d'), 'priority' => $item->priority, 'status' => $item->status, 'recurrence' => $item->recurrence, 'completedAt' => $item->completed_at?->toISOString()])->values(),
            'choreRotations' => $room->choreRotations->map(fn ($item) => ['seriesId' => $item->series_id, 'orderIds' => array_map('strval', $item->order_ids), 'lastAssignedId' => $item->last_assigned_id ? (string) $item->last_assigned_id : null, 'generatedOccurrenceKeys' => $item->generated_occurrence_keys])->values(),
            'shoppingItems' => $room->shoppingItems->map(fn ($item) => ['id' => (string) $item->id, 'name' => $item->name, 'quantity' => $item->quantity, 'addedBy' => (string) $item->added_by, 'completedBy' => $item->completed_by ? (string) $item->completed_by : null, 'createdAt' => $item->created_at->toISOString(), 'completedAt' => $item->completed_at?->toISOString()])->values(),
            'announcements' => $room->announcements->map(fn ($item) => ['id' => (string) $item->id, 'title' => $item->title, 'message' => $item->message, 'authorId' => (string) $item->author_id, 'authorName' => $item->author?->name ?? '', 'pinned' => $item->pinned, 'createdAt' => $item->created_at->toISOString()])->values(),
            'supervisorHistory' => $room->supervisorHistory->map(fn ($item) => ['memberId' => $item->member_id ? (string) $item->member_id : '', 'startedAt' => $item->started_at->format('Y-m-d'), 'endedAt' => $item->ended_at?->format('Y-m-d'), 'changedBy' => (string) ($item->changed_by ?? ''), 'kind' => $item->kind])->values(),
            'activities' => $room->activities->map(fn ($item) => ['id' => (string) $item->id, 'type' => $item->type, 'actor' => $item->actor_name, 'description' => $item->description, 'detail' => $item->detail, 'timestamp' => $item->created_at->toISOString()])->values(),
        ];
    }

    private function syncExpenses(Room $room, array $items, User $actor): void
    {
        $ids = [];
        foreach ($items as $item) {
            $payer = $this->member($room, $item['payerId']);
            $participants = array_values(array_unique($item['participantIds']));
            abort_if(count($participants) !== count($item['participantIds']), 422, 'اعضای هزینه تکراری هستند.');
            foreach ($participants as $id) {
                $this->member($room, $id);
            }
            $expense = $this->upsert($room->expenses(), $item['id'], ['created_by' => $actor->id], [
                'payer_id' => $payer->id, 'title' => $item['title'], 'amount' => $item['amount'], 'category' => $item['category'], 'expense_date' => $item['date'], 'description' => $item['description'] ?? null,
            ]);
            if (! ctype_digit($item['id']) || ! $room->expenses()->whereKey($item['id'])->exists()) {
                $this->activity($room, $actor, 'expense_added', 'هزینه‌ی «'.$item['title'].'» را ثبت کرد');
            }
            $share = intdiv($expense->amount, count($participants));
            $remainder = $expense->amount % count($participants);
            $expense->shares()->delete();
            foreach ($participants as $index => $id) {
                $expense->shares()->create(['user_id' => $id, 'amount' => $share + ($index < $remainder ? 1 : 0)]);
            }
            $ids[] = $expense->id;
        }
        $room->expenses()->whereNotIn('id', $ids ?: [0])->delete();
    }

    private function syncSettlements(Room $room, array $items, User $actor): void
    {
        $balances = app(RoomFinanceService::class)->balances($room);
        foreach ($items as $item) {
            $from = $this->member($room, $item['fromMemberId']);
            $to = $this->member($room, $item['toMemberId']);
            abort_if($from->id === $to->id, 422, 'مبدا و مقصد تسویه باید متفاوت باشند.');
            $exists = $room->settlements()->whereKey($item['id'])->exists();
            if ($exists) {
                continue;
            }
            $owed = max(0, -($balances[(string) $from->id] ?? 0));
            $credit = max(0, $balances[(string) $to->id] ?? 0);
            abort_if($item['amount'] > min($owed, $credit), 422, 'مبلغ تسویه از بدهی باقی‌مانده بیشتر است.');
            $room->settlements()->create(['from_user_id' => $from->id, 'to_user_id' => $to->id, 'recorded_by' => $actor->id, 'amount' => $item['amount'], 'settled_on' => $item['date'], 'note' => $item['note'] ?? null]);
            $this->activity($room, $actor, 'settlement_recorded', 'تسویه‌ی '.$item['amount'].' تومانی را ثبت کرد');
            $balances[(string) $from->id] = ($balances[(string) $from->id] ?? 0) + $item['amount'];
            $balances[(string) $to->id] = ($balances[(string) $to->id] ?? 0) - $item['amount'];
        }
    }

    private function syncTasks(Room $room, array $items, User $actor): void
    {
        $ids = [];
        foreach ($items as $item) {
            $assignee = $this->member($room, $item['assignedToId']);
            $existing = ctype_digit($item['id']) ? $room->tasks()->whereKey($item['id'])->first() : null;
            $task = $this->upsert($room->tasks(), $item['id'], ['created_by' => $actor->id], [
                'assigned_to' => $assignee->id, 'title' => $item['title'], 'description' => $item['description'] ?? null, 'due_date' => $item['dueDate'], 'priority' => $item['priority'], 'status' => $item['status'], 'recurrence' => $item['recurrence'] ?? null, 'series_id' => $item['seriesId'] ?? null, 'occurrence_key' => $item['occurrenceKey'] ?? null, 'completed_at' => $item['completedAt'] ?? null,
            ]);
            if (! $existing) {
                $this->activity($room, $actor, 'task_created', 'کار «'.$item['title'].'» را ثبت کرد');
            } elseif ($existing->status !== 'completed' && $task->status === 'completed') {
                $this->activity($room, $actor, 'task_completed', 'کار «'.$item['title'].'» را انجام داد');
            }
            $ids[] = $task->id;
        }
        $room->tasks()->whereNotIn('id', $ids ?: [0])->delete();
    }

    private function syncRotations(Room $room, array $items, array $activeIds): void
    {
        $ids = [];
        foreach ($items as $item) {
            $order = array_values(array_unique($item['orderIds']));
            abort_if(array_diff($order, $activeIds), 422, 'چرخش شامل عضو نامعتبر است.');
            $last = isset($item['lastAssignedId']) ? $this->member($room, $item['lastAssignedId']) : null;
            $rotation = $room->choreRotations()->updateOrCreate(['series_id' => $item['seriesId']], ['order_ids' => $order, 'last_assigned_id' => $last?->id, 'generated_occurrence_keys' => $item['generatedOccurrenceKeys']]);
            $ids[] = $rotation->id;
        }
        $room->choreRotations()->whereNotIn('id', $ids ?: [0])->delete();
    }

    private function syncShopping(Room $room, array $items, User $actor): void
    {
        $ids = [];
        foreach ($items as $item) {
            $addedBy = $this->member($room, $item['addedBy']);
            $completedBy = isset($item['completedBy']) ? $this->member($room, $item['completedBy']) : null;
            $existing = ctype_digit($item['id']) ? $room->shoppingItems()->whereKey($item['id'])->first() : null;
            if (! $existing) {
                abort_unless($addedBy->id === $actor->id, 422, 'فقط می‌توانید خرید را به نام خودتان ثبت کنید.');
            } else {
                abort_unless($existing->added_by === $addedBy->id, 422, 'ثبت‌کننده‌ی خرید قابل تغییر نیست.');
                if (! $existing->completed_at && ($item['completedAt'] ?? null)) {
                    abort_unless($completedBy?->id === $actor->id, 422, 'خرید را فقط می‌توانید به نام خودتان تکمیل کنید.');
                }
            }
            $shopping = $this->upsert($room->shoppingItems(), $item['id'], ['added_by' => $addedBy->id], ['name' => $item['name'], 'quantity' => $item['quantity'] ?? null, 'completed_by' => $completedBy?->id, 'completed_at' => $item['completedAt'] ?? null]);
            if (! $existing) {
                $this->activity($room, $actor, 'shopping_item_added', '«'.$item['name'].'» را به فهرست خرید اضافه کرد');
            } elseif (! $existing->completed_at && $shopping->completed_at) {
                $this->activity($room, $actor, 'shopping_item_completed', '«'.$item['name'].'» را تهیه کرد');
            }
            $ids[] = $shopping->id;
        }
        $room->shoppingItems()->whereNotIn('id', $ids ?: [0])->delete();
    }

    private function syncAnnouncements(Room $room, array $items, User $actor): void
    {
        $ids = [];
        foreach ($items as $item) {
            $existing = ctype_digit($item['id']) ? $room->announcements()->whereKey($item['id'])->first() : null;
            if ($existing) {
                abort_unless($actor->id === $room->owner_id || $actor->id === $existing->author_id, 403);
                if ($existing->pinned !== $item['pinned']) {
                    abort_unless($actor->id === $room->owner_id, 403);
                }
            }
            $announcement = $this->upsert($room->announcements(), $item['id'], ['author_id' => $actor->id], ['title' => $item['title'], 'message' => $item['message'], 'pinned' => $item['pinned']]);
            if (! ctype_digit($item['id']) || ! $room->announcements()->whereKey($item['id'])->exists()) {
                $this->activity($room, $actor, 'announcement_published', 'اطلاعیه‌ی «'.$item['title'].'» را منتشر کرد');
            }
            $ids[] = $announcement->id;
        }
        $removed = $room->announcements()->whereNotIn('id', $ids ?: [0])->get();
        abort_if($removed->contains(fn ($item) => $actor->id !== $room->owner_id && $actor->id !== $item->author_id), 403);
        $room->announcements()->whereNotIn('id', $ids ?: [0])->delete();
    }

    private function upsert($relation, string $id, array $defaults, array $values): Model
    {
        return ctype_digit($id) ? $relation->updateOrCreate(['id' => (int) $id], $values) : $relation->create([...$defaults, ...$values]);
    }

    private function assertMembers(array $activeIds, array $data): void
    {
        foreach ($data['expenses'] ?? [] as $expense) {
            abort_if(! in_array($expense['payerId'], $activeIds, true) || array_diff($expense['participantIds'], $activeIds), 422, 'هزینه شامل عضو نامعتبر است.');
        }
    }

    private function member(Room $room, string $id): User
    {
        $user = $room->members()->where('users.id', $id)->wherePivot('status', 'active')->first();
        abort_unless($user, 422, 'این عضو فعال اتاق نیست.');

        return $user;
    }

    private function authorizeMember(Request $request, Room $room): void
    {
        abort_unless($request->user()->can('view', $room), 404);
    }

    private function authorizeOwner(Request $request, Room $room): void
    {
        abort_unless($request->user()->can('update', $room), 403);
    }

    private function activity(Room $room, User $actor, string $type, string $description): void
    {
        RoomActivity::create(['room_id' => $room->id, 'actor_id' => $actor->id, 'actor_name' => $actor->name, 'type' => $type, 'description' => $description]);
    }

    private function newInviteCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Room::where('invite_code', $code)->exists());

        return $code;
    }
}
