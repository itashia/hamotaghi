export type SupervisorHistoryEntry = {
  memberId: string;
  startedAt: string;
  endedAt?: string;
  changedBy: string;
  kind: "rotation" | "manual";
};
