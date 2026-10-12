export type AppUser = { id: string; fullName: string; identifier: string };
export type Dormitory = { name: string; university: string; description?: string };
export type RoomMember = { id: string; fullName: string; identifier?: string; role: "owner" | "member"; joinedAt: string; status: "active" | "invited"; color?: string };
export type RoomActivityType = "member_joined" | "member_left" | "room_created" | "room_updated" | "supervisor_changed" | "expense_added" | "expense_deleted" | "settlement_recorded" | "task_created" | "task_completed" | "task_updated" | "announcement_published" | "shopping_item_added" | "shopping_item_completed";
export type RoomActivity = { id: string; type: RoomActivityType; actor: string; description: string; timestamp: string; detail?: string };
export type Room = { id: string; code: string; name: string; capacity: number; description?: string; dormitory: Dormitory; memberIds: string[]; ownerId: string; members: RoomMember[]; currentSupervisorId: string; nextSupervisorId: string; supervisorPeriod: string; expenses?: SharedExpense[]; settlements?: Settlement[]; tasks?: RoomTask[]; choreRotations?: ChoreRotation[]; supervisorRotationOrder?: string[]; supervisorAnchorDate?: string; manualSupervisorId?: string; manualSupervisorWeekStart?: string; supervisorHistory?: SupervisorHistoryEntry[]; shoppingItems?: ShoppingItem[]; announcements?: RoomAnnouncement[]; activities?: RoomActivity[] };
export type Membership = { userId: string; roomId: string; role: "owner" | "member" };
export type LocalAppState = { user: AppUser | null; room: Room | null; membership: Membership | null; onboardingComplete: boolean };

export type AuthScreen = "welcome" | "login" | "register" | "forgot-password" | "reset-password" | "onboarding" | "create-room" | "join-room" | "room-success" | "join-success" | "dashboard";
import type { SharedExpense, Settlement } from "@/features/expenses/types";
import type { ChoreRotation, RoomTask } from "@/features/tasks/types";
import type { SupervisorHistoryEntry } from "@/features/supervisor/types";
import type { ShoppingItem } from "@/features/shopping/types";
import type { RoomAnnouncement } from "@/features/announcements/types";

