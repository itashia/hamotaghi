import type { Room, RoomMember } from "@/features/onboarding/types";
import type { SupervisorHistoryEntry } from "../types";

const DAY = 86_400_000;

export function getLocalISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getWeekStart(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return getLocalISODate(start);
}

function weekIndex(fromDate: string, currentWeek: string) {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [cy, cm, cd] = currentWeek.split("-").map(Number);
  return Math.floor((Date.UTC(cy, cm - 1, cd) - Date.UTC(fy, fm - 1, fd)) / (7 * DAY));
}

function currentOrder(room: Room, members: RoomMember[]) {
  const eligible = members.filter((member) => member.status === "active");
  const activeIds = new Set(eligible.map((member) => member.id));
  const configured = room.supervisorRotationOrder ?? [];
  return [
    ...configured.filter((id, index) => activeIds.has(id) && configured.indexOf(id) === index),
    ...eligible.filter((member) => !configured.includes(member.id)).map((member) => member.id),
  ];
}

function periodLabel(weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const formatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" });
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(end);
  return `${formatter.format(start)} تا ${formatter.format(end)} ${year}`;
}

function pushHistory(
  history: SupervisorHistoryEntry[],
  memberId: string,
  weekStart: string,
  changedBy: string,
  kind: "rotation" | "manual",
) {
  const previous = history[history.length - 1];
  if (previous?.memberId === memberId && !previous.endedAt) return history;
  const nextHistory =
    previous && !previous.endedAt ? [...history.slice(0, -1), { ...previous, endedAt: weekStart }] : [...history];
  return [...nextHistory, { memberId, startedAt: weekStart, changedBy, kind }];
}

export function refreshSupervisor(room: Room, date = new Date()): Room {
  const members = room.members.filter((member) => member.status === "active");
  const order = currentOrder(room, room.members);
  if (!order.length)
    return {
      ...room,
      supervisorRotationOrder: [],
      currentSupervisorId: "",
      nextSupervisorId: "",
      supervisorPeriod: "بدون سرپرست",
    };
  const currentWeek = getWeekStart(date);
  const anchorDate =
    room.supervisorAnchorDate && /^\d{4}-\d{2}-\d{2}$/.test(room.supervisorAnchorDate)
      ? room.supervisorAnchorDate
      : currentWeek;
  const index = ((weekIndex(anchorDate, currentWeek) % order.length) + order.length) % order.length;
  const naturalSupervisor = order[index];
  const manualActive =
    room.manualSupervisorWeekStart === currentWeek && members.some((member) => member.id === room.manualSupervisorId);
  const current = manualActive ? room.manualSupervisorId! : naturalSupervisor;
  const currentIndex = order.indexOf(current);
  const next = order[(currentIndex + 1) % order.length] ?? current;
  const previousId = room.currentSupervisorId;
  const history =
    previousId === current
      ? (room.supervisorHistory ?? [])
      : pushHistory(
          room.supervisorHistory ?? [],
          current,
          currentWeek,
          "هم‌اتاقی",
          manualActive ? "manual" : "rotation",
        );
  return {
    ...room,
    supervisorRotationOrder: order,
    supervisorAnchorDate: anchorDate,
    currentSupervisorId: current,
    nextSupervisorId: next,
    supervisorPeriod: periodLabel(currentWeek),
    supervisorHistory: history,
  };
}

export function changeSupervisorOrder(room: Room, order: string[], actorId: string, date = new Date()): Room {
  const allowed = new Set(room.members.filter((member) => member.status === "active").map((member) => member.id));
  const nextOrder = [
    ...order.filter((id, index) => allowed.has(id) && order.indexOf(id) === index),
    ...room.members
      .filter((member) => member.status === "active" && !order.includes(member.id))
      .map((member) => member.id),
  ];
  const week = getWeekStart(date);
  const changed = refreshSupervisor(
    {
      ...room,
      supervisorRotationOrder: nextOrder,
      supervisorAnchorDate: week,
      manualSupervisorId: room.currentSupervisorId,
      manualSupervisorWeekStart: week,
    },
    date,
  );
  const history =
    room.currentSupervisorId === changed.currentSupervisorId
      ? (room.supervisorHistory ?? [])
      : pushHistory(room.supervisorHistory ?? [], changed.currentSupervisorId, week, actorId, "rotation");
  return { ...changed, supervisorHistory: history };
}

export function manuallySetSupervisor(room: Room, memberId: string, actorId: string, date = new Date()): Room {
  if (!room.members.some((member) => member.id === memberId && member.status === "active"))
    throw new RangeError("سرپرست باید یکی از اعضای فعال اتاق باشد.");
  const week = getWeekStart(date);
  const changed = refreshSupervisor({ ...room, manualSupervisorId: memberId, manualSupervisorWeekStart: week }, date);
  const history = pushHistory(room.supervisorHistory ?? [], memberId, week, actorId, "manual");
  return { ...changed, supervisorHistory: history };
}
