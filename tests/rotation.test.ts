import { describe, expect, test } from "bun:test";
import { nextRotationAssignee, occurrenceKey, getNextOccurrenceDate } from "../src/features/tasks/domain/rotation";
import { manuallySetSupervisor, refreshSupervisor } from "../src/features/supervisor/domain/rotation";
import type { Room, RoomMember } from "../src/features/onboarding/types";
import type { ChoreRotation } from "../src/features/tasks/types";

const members: RoomMember[] = ["sara", "amir", "mary"].map((id) => ({ id, fullName: id, role: id === "sara" ? "owner" : "member", joinedAt: "۱۴۰۵/۰۷/۱۹", status: "active" }));
const choreRotation: ChoreRotation = { seriesId: "clean", orderIds: ["sara", "amir", "mary"], lastAssignedId: "sara", generatedOccurrenceKeys: ["clean:2026-10-11"] };
const room: Room = { id: "r1", code: "R1", name: "۱۲۴", capacity: 4, dormitory: { name: "آفتاب", university: "تهران" }, memberIds: members.map((member) => member.id), ownerId: "sara", members, currentSupervisorId: "sara", nextSupervisorId: "amir", supervisorPeriod: "", supervisorRotationOrder: ["sara", "amir", "mary"], supervisorAnchorDate: "2026-10-05", supervisorHistory: [] };

describe("rotation calculations", () => {
  test("chore assignments move fairly and skip members who left", () => {
    expect(nextRotationAssignee(choreRotation, members)).toBe("amir");
    expect(nextRotationAssignee(choreRotation, members.slice(0, 1), "sara")).toBe("sara");
    expect(nextRotationAssignee(choreRotation, members.slice(0, 1), "amir")).toBe("sara");
  });

  test("recurring dates and occurrence identifiers prevent duplicate instances", () => {
    expect(getNextOccurrenceDate("2026-10-11", "daily")).toBe("2026-10-12");
    expect(getNextOccurrenceDate("2026-10-11", "weekly")).toBe("2026-10-18");
    expect(occurrenceKey("clean", "2026-10-11")).toBe("clean:2026-10-11");
  });

  test("weekly supervisor follows the saved order based on the local week", () => {
    expect(refreshSupervisor(room, new Date(2026, 9, 12, 12)).currentSupervisorId).toBe("amir");
    expect(refreshSupervisor(room, new Date(2026, 9, 19, 12)).currentSupervisorId).toBe("mary");
  });

  test("manual supervisor override lasts for the selected week", () => {
    const manual = manuallySetSupervisor(room, "sara", "sara", new Date(2026, 9, 12, 12));
    expect(manual.currentSupervisorId).toBe("sara");
    expect(manual.supervisorHistory?.at(-1)?.kind).toBe("manual");
    expect(refreshSupervisor(manual, new Date(2026, 9, 19, 12)).currentSupervisorId).toBe("mary");
  });
});
