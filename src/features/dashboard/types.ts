export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  initials: string;
  tone: "mint" | "peach" | "lavender";
};

export type TaskItem = {
  id: string;
  title: string;
  due: string;
  assignee: string;
  done: boolean;
};
