import type { AppUser, LocalAppState, Membership } from "../types";
import { getRoomById, normalizeRoom } from "@/features/room/data/room-repository";

const APP_KEY = "hamotaghi-app-state-v1";
const USERS_KEY = "hamotaghi-local-users-v1";
const SESSION_KEY = "hamotaghi-session-active-v1";
const DRAFT_KEY = "hamotaghi-onboarding-draft-v1";

const emptyState: LocalAppState = { user: null, room: null, membership: null, onboardingComplete: false };

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadAppState(): LocalAppState {
  const stored = read<unknown>(APP_KEY, emptyState);
  if (typeof stored !== "object" || stored === null || Array.isArray(stored)) return emptyState;
  const record = stored as Record<string, unknown>;
  const rawUser = record.user;
  const user: AppUser | null =
    typeof rawUser === "object" && rawUser !== null && !Array.isArray(rawUser)
      ? (() => {
          const candidate = rawUser as Record<string, unknown>;
          return typeof candidate.id === "string" &&
            typeof candidate.fullName === "string" &&
            typeof candidate.identifier === "string"
            ? { id: candidate.id, fullName: candidate.fullName, identifier: candidate.identifier }
            : null;
        })()
      : null;
  const rawRoom = record.room;
  const normalizedRoom =
    typeof rawRoom === "object" && rawRoom !== null && !Array.isArray(rawRoom) ? normalizeRoom(rawRoom) : null;
  const room = normalizedRoom ? (getRoomById(normalizedRoom.id) ?? normalizedRoom) : null;
  const rawMembership = record.membership;
  const membership: Membership | null =
    typeof rawMembership === "object" && rawMembership !== null && !Array.isArray(rawMembership)
      ? (() => {
          const candidate = rawMembership as Record<string, unknown>;
          return typeof candidate.userId === "string" &&
            typeof candidate.roomId === "string" &&
            (candidate.role === "owner" || candidate.role === "member")
            ? { userId: candidate.userId, roomId: candidate.roomId, role: candidate.role }
            : null;
        })()
      : null;
  const validMembership =
    membership && membership.userId === user?.id && membership.roomId === room?.id ? membership : null;
  const state = {
    user,
    room,
    membership: validMembership,
    onboardingComplete: record.onboardingComplete === true && Boolean(user && room && validMembership),
  };
  if (typeof rawUser === "object" && rawUser !== null && "password" in rawUser)
    localStorage.setItem(APP_KEY, JSON.stringify(state));
  localStorage.removeItem(USERS_KEY);
  return state;
}

export function saveAppState(state: LocalAppState) {
  localStorage.setItem(APP_KEY, JSON.stringify(state));
  localStorage.setItem(SESSION_KEY, "true");
}

export function hasActiveSession() {
  return localStorage.getItem(SESSION_KEY) === "true";
}

export function clearAppState() {
  localStorage.setItem(SESSION_KEY, "false");
  localStorage.removeItem(APP_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(DRAFT_KEY);
  // Room snapshots are only an offline bootstrap cache. Never retain them across sessions.
  localStorage.removeItem("hamotaghi-local-rooms-v1");
}
