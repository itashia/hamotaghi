import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AuthFlow } from "@/features/onboarding/pages/auth-flow";
import { clearAppState, hasActiveSession, loadAppState, saveAppState } from "@/features/onboarding/lib/local-state";
import { getRoomById, persistRoom } from "@/features/room/data/room-repository";
import type { RoomPageKey } from "@/features/room/types";
import { AppShell } from "@/layouts/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { refreshSupervisor } from "@/features/supervisor/domain/rotation";
import { api, apiJson, clearApiToken } from "@/lib/api";
import { toast } from "sonner";
import { markNotificationsRead } from "@/features/notifications/data/read-state";
import type { AppUser } from "@/features/onboarding/types";

const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const RoomManagementPage = lazy(() => import("@/features/room/pages/room-management-page").then((module) => ({ default: module.RoomManagementPage })));
const MembersPage = lazy(() => import("@/features/room/pages/members-page").then((module) => ({ default: module.MembersPage })));
const ExpensesPage = lazy(() => import("@/features/expenses/pages/expenses-page").then((module) => ({ default: module.ExpensesPage })));
const TasksPage = lazy(() => import("@/features/tasks/pages/tasks-page").then((module) => ({ default: module.TasksPage })));
const SupervisorPage = lazy(() => import("@/features/supervisor/pages/supervisor-page").then((module) => ({ default: module.SupervisorPage })));
const ShoppingPage = lazy(() => import("@/features/shopping/pages/shopping-page").then((module) => ({ default: module.ShoppingPage })));
const AnnouncementsPage = lazy(() => import("@/features/announcements/pages/announcements-page").then((module) => ({ default: module.AnnouncementsPage })));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/notifications-page").then((module) => ({ default: module.NotificationsPage })));

function hasWorkspace() {
  const state = loadAppState();
  return Boolean(state.onboardingComplete && hasActiveSession() && state.user && state.membership && state.room && getRoomById(state.room.id));
}

function App() {
  const [authenticated, setAuthenticated] = useState(hasWorkspace);
  const [page, setPage] = useState<RoomPageKey>("dashboard");
  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const [previewTitle, setPreviewTitle] = useState("این بخش");
  const [session, setSession] = useState(loadAppState);
  const persistedRoom = session.room ? getRoomById(session.room.id) ?? session.room : null;
  const [room, setRoom] = useState(persistedRoom);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    void Promise.all([api<{ user: AppUser }>("/auth/me"), api<{ room: NonNullable<typeof room> | null }>("/rooms/current")])
      .then(([account, workspace]) => {
        const next = { user: account.user, room: workspace.room, membership: workspace.room ? { userId: account.user.id, roomId: workspace.room.id, role: workspace.room.ownerId === account.user.id ? "owner" as const : "member" as const } : null, onboardingComplete: Boolean(workspace.room) };
        saveAppState(next); setSession(next); setRoom(workspace.room); setAuthenticated(Boolean(workspace.room));
      }).catch(() => { clearApiToken(); clearAppState(); setAuthenticated(false); setRoom(null); }).finally(() => setBooting(false));
  // Bootstrap once from the server so a cleared browser cache does not lose a valid session.
  }, []);

  useEffect(() => {
    const expire = () => { clearApiToken(); clearAppState(); setAuthenticated(false); setRoom(null); setSession(loadAppState()); };
    window.addEventListener("hamotaghi:session-expired", expire);
    return () => window.removeEventListener("hamotaghi:session-expired", expire);
  }, []);

  function completeAuthentication() {
    const next = loadAppState(); setSession(next);
    setRoom(next.room ? getRoomById(next.room.id) ?? next.room : null);
    setPage("dashboard"); setAuthenticated(true);
  }

  function updateRoom(nextRoom: NonNullable<typeof room>) {
    const previousRoom = room;
    persistRoom(nextRoom);
    setRoom(nextRoom);
    const state = loadAppState();
    saveAppState({ ...state, room: nextRoom });
    setSession({ ...state, room: nextRoom });
    void api<{ room: NonNullable<typeof room> }>(`/rooms/${encodeURIComponent(nextRoom.id)}/workspace`, apiJson("PUT", nextRoom))
      .then(({ room: saved }) => { persistRoom(saved); setRoom(saved); setSession((current) => ({ ...current, room: saved })); saveAppState({ ...loadAppState(), room: saved }); })
      .catch(async (error: unknown) => {
        toast.error(error instanceof Error ? error.message : "تغییرات ذخیره نشدند.");
        try {
          const { room: latest } = await api<{ room: NonNullable<typeof room> | null }>("/rooms/current");
          if (latest) { persistRoom(latest); setRoom(latest); setSession((current) => ({ ...current, room: latest })); saveAppState({ ...loadAppState(), room: latest }); }
          else if (previousRoom) { setRoom(previousRoom); saveAppState({ ...loadAppState(), room: previousRoom }); }
        } catch { if (previousRoom) setRoom(previousRoom); }
      });
  }

  function navigate(nextPage: RoomPageKey, title?: string) {
    if (nextPage === "preview") setPreviewTitle(title ?? "این بخش");
    if (nextPage === "notifications" && room) {
      markNotificationsRead(room.id, (room.activities ?? []).map((activity) => activity.id));
      void api(`/rooms/${encodeURIComponent(room.id)}/activity/read`, apiJson("POST"));
    }
    setPage(nextPage);
  }

  function leaveRoom() {
    const state = loadAppState();
    saveAppState({ ...state, room: null, membership: null, onboardingComplete: false });
    setSession({ ...state, room: null, membership: null, onboardingComplete: false }); setRoom(null); setAuthenticated(false);
  }

  useEffect(() => {
    if (!authenticated || !room) return;
    const refreshed = refreshSupervisor(room, new Date());
    if (refreshed.currentSupervisorId !== room.currentSupervisorId || refreshed.nextSupervisorId !== room.nextSupervisorId || refreshed.supervisorPeriod !== room.supervisorPeriod || JSON.stringify(refreshed.supervisorRotationOrder) !== JSON.stringify(room.supervisorRotationOrder)) updateRoom(refreshed);
  }, [authenticated, room]);

  if (booting) return <PageLoading />;
  if (!authenticated) return <AuthFlow onComplete={completeAuthentication} />;

  const currentRoom = room;
  const currentUser = session.user;
  if (!currentRoom || !currentUser) return <AuthFlow onComplete={completeAuthentication} />;

  return <AppShell
    activePage={page}
    onNavigate={navigate}
    userName={currentUser.fullName}
    homeName={currentRoom.dormitory.name}
    activities={currentRoom.activities ?? []}
    roomId={currentRoom.id}
    notificationRefresh={notificationRefresh}
    onLogout={() => {
      // Tear down the local session immediately so a slow logout response cannot leave
      // the previous room rendered while the next account is authenticating.
      clearApiToken(); clearAppState(); setRoom(null); setSession(loadAppState()); setAuthenticated(false); setPage("dashboard");
      void api("/auth/logout", apiJson("POST")).catch(() => undefined);
    }}
  >
    <Suspense fallback={<PageLoading />}>
      {page === "dashboard" && <DashboardPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "room" && <RoomManagementPage mode="details" room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "members" && <MembersPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "settings" && <RoomManagementPage mode="settings" room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "expenses" && <ExpensesPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "tasks" && <TasksPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "supervisor" && <SupervisorPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "shopping" && <ShoppingPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "announcements" && <AnnouncementsPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} />}
      {page === "notifications" && <NotificationsPage room={currentRoom} user={currentUser} onRoomChange={updateRoom} onNavigate={navigate} onLeaveRoom={leaveRoom} onRead={() => setNotificationRefresh((value) => value + 1)} />}
      {page === "preview" && <ComingSoonPage title={previewTitle} onBack={() => navigate("dashboard")} onMembers={() => navigate("members")} />}
    </Suspense>
  </AppShell>;
}

function PageLoading() {
  return <div aria-label="در حال بارگذاری صفحه" className="space-y-5"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-56" /></div><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div><Skeleton className="h-64 rounded-2xl" /></div>;
}

function ComingSoonPage({ title, onBack, onMembers }: { title: string; onBack: () => void; onMembers: () => void }) {
  return <section className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center animate-in fade-in duration-300"><span className="grid size-14 place-items-center rounded-[20px] bg-primary/10 text-primary"><Sparkles className="size-6" /></span><p className="mt-5 rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">یه کم دیگه می‌رسه ✨</p><h1 className="mt-3 font-heading text-2xl font-bold">{title}</h1><p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">این گوشه هنوز آماده نشده؛ فعلاً بریم سراغ بچه‌های اتاق یا کارهای امروز؟</p><div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button variant="outline" onClick={onBack} className="rounded-xl"><ArrowRight className="size-4" /> برگشت به اتاقمون</Button><Button onClick={onMembers} className="rounded-xl">دیدن بچه‌های اتاق <ArrowLeft className="size-4" /></Button></div></section>;
}

export default App;
