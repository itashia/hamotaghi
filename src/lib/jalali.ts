const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

function div(a: number, b: number): number {
  return Math.floor(a / b);
}
export type JalaliDate = { year: number; month: number; day: number };

export function toJalali(iso: string | Date): JalaliDate {
  const date = typeof iso === "string" ? new Date(`${iso.slice(0, 10)}T12:00:00Z`) : iso;
  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  const adjustedYear = gy - (gy <= 1600 ? 621 : 1600);
  const leapYear = gm > 2 ? adjustedYear + 1 : adjustedYear;
  let days =
    365 * adjustedYear +
    div(leapYear + 3, 4) -
    div(leapYear + 99, 100) +
    div(leapYear + 399, 400) -
    80 +
    gd +
    monthDays[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  return {
    year: jy,
    month: days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30),
    day: 1 + (days < 186 ? days % 31 : (days - 186) % 30),
  };
}

export function fromJalali({ year, month, day }: JalaliDate): string | null {
  if (
    ![year, month, day].every(Number.isInteger) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (month <= 6 ? 31 : month < 12 ? 30 : 30)
  )
    return null;
  const ordinal = (month <= 6 ? (month - 1) * 31 : 186 + (month - 7) * 30) + day - 1;
  const estimate = new Date(Date.UTC(year + 621, 2, 21 + ordinal));
  // Anchor arithmetic is deliberately verified through the same forward converter;
  // this keeps leap-year behavior correct at the 1403/1404 boundary.
  for (let offset = -3; offset <= 3; offset++) {
    const candidate = new Date(estimate);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    const iso = `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, "0")}-${String(candidate.getUTCDate()).padStart(2, "0")}`;
    const converted = toJalali(iso);
    if (converted.year === year && converted.month === month && converted.day === day) return iso;
  }
  return null;
}

export function isJalaliLeapYear(year: number): boolean {
  return fromJalali({ year, month: 12, day: 30 }) !== null;
}
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function formatJalali(iso: string): string {
  const d = toJalali(iso);
  return `${new Intl.NumberFormat("fa-IR").format(d.year)}/${new Intl.NumberFormat("fa-IR").format(d.month)}/${new Intl.NumberFormat("fa-IR").format(d.day)}`;
}
