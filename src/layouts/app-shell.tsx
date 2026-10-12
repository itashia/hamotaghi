import { useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Bell, ChevronDown, CircleHelp, LogOut, Moon, Settings, Sun, Users, House, PanelRightClose, PanelRightOpen, Wallet, ListTodo, Crown, ShoppingBasket, Ellipsis, Megaphone } from "lucide-react";
import { Brand } from "@/components/app/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RoomPageKey } from "@/features/room/types";
import { loadReadNotificationIds } from "@/features/notifications/data/read-state";
import type { RoomActivity } from "@/features/onboarding/types";

const navItems = [
  { key: "dashboard", label: "اتاقمون", icon: House },
  { key: "expenses", label: "دنگ‌ها", icon: Wallet },
  { key: "tasks", label: "کارامون", icon: ListTodo },
  { key: "supervisor", label: "نوبت‌ها", icon: Crown },
  { key: "shopping", label: "خریدها", icon: ShoppingBasket },
  { key: "announcements", label: "خبرای اتاق", icon: Megaphone },
  { key: "room", label: "مشخصات اتاق", icon: House },
  { key: "members", label: "بچه‌های اتاق", icon: Users },
  { key: "settings", label: "تنظیمات اتاق", icon: Settings },
] as const;

type Props = { children: ReactNode; onLogout?: () => void; userName?: string; homeName?: string; activities: RoomActivity[]; roomId: string; notificationRefresh: number; activePage: RoomPageKey; onNavigate: (page: RoomPageKey, previewTitle?: string) => void };

export function AppShell({ children, onLogout, userName = "علی رضایی", homeName = "خوابگاه آفتاب", activities, roomId, notificationRefresh, activePage, onNavigate }: Props) {
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobilePreviewTitle, setMobilePreviewTitle] = useState("");
  const switchTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const readIds = loadReadNotificationIds(roomId);
  const unreadCount = activities.filter((activity) => !readIds.includes(activity.id)).length;
  void notificationRefresh;
  const go = (page: RoomPageKey, title?: string) => { if (page === "preview") setMobilePreviewTitle(title ?? "این بخش"); onNavigate(page, title); setMoreOpen(false); };
  const primaryMobile = [
    { key: "dashboard" as const, label: "اتاقمون", icon: House },
    { key: "expenses" as const, label: "دنگ‌ها", icon: Wallet },
    { key: "tasks" as const, label: "کارامون", icon: ListTodo },
    { key: "shopping" as const, label: "خریدها", icon: ShoppingBasket },
  ];
  const secondaryMobile = [
    { page: "supervisor" as const, label: "نوبت سرپرستی", icon: Crown },
    { page: "members" as const, label: "بچه‌های اتاق", icon: Users },
    { page: "room" as const, label: "مشخصات اتاق", icon: House },
    { page: "settings" as const, label: "تنظیمات", icon: Settings },
    { page: "announcements" as const, label: "خبرای اتاق", icon: Megaphone },
    { page: "notifications" as const, label: "اعلان‌ها", icon: Bell },
  ];

  const navigation = (collapsed = false) => <nav aria-label="ناوبری اصلی" className="space-y-1.5">
    {!collapsed && <p className="px-3 pb-2 pt-1 text-[11px] font-semibold tracking-wide text-muted-foreground">گوشه‌ی اتاق ما</p>}
    {navItems.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => go(key)} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined} aria-current={activePage === key ? "page" : undefined} className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-start text-sm transition-colors ${collapsed ? "justify-center px-0" : ""} ${activePage === key ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} />{!collapsed && <>{label}{activePage === key && <span className="ms-auto size-1.5 rounded-full bg-primary" />}</>}</button>)}
  </nav>;

  return <div className={`min-h-dvh bg-background text-foreground lg:grid lg:transition-[grid-template-columns] lg:duration-200 ${desktopCollapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]"}`} dir="rtl">
    <aside dir="rtl" className={`fixed inset-y-0 end-0 z-30 hidden flex-col border-e bg-card py-6 text-start transition-[width,padding] duration-200 lg:sticky lg:top-0 lg:col-start-1 lg:row-start-1 lg:flex lg:h-screen ${desktopCollapsed ? "w-[76px] px-3" : "w-[260px] px-5"}`}>
      <div className={`flex items-start ${desktopCollapsed ? "justify-center" : "justify-between"}`}>
        <button type="button" className="w-fit rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => go("dashboard")} aria-label="رفتن به اتاقمون">{desktopCollapsed ? <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><House className="size-5" /></span> : <Brand />}</button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setDesktopCollapsed((value) => !value)} aria-label={desktopCollapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"} title={desktopCollapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"}>{desktopCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}</Button>
      </div>
      <div className="mt-10">{navigation(desktopCollapsed)}</div>
      {!desktopCollapsed && <div className="mt-5 border-t pt-4 text-center text-[11px] text-muted-foreground">هم‌اتاقی · کنار هم، هماهنگ‌تر</div>}
    </aside>

    {moreOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMoreOpen(false)}>
      <section dir="rtl" aria-label="بیشتر" className="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t bg-card px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 shadow-2xl animate-in slide-in-from-bottom-4" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" /><p className="mb-3 font-heading text-lg font-bold">بیشترِ اتاقمون</p>
        <div className="grid grid-cols-2 gap-2">
          {secondaryMobile.map(({ page, label, icon: Icon }) => <button key={label} onClick={() => go(page)} className="flex min-h-12 items-center gap-3 rounded-2xl border p-3 text-start text-sm font-medium transition-colors hover:bg-muted"><Icon className="size-[18px] text-primary" />{label}</button>)}
          <button onClick={() => { setMoreOpen(false); onLogout?.(); }} className="flex min-h-12 items-center gap-3 rounded-2xl border p-3 text-start text-sm font-medium text-destructive"><LogOut className="size-[18px]" />خروج از حساب</button>
        </div>
      </section>
    </div>}

    <div className="min-w-0 lg:col-start-2 lg:row-start-1">
      <header className="sticky top-0 z-20 flex min-h-[calc(72px+env(safe-area-inset-top))] items-center justify-between border-b bg-background/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:px-7 lg:min-h-[72px] lg:px-10 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 sm:hidden"><p className="truncate text-[11px] text-muted-foreground">سلام {userName.split(" ")[0]} 👋</p><p className="truncate text-sm font-semibold">{homeName}</p></div>
          <div className="hidden min-w-0 sm:block"><p className="text-xs text-muted-foreground">خوش اومدی به اتاق</p><p className="truncate text-sm font-semibold">{homeName}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Button variant="ghost" size="icon" aria-label={theme === "dark" ? "فعال کردن پوسته روشن" : "فعال کردن پوسته تاریک"} onClick={switchTheme}>{theme === "dark" ? <Sun /> : <Moon />}</Button>
          <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount ? "اعلان‌ها، " + unreadCount + " خوانده‌نشده" : "اعلان‌ها"} onClick={() => go("notifications")}><Bell />{unreadCount > 0 && <span className="absolute end-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-background bg-rose-500 px-0.5 text-[8px] font-bold leading-none text-white">{unreadCount > 9 ? "۹+" : unreadCount}</span>}</Button>
          <span className="mx-1 hidden h-8 w-px bg-border sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1.5 text-start outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar><AvatarFallback className="bg-primary/15 font-semibold text-primary">{userName.slice(0, 1)}</AvatarFallback></Avatar>
              <span className="hidden sm:block"><span className="block text-sm font-semibold leading-5">{userName}</span><span className="block text-[11px] text-muted-foreground">هم‌اتاقی</span></span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-2"><p className="text-sm font-semibold">{userName}</p><p className="text-xs text-muted-foreground">پروفایل هم‌اتاقی</p></div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => go("settings")}><Settings /> تنظیمات اتاق</DropdownMenuItem>
              <DropdownMenuItem onClick={() => go("preview", "راهنما و پشتیبانی")}><CircleHelp /> راهنما و پشتیبانی</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}><LogOut /> خروج از حساب</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100dvh-72px)] max-w-[1440px] px-3 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pt-7 lg:min-h-[calc(100dvh-72px)] lg:px-10 lg:pb-10 lg:pt-9"><div key={activePage} className="animate-in fade-in slide-in-from-bottom-1 duration-300">{children}</div></main>
    </div>

    <nav aria-label="ناوبری موبایل" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 shadow-[0_-8px_24px_rgba(31,41,51,.06)] backdrop-blur lg:hidden">
      {primaryMobile.map(({ key, label, icon: Icon }) => { const isActive = activePage === key; return <button key={label} type="button" onClick={() => go(key)} aria-current={isActive ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition-all duration-200 active:scale-95 ${isActive ? "font-bold text-primary" : "text-muted-foreground"}`}><Icon className={`size-[19px] transition-transform duration-200 ${isActive ? "-translate-y-0.5" : ""}`} strokeWidth={isActive ? 2.2 : 1.8} />{label}</button>; })}
      <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] transition-colors ${moreOpen || ["room", "members", "settings", "supervisor"].includes(activePage) || (activePage === "preview" && mobilePreviewTitle !== "چی کم داریم؟") ? "font-bold text-primary" : "text-muted-foreground"}`}><Ellipsis className="size-[19px]" strokeWidth={2} />بیشتر</button>
    </nav>
  </div>;
}
