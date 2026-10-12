import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Crown,
  Home,
  ListTodo,
  Plus,
  ShoppingBasket,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/features/room/components/activity-feed";
import { MemberAvatar } from "@/features/room/components/member-avatar";
import { SupervisorCard } from "@/features/room/components/supervisor-card";
import type { RoomWorkspace } from "@/features/room/types";
import { getFinancialSummary } from "@/features/expenses/domain/finance";

const toman = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
const todayISO = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};

export function DashboardPage({ room, user, onNavigate }: RoomWorkspace) {
  const activities = room.activities ?? [];
  const finance = getFinancialSummary(
    room.expenses ?? [],
    room.settlements ?? [],
    room.members.map((member) => member.id),
    user.id,
  );
  const todayTasks = (room.tasks ?? []).filter((task) => task.dueDate === todayISO()).slice(0, 4);
  const upcomingTasks = (room.tasks ?? [])
    .filter((task) => task.status === "open" && task.dueDate >= todayISO())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  const pinned = room.announcements?.find((item) => item.pinned);
  const supervisor = room.members.find((member) => member.id === room.currentSupervisorId);
  const actions = [
    {
      label: "کی چی خریده؟ 🛍️",
      description: "خرید مشترک اتاق",
      icon: CircleDollarSign,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      page: "expenses" as const,
    },
    {
      label: "کارای اتاق",
      description: "تقسیم کارها",
      icon: ListTodo,
      tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      page: "tasks" as const,
    },
    {
      label: "فهرست خرید",
      description: "چیزهای موردنیاز",
      icon: ShoppingBasket,
      tone: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
      page: "shopping" as const,
    },
    {
      label: "بچه‌های اتاق",
      description: "اعضای اتاق",
      icon: Users,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      page: "members" as const,
    },
    {
      label: "خبرای اتاق",
      description: "خبرای اتاق",
      icon: BellRing,
      tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      page: "announcements" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> عه، {user.fullName.split(" ")[0]}
          </p>
          <h1 className="font-heading text-[25px] font-bold tracking-tight sm:text-3xl">
            اتاقمون، قرارِ حال‌خوب‌مون <span aria-hidden="true">🌿</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {room.dormitory.name} <span className="px-1">·</span> {room.name} <span className="px-1">·</span>{" "}
            {room.dormitory.university}
          </p>
        </div>
        <Button variant="outline" className="h-10 w-full rounded-xl sm:w-auto" onClick={() => onNavigate("room")}>
          مشاهده‌ی اطلاعات اتاق <ArrowLeft className="size-4" />
        </Button>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-primary text-primary-foreground shadow-[0_16px_40px_-25px_color-mix(in_srgb,var(--primary)_80%,transparent)]">
          <span className="absolute -end-16 -top-24 size-64 rounded-full border border-white/10" />
          <span className="absolute -end-7 -top-16 size-44 rounded-full border border-white/10" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
                  <Home className="size-4" /> اتاقمون
                </div>
                <h2 className="mt-2 font-heading text-xl font-bold sm:text-2xl">{room.dormitory.name}</h2>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  {room.dormitory.university} <span className="px-1">·</span> {room.name}
                </p>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">
                {room.members.length} از {room.capacity} نفر
              </span>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
              <div className="flex min-w-0 items-center gap-3">
                {supervisor && <MemberAvatar member={supervisor} />}
                <div className="min-w-0">
                  <p className="text-[11px] text-primary-foreground/70">سرپرست این هفته</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{supervisor?.fullName ?? "هنوز مشخص نشده"}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => onNavigate("room")}>
                مشخصات اتاق <ArrowLeft className="size-3.5" />
              </Button>
            </div>
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: room.capacity }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${index < room.members.length ? "bg-white/85" : "bg-white/20"}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-1 pt-5">
            <div>
              <CardTitle className="text-base">دنگ‌هامون 💸</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">حساب‌کتاب این ماه</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <Wallet className="size-[18px]" />
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-[26px] font-bold tabular-nums">{toman(finance.totalExpenses)}</span>
              <span className="text-xs text-muted-foreground">تومان هزینه‌ی مشترک</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-[11px] font-medium ${finance.balance < 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}
              >
                {finance.balance < 0
                  ? "بدهی شما: " + toman(finance.debt)
                  : finance.balance > 0
                    ? "طلب شما: " + toman(finance.credit)
                    : "حساب شما صاف است"}
              </span>
              <button
                onClick={() => onNavigate("expenses")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                جزئیات و تسویه
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold text-muted-foreground">دسترسی سریع</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map(({ label, description, icon: Icon, tone, page }) => (
            <button
              key={label}
              onClick={() => onNavigate(page)}
              className="group flex min-h-[82px] items-center gap-3 rounded-2xl border bg-card p-3 text-start transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm sm:p-3.5"
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="size-[19px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold sm:text-sm">{label}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground sm:text-[11px]">
                  {description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
            <div>
              <CardTitle className="text-base">کارهای امروز</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">هرکی یه گوشه‌شو بگیره، زود تمومه</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => onNavigate("tasks")}>
              همه‌ی کارها <ArrowLeft className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="divide-y">
              {todayTasks.length ? (
                todayTasks.map((task) => {
                  const assignee = room.members.find((member) => member.id === task.assignedToId);
                  const done = task.status === "completed";
                  return (
                    <div key={task.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                      <span
                        className={`grid size-5 place-items-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"}`}
                      >
                        {done && <Check className="size-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{assignee?.fullName ?? "عضو سابق"}</p>
                      </div>
                      <Badge variant={done ? "secondary" : "outline"} className="rounded-lg text-[10px]">
                        {done ? "انجام شد" : "امروز"}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  امروز کاری رو سرت نیست؛ حالشو ببر 😎
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <SupervisorCard room={room} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
            <div>
              <CardTitle className="text-base">کارهای پیش رو</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">نوبت‌های بعدی اتاق</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="size-[18px]" />
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-2.5">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl bg-muted/45 p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="size-[17px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {room.members.find((member) => member.id === task.assignedToId)?.fullName ?? "عضو سابق"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                  کار پیش‌رویی ثبت نشده است.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
            <div>
              <CardTitle className="text-base">خبر سنجاق‌شده</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">یادآوری برای همه‌ی بچه‌های اتاق</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <BellRing className="size-[18px]" />
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {pinned ? (
              <button
                onClick={() => onNavigate("announcements")}
                className="w-full rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4 text-start transition-colors hover:bg-amber-500/[0.07]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    <ClipboardList className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{pinned.title}</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">{pinned.message}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">از طرف {pinned.authorName}</p>
                  </div>
                </div>
              </button>
            ) : (
              <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                هنوز اطلاعیه‌ای سنجاق نشده است.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-1 pt-5">
            <div>
              <CardTitle className="text-base">تازه‌های اتاق</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">آخرین خبرها و اتفاقا</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => onNavigate("room")}>
              مشخصات اتاق <ArrowLeft className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-3">
            <ActivityFeed activities={activities} compact limit={4} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
            <div>
              <CardTitle className="text-base">بچه‌های اتاق 🫶</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {room.members.length} نفر در {room.name}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => onNavigate("members")}>
              همه <ArrowLeft className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {room.members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-2 rounded-xl border px-2.5 py-2">
                  <MemberAvatar member={member} size="sm" />
                  <span className="text-xs font-medium">{member.fullName}</span>
                  {member.id === room.currentSupervisorId && <Crown className="size-3 text-amber-600" />}
                </div>
              ))}
              {room.members.length === 0 && (
                <p className="text-xs text-muted-foreground">هنوز عضوی به این اتاق اضافه نشده.</p>
              )}
            </div>
            <button
              onClick={() => onNavigate("members")}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed py-2.5 text-xs font-medium text-primary hover:bg-primary/[0.03]"
            >
              <Plus className="size-3.5" /> دعوت هم‌اتاقی <ArrowLeft className="size-3.5" />
            </button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
