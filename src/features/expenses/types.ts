export type ExpenseCategory = "groceries" | "utilities" | "supplies" | "maintenance" | "other";
export type ExpenseShare = { memberId: string; amount: number };
export type SharedExpense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description?: string;
  payerId: string;
  participantIds: string[];
  shares: ExpenseShare[];
  createdAt: string;
};
export type Settlement = { id: string; fromMemberId: string; toMemberId: string; amount: number; date: string; note?: string; recordedBy: string };
export type SettlementSuggestion = { fromMemberId: string; toMemberId: string; amount: number };
