import type { Room, RoomActivity, RoomActivityType, RoomMember } from "@/features/onboarding/types";
import type { SharedExpense, Settlement } from "@/features/expenses/types";
import type { ChoreRotation, RoomTask } from "@/features/tasks/types";
import type { SupervisorHistoryEntry } from "@/features/supervisor/types";
import type { ShoppingItem } from "@/features/shopping/types";
import type { RoomAnnouncement } from "@/features/announcements/types";

const ROOMS_KEY = "hamotaghi-local-rooms-v1";

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isMember(value: unknown): value is RoomMember {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.fullName === "string" && (value.role === "owner" || value.role === "member") && typeof value.joinedAt === "string" && (value.status === "active" || value.status === "invited");
}
function isExpense(value: unknown): value is SharedExpense {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.title === "string" && Number.isSafeInteger(value.amount) && Number(value.amount) > 0 && ["groceries", "utilities", "supplies", "maintenance", "other"].includes(String(value.category)) && typeof value.date === "string" && typeof value.payerId === "string" && Array.isArray(value.participantIds) && value.participantIds.every((id) => typeof id === "string");
}
function isSettlement(value: unknown): value is Settlement {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.fromMemberId === "string" && typeof value.toMemberId === "string" && Number.isSafeInteger(value.amount) && Number(value.amount) > 0 && typeof value.date === "string" && typeof value.recordedBy === "string";
}
function isTask(value: unknown): value is RoomTask {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.title === "string" && typeof value.assignedToId === "string" && typeof value.createdById === "string" && typeof value.dueDate === "string" && ["low", "normal", "high"].includes(String(value.priority)) && ["open", "completed"].includes(String(value.status));
}
function isChoreRotation(value: unknown): value is ChoreRotation {
  if (!isRecord(value)) return false;
  return typeof value.seriesId === "string" && Array.isArray(value.orderIds) && value.orderIds.every((id) => typeof id === "string") && typeof value.lastAssignedId === "string" && Array.isArray(value.generatedOccurrenceKeys) && value.generatedOccurrenceKeys.every((key) => typeof key === "string");
}
function isSupervisorHistory(value: unknown): value is SupervisorHistoryEntry {
  if (!isRecord(value)) return false;
  return typeof value.memberId === "string" && typeof value.startedAt === "string" && typeof value.changedBy === "string" && (value.kind === "rotation" || value.kind === "manual");
}
function isShoppingItem(value: unknown): value is ShoppingItem {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.addedBy === "string" && typeof value.createdAt === "string";
}
function isAnnouncement(value: unknown): value is RoomAnnouncement {
  return isRecord(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.message === "string" && typeof value.authorId === "string" && typeof value.authorName === "string" && typeof value.createdAt === "string" && typeof value.pinned === "boolean";
}
function isActivity(value: unknown): value is RoomActivity {
  if (!isRecord(value)) return false;
  const types: RoomActivityType[] = ["member_joined", "member_left", "room_created", "room_updated", "supervisor_changed", "expense_added", "expense_deleted", "settlement_recorded", "task_created", "task_completed", "task_updated", "announcement_published", "shopping_item_added", "shopping_item_completed"];
  return typeof value.id === "string" && typeof value.type === "string" && types.includes(value.type as RoomActivityType) && typeof value.actor === "string" && typeof value.description === "string" && typeof value.timestamp === "string";
}

export function normalizeRoom(input: unknown): Room | null {
  if (!isRecord(input) || typeof input.id !== "string" || typeof input.code !== "string" || typeof input.name !== "string" || !isRecord(input.dormitory) || typeof input.dormitory.name !== "string" || typeof input.dormitory.university !== "string") return null;
  const rawMemberIds = Array.isArray(input.memberIds) ? input.memberIds.filter((id): id is string => typeof id === "string") : [];
  const rawMembers = Array.isArray(input.members) ? input.members.filter(isMember) : [];
  const memberIds = rawMemberIds.length ? rawMemberIds : rawMembers.map((member) => member.id);
  const storedCapacity = typeof input.capacity === "number" && Number.isFinite(input.capacity) && input.capacity > 0 ? Math.min(20, Math.floor(input.capacity)) : 5;
  const capacity = Math.max(storedCapacity, memberIds.length);
  const room = input as Partial<Room>;
  const members: RoomMember[] = rawMembers.length ? rawMembers : memberIds.map((id, index) => ({
    id,
    fullName: id.startsWith("demo-") ? ({ "demo-sara": "سارا محمدی", "demo-amir": "امیر حسینی", "demo-mary": "مریم کریمی", "demo-ali": "علی رضایی" }[id] ?? "هم‌اتاقی") : "هم‌اتاقی",
    role: id === room.ownerId || (!room.ownerId && index === 0) ? "owner" : "member",
    joinedAt: "۱۴۰۴/۰۸/۰۱",
    status: "active",
  }));
  const ownerId = typeof room.ownerId === "string" && members.some((member) => member.id === room.ownerId) ? room.ownerId : members.find((member) => member.role === "owner")?.id ?? members[0]?.id ?? "";
  const currentSupervisorId = typeof input.currentSupervisorId === "string" && members.some((member) => member.id === input.currentSupervisorId) ? input.currentSupervisorId : members[1]?.id ?? ownerId;
  const nextSupervisorId = typeof input.nextSupervisorId === "string" && members.some((member) => member.id === input.nextSupervisorId) ? input.nextSupervisorId : members[2]?.id ?? members[1]?.id ?? ownerId;
  const supervisorRotationOrder = Array.isArray(input.supervisorRotationOrder) ? input.supervisorRotationOrder.filter((id): id is string => typeof id === "string") : members.map((member) => member.id);
  return { ...room, id: input.id, code: input.code, name: input.name, capacity, dormitory: { name: input.dormitory.name, university: input.dormitory.university, description: typeof input.dormitory.description === "string" ? input.dormitory.description : undefined }, description: typeof input.description === "string" ? input.description : "", ownerId, members, currentSupervisorId, nextSupervisorId, supervisorPeriod: typeof input.supervisorPeriod === "string" ? input.supervisorPeriod : "این هفته", memberIds: members.map((member) => member.id), expenses: Array.isArray(input.expenses) ? input.expenses.filter(isExpense) : [], settlements: Array.isArray(input.settlements) ? input.settlements.filter(isSettlement) : [], tasks: Array.isArray(input.tasks) ? input.tasks.filter(isTask) : [], choreRotations: Array.isArray(input.choreRotations) ? input.choreRotations.filter(isChoreRotation) : [], supervisorRotationOrder, supervisorAnchorDate: typeof input.supervisorAnchorDate === "string" ? input.supervisorAnchorDate : undefined, manualSupervisorId: typeof input.manualSupervisorId === "string" ? input.manualSupervisorId : undefined, manualSupervisorWeekStart: typeof input.manualSupervisorWeekStart === "string" ? input.manualSupervisorWeekStart : undefined, supervisorHistory: Array.isArray(input.supervisorHistory) ? input.supervisorHistory.filter(isSupervisorHistory) : [], shoppingItems: Array.isArray(input.shoppingItems) ? input.shoppingItems.filter(isShoppingItem) : [], announcements: Array.isArray(input.announcements) ? input.announcements.filter(isAnnouncement) : [], activities: Array.isArray(input.activities) ? input.activities.filter(isActivity) : [] };
}

export function listRooms(): Room[] {
  const stored = read<unknown>(ROOMS_KEY, []);
  return Array.isArray(stored) ? stored.map(normalizeRoom).filter((room): room is Room => room !== null) : [];
}
export function getRoomById(id: string): Room | undefined { return listRooms().find((room) => room.id === id); }
export function persistRoom(room: Room) {
  const rooms = listRooms();
  localStorage.setItem(ROOMS_KEY, JSON.stringify([room, ...rooms.filter((item) => item.id !== room.id)]));
}

