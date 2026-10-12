import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fromJalali, formatJalali, toLatinDigits, todayISO } from "@/lib/jalali";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
  compact?: boolean;
};

export function JalaliDateInput({ value, onChange, className = "", compact = false, ...props }: Props) {
  function handleChange(raw: string) {
    const normalized = toLatinDigits(raw)
      .replace(/[^0-9/.-]/g, "")
      .replace(/-/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length === 3) {
      const iso = fromJalali({ year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) });
      if (iso) onChange(iso);
    } else if (!normalized) onChange("");
  }
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        {...props}
        value={value ? formatJalali(value) : ""}
        inputMode="numeric"
        placeholder="۱۴۰۴/۰۱/۰۱"
        dir="ltr"
        onChange={(event) => handleChange(event.target.value)}
        className={`${compact ? "h-9" : "h-10"} rounded-xl ps-9 text-left tabular-nums ${className}`}
      />
      <button
        type="button"
        onClick={() => onChange(todayISO())}
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] text-primary hover:bg-primary/10"
      >
        امروز
      </button>
    </div>
  );
}
