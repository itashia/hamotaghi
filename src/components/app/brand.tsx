import { Home } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Home className="size-5" strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-lg font-bold">هم‌اتاقی</span>
        <span className="text-xs text-muted-foreground">زندگی، باهم ساده‌تره</span>
      </span>
    </div>
  );
}
