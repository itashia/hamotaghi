export type TaskPriority = "low" | "normal" | "high";
export type TaskStatus = "open" | "completed";
export type RecurrenceFrequency = "daily" | "weekly";
export type RoomTask = {
  id: string;
  seriesId?: string;
  occurrenceKey?: string;
  title: string;
  description?: string;
  assignedToId: string;
  createdById: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence?: RecurrenceFrequency;
  completedAt?: string;
};
export type ChoreRotation = { seriesId: string; orderIds: string[]; lastAssignedId: string; generatedOccurrenceKeys: string[] };
