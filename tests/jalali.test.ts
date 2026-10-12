import { describe, expect, test } from "bun:test";
import { fromJalali, isJalaliLeapYear, toJalali } from "../src/lib/jalali";

describe("Jalali date conversion", () => {
  test("round trips known Persian calendar boundaries without timezone drift", () => {
    for (const [year, month, day, gregorian] of [[1400, 1, 1, "2021-03-21"], [1403, 12, 29, "2025-03-19"], [1404, 1, 1, "2025-03-21"]] as const) {
      expect(fromJalali({ year, month, day })).toBe(gregorian);
      expect(toJalali(gregorian)).toEqual({ year, month, day });
    }
  });

  test("rejects invalid month-end dates and handles a leap year", () => {
    expect(fromJalali({ year: 1402, month: 12, day: 30 })).toBeNull();
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(fromJalali({ year: 1403, month: 12, day: 30 })).toBe("2025-03-20");
  });
});
