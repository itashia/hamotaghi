import {
  BellRing,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  DoorOpen,
  House,
  Pencil,
  ShoppingBasket,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { RoomActivity, RoomActivityType } from "@/features/onboarding/types";

const activityStyle: Record<RoomActivityType, { icon: typeof House; tone: string }> = {
  member_joined: { icon: UsersRound, tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  member_left: { icon: DoorOpen, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  room_created: { icon: House, tone: "bg-primary/10 text-primary" },
  room_updated: { icon: Pencil, tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  supervisor_changed: { icon: UsersRound, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  expense_added: { icon: CircleDollarSign, tone: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  expense_deleted: { icon: Trash2, tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  settlement_recorded: { icon: CircleDollarSign, tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  task_created: { icon: ClipboardList, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  task_completed: { icon: CheckCheck, tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  task_updated: { icon: Pencil, tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  announcement_published: { icon: BellRing, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  shopping_item_added: { icon: ShoppingBasket, tone: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  shopping_item_completed: { icon: CheckCheck, tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

function relativeTime(timestamp: string) {
  const elapsed = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return minutes <= 1 ? "همین حالا" : `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "دیروز" : `${days} روز پیش`;
}

export function ActivityFeed({
  activities,
  compact = false,
  limit,
}: {
  activities: RoomActivity[];
  compact?: boolean;
  limit?: number;
}) {
  const visible = limit ? activities.slice(0, limit) : activities;
  if (!visible.length)
    return (
      <div className="rounded-2xl border border-dashed px-5 py-8 text-center">
        <p className="text-sm font-medium">اتاق فعلاً ساکته 🤫</p>
        <p className="mt-1 text-xs text-muted-foreground">اتفاقای اتاق کم‌کم اینجا جمع می‌شن.</p>
      </div>
    );
  return (
    <ol className={compact ? "divide-y" : "space-y-1"}>
      {visible.map((item) => {
        const { icon: Icon, tone } = activityStyle[item.type];
        return (
          <li
            key={item.id}
            className={`flex items-start gap-3 ${compact ? "py-3.5 first:pt-1 last:pb-1" : "rounded-xl px-3 py-3 transition-colors hover:bg-muted/45"}`}
          >
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-[17px]" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6">
                <span className="font-semibold">{item.actor}</span> {item.description}
              </p>
              {item.detail && <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>}
            </div>
            <time className="shrink-0 pt-1 text-[10px] text-muted-foreground">{relativeTime(item.timestamp)}</time>
          </li>
        );
      })}
    </ol>
  );
}
