import type { AppUser, Room } from "@/features/onboarding/types";

export type RoomPageKey = "dashboard" | "room" | "members" | "settings" | "expenses" | "tasks" | "supervisor" | "shopping" | "announcements" | "notifications" | "preview";
export type RoomWorkspace = { room: Room; user: AppUser; onRoomChange: (room: Room) => void; onNavigate: (page: RoomPageKey, previewTitle?: string) => void; onLeaveRoom: () => void };
