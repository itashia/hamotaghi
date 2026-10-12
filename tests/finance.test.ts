import { describe, expect, test } from "bun:test";
import { calculateBalances, getSettlementSuggestions, validateSettlement, splitAmount } from "../src/features/expenses/domain/finance";
import type { SharedExpense, Settlement } from "../src/features/expenses/types";

const members = ["sara", "amir", "mary", "mohammad"];
const expense = (payerId: string, amount: number, participantIds: string[], id = "expense"): SharedExpense => ({
  id, title: "خرید میوه", amount, category: "groceries", date: "2026-10-11", payerId, participantIds,
  shares: splitAmount(amount, participantIds), createdAt: "2026-10-11T10:00:00.000Z",
});

describe("expense calculations", () => {
  test("splits an integer amount and distributes remainders in participant order", () => {
    expect(splitAmount(500_003, ["sara", "amir", "mary", "mohammad"])).toEqual([
      { memberId: "sara", amount: 125_001 }, { memberId: "amir", amount: 125_001 }, { memberId: "mary", amount: 125_001 }, { memberId: "mohammad", amount: 125_000 },
    ]);
  });

  test("accounts for the payer's own share exactly once", () => {
    const balances = calculateBalances([expense("mohammad", 500_000, members)], [], members);
    expect(balances.find((member) => member.memberId === "mohammad")?.balance).toBe(375_000);
    expect(balances.reduce((sum, member) => sum + member.balance, 0)).toBe(0);
  });

  test("settlements reduce debts and credits without changing the room total", () => {
    const transactions: Settlement[] = [{ id: "s1", fromMemberId: "sara", toMemberId: "amir", amount: 100_000, date: "2026-10-11", recordedBy: "sara" }];
    const balances = calculateBalances([expense("amir", 400_000, ["sara", "amir"])], transactions, ["sara", "amir"]);
    expect(balances).toEqual([{ memberId: "sara", balance: -100_000 }, { memberId: "amir", balance: 100_000 }]);
  });

  test("suggests deterministic transfers and rejects excessive settlements", () => {
    const balances = [{ memberId: "sara", balance: -150 }, { memberId: "amir", balance: -50 }, { memberId: "mary", balance: 200 }];
    expect(getSettlementSuggestions(balances)).toEqual([
      { fromMemberId: "sara", toMemberId: "mary", amount: 150 }, { fromMemberId: "amir", toMemberId: "mary", amount: 50 },
    ]);
    expect(validateSettlement(balances, "sara", "mary", 151)).toContain("بدهی باقی‌مانده");
    expect(validateSettlement(balances, "mary", "sara", 1)).toContain("بدهی");
  });

  test("finds a smaller feasible settlement plan for a small room", () => {
    const suggestions = getSettlementSuggestions([
      { memberId: "a", balance: -5 }, { memberId: "b", balance: -4 },
      { memberId: "c", balance: 4 }, { memberId: "d", balance: 3 }, { memberId: "e", balance: 2 },
    ]);
    expect(suggestions).toHaveLength(3);
    expect(suggestions.reduce((sum, item) => sum + item.amount, 0)).toBe(9);
  });
});
