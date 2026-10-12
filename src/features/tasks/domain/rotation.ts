import type { RoomMember } from "@/features/onboarding/types";
import type { ChoreRotation, RecurrenceFrequency } from "../types";

export function eligibleRotationMembers(rotation: ChoreRotation, members: RoomMember[]) {
  const active = new Set(members.filter((member) => member.status === "active").map((member) => member.id));
  const ordered = rotation.orderIds.filter((id, index, all) => active.has(id) && all.indexOf(id) === index);
  const newMembers = members.filter((member) => member.status === "active" && !ordered.includes(member.id)).map((member) => member.id);
  return [...ordered, ...newMembers];
}

export function nextRotationAssignee(rotation: ChoreRotation, members: RoomMember[], lastAssignedId = rotation.lastAssignedId): string | null {
  const eligible = eligibleRotationMembers(rotation, members);
  if (!eligible.length) return null;
  const previousIndex = eligible.indexOf(lastAssignedId);
  return eligible[(previousIndex + 1 + eligible.length) % eligible.length];
}

export function getNextOccurrenceDate(date: string, frequency: RecurrenceFrequency): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new RangeError("تاریخ وظیفه معتبر نیست.");
  parsed.setDate(parsed.getDate() + (frequency === "daily" ? 1 : 7));
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

export function occurrenceKey(seriesId: string, dueDate: string) { return `${seriesId}:${dueDate}`; }
