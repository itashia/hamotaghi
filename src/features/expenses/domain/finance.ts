import type { SharedExpense, Settlement, SettlementSuggestion } from "../types";

export type MemberBalance = { memberId: string; balance: number };

export function splitAmount(amount: number, participantIds: string[]) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new RangeError("مبلغ باید یک عدد صحیح مثبت باشد.");
  const ids = [...new Set(participantIds)];
  if (!ids.length) throw new RangeError("حداقل یک نفر باید در تقسیم هزینه باشد.");
  const base = Math.floor(amount / ids.length);
  const remainder = amount % ids.length;
  return ids.map((memberId, index) => ({ memberId, amount: base + (index < remainder ? 1 : 0) }));
}

export function calculateBalances(expenses: SharedExpense[], settlements: Settlement[], memberIds: string[]): MemberBalance[] {
  const allIds = new Set(memberIds);
  for (const expense of expenses) { allIds.add(expense.payerId); expense.participantIds.forEach((id) => allIds.add(id)); }
  for (const settlement of settlements) { allIds.add(settlement.fromMemberId); allIds.add(settlement.toMemberId); }
  const balances = new Map<string, number>([...allIds].map((memberId) => [memberId, 0]));
  const add = (memberId: string, amount: number) => balances.set(memberId, (balances.get(memberId) ?? 0) + amount);
  for (const expense of expenses) {
    if (!Number.isSafeInteger(expense.amount) || expense.amount <= 0 || !expense.payerId || !expense.participantIds.length) continue;
    add(expense.payerId, expense.amount);
    for (const share of splitAmount(expense.amount, expense.participantIds)) add(share.memberId, -share.amount);
  }
  for (const settlement of settlements) {
    if (Number.isSafeInteger(settlement.amount) && settlement.amount > 0 && settlement.fromMemberId !== settlement.toMemberId) {
      add(settlement.fromMemberId, settlement.amount);
      add(settlement.toMemberId, -settlement.amount);
    }
  }
  return [...balances].map(([memberId, balance]) => ({ memberId, balance }));
}

export function getSettlementSuggestions(input: MemberBalance[]): SettlementSuggestion[] {
  const balances = input.filter((entry) => Number.isSafeInteger(entry.balance) && entry.balance !== 0);
  const total = balances.reduce((sum, entry) => sum + entry.balance, 0);
  if (total !== 0) return [];
  const ordered = [...balances].sort((a, b) => a.memberId.localeCompare(b.memberId));
  const values = ordered.map((entry) => entry.balance);
  const greedy = () => {
    const debtors = ordered.filter((entry) => entry.balance < 0).map((entry) => ({ memberId: entry.memberId, amount: -entry.balance })).sort((a, b) => b.amount - a.amount || a.memberId.localeCompare(b.memberId));
    const creditors = ordered.filter((entry) => entry.balance > 0).map((entry) => ({ memberId: entry.memberId, amount: entry.balance })).sort((a, b) => b.amount - a.amount || a.memberId.localeCompare(b.memberId));
    const result: SettlementSuggestion[] = []; let di = 0; let ci = 0;
    while (di < debtors.length && ci < creditors.length) { const debtor = debtors[di]; const creditor = creditors[ci]; const amount = Math.min(debtor.amount, creditor.amount); result.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amount }); debtor.amount -= amount; creditor.amount -= amount; if (!debtor.amount) di += 1; if (!creditor.amount) ci += 1; }
    return result;
  };
  let best = greedy();
  if (ordered.length > 10) return best;
  const path: SettlementSuggestion[] = [];
  function search(start: number) {
    while (start < values.length && values[start] === 0) start += 1;
    if (start === values.length) { if (path.length < best.length) best = [...path]; return; }
    if (path.length >= best.length) return;
    const value = values[start]; const tried = new Set<number>();
    for (let index = start + 1; index < values.length; index += 1) {
      if (values[index] === 0 || (value < 0) === (values[index] < 0) || tried.has(values[index])) continue;
      tried.add(values[index]);
      const amount = Math.min(Math.abs(value), Math.abs(values[index]));
      const otherValue = values[index];
      const debtorIndex = value < 0 ? start : index; const creditorIndex = value > 0 ? start : index;
      path.push({ fromMemberId: ordered[debtorIndex].memberId, toMemberId: ordered[creditorIndex].memberId, amount });
      values[start] += value < 0 ? amount : -amount;
      values[index] = otherValue + (otherValue < 0 ? amount : -amount);
      search(values[start] === 0 ? start + 1 : start);
      values[start] -= value < 0 ? amount : -amount;
      values[index] = otherValue;
      path.pop();
    }
  }
  search(0);
  return best;
}

export function validateSettlement(balances: MemberBalance[], fromMemberId: string, toMemberId: string, amount: number): string | null {
  if (fromMemberId === toMemberId) return "پرداخت‌کننده و دریافت‌کننده نمی‌توانند یک نفر باشند.";
  if (!Number.isSafeInteger(amount) || amount <= 0) return "مبلغ تسویه باید عددی صحیح و بیشتر از صفر باشد.";
  const debtorBalance = balances.find((entry) => entry.memberId === fromMemberId)?.balance ?? 0;
  const creditorBalance = balances.find((entry) => entry.memberId === toMemberId)?.balance ?? 0;
  if (debtorBalance >= 0) return "این هم‌اتاقی بدهیِ قابل تسویه نداره.";
  if (creditorBalance <= 0) return "این هم‌اتاقی طلبِ قابل دریافت نداره.";
  if (amount > -debtorBalance) return "مبلغ از بدهی باقی‌مانده بیشتر است.";
  if (amount > creditorBalance) return "مبلغ از طلب باقی‌مانده بیشتر است.";
  return null;
}

export function getFinancialSummary(expenses: SharedExpense[], settlements: Settlement[], memberIds: string[], userId: string) {
  const balances = calculateBalances(expenses, settlements, memberIds);
  const balance = balances.find((entry) => entry.memberId === userId)?.balance ?? 0;
  return {
    totalExpenses: expenses.reduce((sum, expense) => sum + (Number.isSafeInteger(expense.amount) && expense.amount > 0 ? expense.amount : 0), 0),
    debt: Math.max(0, -balance),
    credit: Math.max(0, balance),
    balance,
    balances,
    suggestions: getSettlementSuggestions(balances),
  };
}
