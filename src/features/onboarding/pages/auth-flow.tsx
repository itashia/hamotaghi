import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ClipboardCheck, Copy, DoorOpen, Eye, EyeOff, GraduationCap, Home, KeyRound, LoaderCircle, LockKeyhole, Mail, MapPin, Moon, Plus, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { Brand } from "@/components/app/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { hasActiveSession, loadAppState, saveAppState } from "../lib/local-state";
import { api, apiJson, ApiError } from "@/lib/api";
import type { AppUser, AuthScreen, Dormitory, LocalAppState, Room } from "../types";

type Props = { onComplete: () => void };
const draftKey = "hamotaghi-onboarding-draft-v1";
const initialDormitory: Dormitory = { name: "", university: "", description: "" };
const fieldClass = "h-11 rounded-xl bg-background px-3.5 text-sm shadow-none placeholder:text-muted-foreground/70";

function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return <div className="space-y-1.5"><label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>{children}{error && <p className="text-xs text-destructive">{error}</p>}{hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

function AuthFrame({ children, mode, onWelcome, onTheme }: { children: ReactNode; mode: "welcome" | "form"; onWelcome: () => void; onTheme: () => void }) {
  return <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1fr_0.92fr]">
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#eaf4ed] p-10 text-[#183a32] dark:bg-[#182d28] dark:text-[#dff3e9] lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute -end-28 -top-32 size-[440px] rounded-full border border-primary/10" /><div className="absolute -end-12 -top-16 size-[315px] rounded-full border border-primary/10" />
      <div className="relative z-10"><button onClick={onWelcome} aria-label="صفحه آغاز" className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"><Brand /></button></div>
      <div className="relative z-10 mx-auto w-full max-w-[500px] py-10">
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="size-4" /> اتاق دانشجویی، با حال بهتر</p>
        <h1 className="font-heading text-4xl font-bold leading-[1.55] xl:text-[46px]">زندگی کنار هم،<br />ساده‌تر از همیشه.</h1>
        <p className="mt-4 max-w-md text-[15px] leading-8 text-foreground/65">دنگ‌ها، ظرفای نشسته و خریدای دقیقه‌نودی؛ همه‌چی رو با هم جمع‌وجور کنیم.</p>
        <div className="relative mt-10 h-[250px] overflow-hidden rounded-[30px] border border-white/70 bg-white/65 p-5 shadow-[0_24px_60px_-36px_rgba(20,70,53,.4)] dark:border-white/10 dark:bg-white/5">
          <div className="absolute inset-x-5 top-5 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold"><span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><Home className="size-4" /></span>خوابگاه آفتاب</div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-700 dark:text-emerald-300">همه‌چیز مرتبه</span></div>
          <div className="absolute inset-x-5 bottom-5 grid grid-cols-3 gap-3">
            {[{ icon: WalletGlyph, label: "هزینه‌ها", value: "۴.۸ م" }, { icon: Users, label: "بچه‌های اتاق", value: "۴ نفر" }, { icon: ClipboardCheck, label: "کارای اتاق", value: "۳ کار" }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-border/60 bg-background/80 p-3.5"><span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><p className="mt-3 text-[10px] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold">{value}</p></div>)}
          </div>
          <div className="absolute bottom-[116px] start-6 flex -space-x-2 rtl:space-x-reverse">{["ع", "س", "م", "ا"].map((x, i) => <span key={i} className={`grid size-8 place-items-center rounded-full border-2 border-background text-[11px] font-semibold ${["bg-emerald-100 text-emerald-800", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-800", "bg-sky-100 text-sky-800"][i]}`}>{x}</span>)}</div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-foreground/60"><ShieldCheck className="size-4 text-primary" />یه گوشه‌ی امن برای جمع خودمونی‌تون</div>
      </div>
      <p className="relative z-10 text-xs text-foreground/50">هم‌اتاقی · شروع یک زندگی هماهنگ</p>
    </aside>
    <main className="flex min-h-screen flex-col px-5 py-5 sm:px-10 lg:px-12 xl:px-20">
      <header className="flex items-center justify-between lg:justify-end"><div className="lg:hidden"><button onClick={onWelcome} aria-label="صفحه آغاز"><Brand /></button></div><Button variant="ghost" size="icon" aria-label="تغییر پوسته" onClick={onTheme}><Moon className="size-[18px]" /></Button></header>
      <div className={`mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-9 ${mode === "welcome" ? "lg:max-w-[470px]" : ""}`}>{children}</div>
      <footer className="py-2 text-center text-[11px] text-muted-foreground">اطلاعات حساب و اتاق شما به‌صورت امن ذخیره می‌شود.</footer>
    </main>
  </div>;
}

function WalletGlyph({ className }: { className?: string }) { return <span className={className}><KeyRound className="size-4" /></span>; }

function Welcome({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="mb-7 grid size-14 place-items-center rounded-[20px] bg-primary/10 text-primary lg:hidden"><Home className="size-7" /></div>
    <BadgeLine>برای اتاق مشترکمون</BadgeLine>
    <h2 className="mt-3 font-heading text-[32px] font-bold leading-[1.5] tracking-tight sm:text-4xl">هر اتاق، یه<br className="hidden sm:block" /> حال خوبِ مشترک.</h2>
    <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">با هم‌اتاقی هماهنگی‌های اتاق رو راحت کنید و بیشتر از کنار هم بودن لذت ببرید.</p>
    <div className="mt-8 space-y-3"><Button onClick={onRegister} className="h-12 w-full rounded-xl text-sm font-semibold">ساخت حساب <ArrowLeft className="size-4" /></Button><Button onClick={onLogin} variant="outline" className="h-12 w-full rounded-xl text-sm">ورود به حساب</Button></div>
    <p className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />رایگان، ساده و مخصوص اتاق خودتون</p>
  </div>;
}

function BadgeLine({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />{children}</span>; }

export function AuthFlow({ onComplete }: Props) {
  const { theme, setTheme } = useTheme();
  const resetQuery = new URLSearchParams(window.location.search);
  const [screen, setScreen] = useState<AuthScreen>(() => {
    if (new URLSearchParams(window.location.search).has("token")) return "reset-password";
    const state = loadAppState();
    return hasActiveSession() && state.user ? (state.onboardingComplete ? "dashboard" : "onboarding") : "welcome";
  });
  const [appState, setAppState] = useState<LocalAppState>(loadAppState);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState(resetQuery.get("email") ?? "");
  const resetToken = resetQuery.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const savedDraft = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) ?? "{}") as { dormitory?: Dormitory; roomName?: string; capacity?: number; description?: string; step?: number }; } catch { return {}; }
  }, []);
  const [dormitory, setDormitory] = useState<Dormitory>(savedDraft.dormitory ?? initialDormitory);
  const [roomName, setRoomName] = useState(savedDraft.roomName ?? "");
  const [capacity, setCapacity] = useState(savedDraft.capacity ?? 5);
  const [roomDescription, setRoomDescription] = useState(savedDraft.description ?? "");
  const [createStep, setCreateStep] = useState(savedDraft.step ?? 1);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);

  useEffect(() => { localStorage.setItem(draftKey, JSON.stringify({ dormitory, roomName, capacity, description: roomDescription, step: createStep })); }, [dormitory, roomName, capacity, roomDescription, createStep]);
  useEffect(() => { if (screen === "dashboard" && appState.onboardingComplete) onComplete(); }, [screen, appState.onboardingComplete, onComplete]);

  function transition(next: AuthScreen) { setNotice(""); setErrors({}); setScreen(next); }
  function updateState(next: LocalAppState) { setAppState(next); saveAppState(next); }
  function finish(user: AppUser, room: Room, role: "owner" | "member") {
    const next = { user, room, membership: { userId: user.id, roomId: room.id, role }, onboardingComplete: true } satisfies LocalAppState;
    updateState(next); localStorage.removeItem(draftKey); setScreen(role === "owner" ? "room-success" : "join-success");
  }
  function setApiErrors(error: unknown) {
    if (error instanceof ApiError) {
      const fields = Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0] ?? error.message]));
      setErrors(Object.keys(fields).length ? fields : { form: error.message });
    } else setErrors({ form: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید." });
  }

  function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors({}); setBusy(true);
    void api<{ message: string }>("/auth/forgot-password", apiJson("POST", { email: recoveryEmail.trim() }))
      .then(({ message }) => setNotice(message || "اگر حسابی با این ایمیل باشد، لینک بازیابی ارسال می‌شود."))
      .catch(setApiErrors).finally(() => setBusy(false));
  }

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors({});
    if (resetPassword.length < 8 || !/[a-z]/.test(resetPassword) || !/[A-Z]/.test(resetPassword) || !/\d/.test(resetPassword)) { setErrors({ password: "رمز عبور باید دست‌کم ۸ نویسه و شامل حرف کوچک، حرف بزرگ و عدد باشد." }); return; }
    if (resetPassword !== resetPasswordConfirmation) { setErrors({ password_confirmation: "تکرار رمز عبور یکسان نیست." }); return; }
    setBusy(true);
    void api<{ message: string }>("/auth/reset-password", apiJson("POST", { token: resetToken, email: recoveryEmail.trim(), password: resetPassword, password_confirmation: resetPasswordConfirmation }))
      .then(({ message }) => { window.history.replaceState({}, "", window.location.pathname); transition("login"); setNotice(message || "رمز عبور تغییر کرد؛ حالا وارد شوید."); })
      .catch(setApiErrors).finally(() => setBusy(false));
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "نام و نام خانوادگی را کامل وارد کنید.";
    if (!/^(?:[^\s@]+@[^\s@]+\.[^\s@]+|09\d{9})$/.test(identifier.trim())) next.identifier = "ایمیل معتبر یا شماره موبایل ۱۱ رقمی وارد کنید.";
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) next.password = "رمز عبور باید دست‌کم ۸ نویسه و شامل حرف کوچک، حرف بزرگ و عدد باشد.";
    if (password !== confirmPassword) next.confirmPassword = "تکرار رمز عبور با رمز واردشده یکسان نیست.";
    setErrors(next); if (Object.keys(next).length) return;
    setBusy(true);
    void api<{ user: AppUser }>("/auth/register", apiJson("POST", {
      name: name.trim(), email: identifier.includes("@") ? identifier.trim() : null, phone: identifier.includes("@") ? null : identifier.trim(), password, password_confirmation: confirmPassword,
    })).then(({ user }) => { updateState({ user, room: null, membership: null, onboardingComplete: false }); transition("onboarding"); }).catch(setApiErrors).finally(() => setBusy(false));
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next: Record<string, string> = {};
    if (!identifier.trim()) next.identifier = "ایمیل یا شماره موبایل را وارد کنید.";
    if (!password) next.password = "رمز عبور را وارد کنید.";
    setErrors(next); if (Object.keys(next).length) return;
    setBusy(true);
    void api<{ user: AppUser; room?: Room | null }>("/auth/login", apiJson("POST", { identifier: identifier.trim(), password })).then(async ({ user }) => {
      const { room } = await api<{ room: Room | null }>("/rooms/current");
      if (room) finish(user, room, room.ownerId === user.id ? "owner" : "member");
      else { updateState({ user, room: null, membership: null, onboardingComplete: false }); setScreen("onboarding"); }
    }).catch(setApiErrors).finally(() => setBusy(false));
  }

  function validateDormitory() {
    const next: Record<string, string> = {};
    if (dormitory.name.trim().length < 2) next.dormitory = "نام خوابگاه را وارد کنید.";
    if (dormitory.university.trim().length < 2) next.university = "نام دانشگاه را وارد کنید.";
    setErrors(next); if (Object.keys(next).length) return;
    setCreateStep(2);
  }

  function validateRoom() {
    const next: Record<string, string> = {};
    if (roomName.trim().length < 1) next.roomName = "نام یا شماره اتاق را وارد کنید.";
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 20) next.capacity = "ظرفیت باید بین ۲ تا ۲۰ نفر باشد.";
    setErrors(next); if (Object.keys(next).length) return;
    setCreateStep(3);
  }

  function createRoom() {
    const owner = appState.user;
    if (!owner) return;
    setBusy(true);
    void api<{ room: Room }>("/rooms", apiJson("POST", { dormitory: { ...dormitory, name: dormitory.name.trim(), university: dormitory.university.trim() }, name: roomName.trim(), capacity, description: roomDescription.trim() || null })).then(({ room }) => { setInviteCode(room.code); finish(owner, room, "owner"); }).catch(setApiErrors).finally(() => setBusy(false));
  }

  function lookupRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors({}); setNotice(""); setPreviewRoom(null);
    const normalized = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,12}$/.test(normalized)) { setErrors({ code: "کد دعوت باید ۴ تا ۱۲ حرف یا عدد باشد." }); return; }
    setBusy(true);
    void api<{ room: { id: string; name: string; dormitory: string; university: string; capacity: number; memberCount: number } }>(`/rooms/invitations/${encodeURIComponent(normalized)}`).then(({ room }) => {
      if (room.memberCount >= room.capacity) { setErrors({ code: "ظرفیت این اتاق تکمیل شده است." }); return; }
      setPreviewRoom({ id: room.id, code: normalized, name: room.name, capacity: room.capacity, dormitory: { name: room.dormitory, university: room.university }, memberIds: Array.from({ length: room.memberCount }, (_, i) => `preview-${i}`), ownerId: "", members: Array.from({ length: room.memberCount }, (_, i) => ({ id: `preview-${i}`, fullName: "عضو اتاق", role: "member" as const, joinedAt: "", status: "active" as const })), currentSupervisorId: "", nextSupervisorId: "", supervisorPeriod: "" });
    }).catch(setApiErrors).finally(() => setBusy(false));
  }

  function joinRoom() {
    if (!appState.user || !previewRoom) return;
    setBusy(true);
    void api<{ room: Room }>("/rooms/join", apiJson("POST", { code: joinCode.trim().toUpperCase() })).then(({ room }) => finish(appState.user!, room, "member")).catch(setApiErrors).finally(() => setBusy(false));
  }

  function enterDashboard() { setScreen("dashboard"); onComplete(); }
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  if (screen === "dashboard") return null;

  if (screen === "welcome") return <AuthFrame mode="welcome" onWelcome={() => transition("welcome")} onTheme={toggleTheme}><Welcome onLogin={() => transition("login")} onRegister={() => transition("register")} /></AuthFrame>;

  if (screen === "login" || screen === "register") {
    const registering = screen === "register";
    return <AuthFrame mode="form" onWelcome={() => transition("welcome")} onTheme={toggleTheme}>
      <button onClick={() => transition("welcome")} className="mb-6 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"><ArrowRight className="size-3.5" /> بازگشت</button>
      <BadgeLine>{registering ? "شروعی تازه" : "خوش اومدی دوباره"}</BadgeLine>
      <h1 className="mt-3 font-heading text-3xl font-bold">{registering ? "حساب کاربری بسازید" : "به جمع برگرد"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{registering ? "چند قدم مونده تا جمع‌وجورتر شدن کارای اتاق." : "برای ادامه، وارد حسابت شو."}</p>
      {registering ? <form className="mt-7 space-y-4" onSubmit={submitRegister} noValidate>
        <Field label="نام و نام خانوادگی" htmlFor="full-name" error={errors.name}><Input id="full-name" autoComplete="name" className={fieldClass} placeholder="مثلاً علی رضایی" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} /></Field>
        <Field label="ایمیل یا شماره موبایل" htmlFor="register-identifier" error={errors.identifier}><div className="relative"><Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="register-identifier" autoComplete="username" className={`${fieldClass} ps-10`} placeholder="you@example.com یا ۰۹۱۲…" value={identifier} onChange={(e) => setIdentifier(e.target.value)} dir="auto" aria-invalid={Boolean(errors.identifier)} /></div></Field>
        <Field label="رمز عبور" htmlFor="register-password" error={errors.password} hint="۸ نویسه یا بیشتر؛ شامل حرف کوچک، بزرگ و عدد"><PasswordInput id="register-password" value={password} onChange={setPassword} visible={showPassword} toggle={() => setShowPassword(!showPassword)} /></Field>
        <Field label="تکرار رمز عبور" htmlFor="confirm-password" error={errors.confirmPassword}><PasswordInput id="confirm-password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} toggle={() => setShowConfirm(!showConfirm)} /></Field>
        <p className="text-xs leading-6 text-muted-foreground">با ساخت حساب، با <button type="button" className="text-primary hover:underline" onClick={() => setNotice("با ادامه، استفاده از هم‌اتاقی را می‌پذیرید.")}>شرایط استفاده</button> موافقت می‌کنید.</p>
        {notice && <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">{notice}</p>}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">{busy ? <><LoaderCircle className="size-4 animate-spin" /> در حال ساخت حساب…</> : <>ادامه <ArrowLeft className="size-4" /></>}</Button>
      </form> : <form className="mt-7 space-y-4" onSubmit={submitLogin} noValidate>
        <Field label="ایمیل یا شماره موبایل" htmlFor="login-identifier" error={errors.identifier}><div className="relative"><Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="login-identifier" autoComplete="username" className={`${fieldClass} ps-10`} placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} dir="auto" /></div></Field>
        <Field label="رمز عبور" htmlFor="login-password" error={errors.password}><PasswordInput id="login-password" value={password} onChange={setPassword} visible={showPassword} toggle={() => setShowPassword(!showPassword)} /></Field>
        {!registering && <button type="button" onClick={() => { setRecoveryEmail(identifier.includes("@") ? identifier : ""); transition("forgot-password"); }} className="text-xs font-medium text-primary hover:underline">رمز عبور را فراموش کرده‌اید؟</button>}
        {errors.form && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs leading-6 text-destructive">{errors.form}</p>}
        {!registering && notice && <p role="status" className="rounded-xl bg-primary/10 p-3 text-xs text-primary">{notice}</p>}
        <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">{busy ? <><LoaderCircle className="size-4 animate-spin" /> در حال ورود…</> : <>ورود به حساب <ArrowLeft className="size-4" /></>}</Button>
      </form>}
      <p className="mt-6 text-center text-sm text-muted-foreground">{registering ? "قبلاً حساب ساخته‌اید؟" : "هنوز حساب ندارید؟"} <button onClick={() => transition(registering ? "login" : "register")} className="font-semibold text-primary hover:underline">{registering ? "وارد شوید" : "ثبت‌نام کنید"}</button></p>
    </AuthFrame>;
  }

  if (screen === "forgot-password" || screen === "reset-password") return <AuthFrame mode="form" onWelcome={() => transition("welcome")} onTheme={toggleTheme}>
    <button onClick={() => transition("login")} className="mb-6 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"><ArrowRight className="size-3.5" /> بازگشت به ورود</button>
    <BadgeLine>{screen === "forgot-password" ? "بازیابی حساب" : "رمز تازه"}</BadgeLine>
    <h1 className="mt-3 font-heading text-3xl font-bold">{screen === "forgot-password" ? "لینک بازیابی بفرستیم؟" : "رمز عبور تازه بسازید"}</h1>
    <p className="mt-2 text-sm leading-7 text-muted-foreground">{screen === "forgot-password" ? "ایمیل حساب را وارد کنید تا لینک امن تغییر رمز برایتان ارسال شود." : "ایمیل حساب و رمز تازه را وارد کنید."}</p>
    <form className="mt-7 space-y-4" onSubmit={screen === "forgot-password" ? requestReset : submitReset}>
      <Field label="ایمیل" htmlFor="recovery-email" error={errors.email}><Input id="recovery-email" type="email" autoComplete="email" className={fieldClass} value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} required /></Field>
      {screen === "reset-password" && <><Field label="رمز عبور تازه" htmlFor="new-password" error={errors.password}><PasswordInput id="new-password" value={resetPassword} onChange={setResetPassword} visible={showPassword} toggle={() => setShowPassword(!showPassword)} /></Field><Field label="تکرار رمز تازه" htmlFor="new-password-confirmation" error={errors.password_confirmation}><PasswordInput id="new-password-confirmation" value={resetPasswordConfirmation} onChange={setResetPasswordConfirmation} visible={showConfirm} toggle={() => setShowConfirm(!showConfirm)} /></Field></>}
      {errors.form && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{errors.form}</p>}
      {notice && <p role="status" className="rounded-xl bg-primary/10 p-3 text-xs text-primary">{notice}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">{busy ? <><LoaderCircle className="size-4 animate-spin" /> در حال ارسال…</> : screen === "forgot-password" ? "ارسال لینک بازیابی" : "تغییر رمز عبور"}</Button>
    </form>
  </AuthFrame>;

  if (screen === "onboarding") return <OnboardingFrame onBack={() => { updateState({ ...appState, user: null }); transition("welcome"); }} step={1} onTheme={toggleTheme}>
    <div className="text-center"><BadgeLine>عه، خوش اومدی {appState.user?.fullName.split(" ")[0] ?? "دوست خوب"}</BadgeLine><h1 className="mt-4 font-heading text-3xl font-bold">از کجا شروع کنیم؟</h1><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">اتاقتون رو بسازید یا با کد دعوت به جمع بچه‌های اتاق بپیوندید.</p></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <button onClick={() => { setCreateStep(1); transition("create-room"); }} className="group relative overflow-hidden rounded-[24px] border bg-card p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="absolute -end-6 -top-7 size-28 rounded-full bg-primary/[0.07] transition-transform duration-500 group-hover:scale-125" /><span className="relative grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Home className="size-6" /></span><h2 className="relative mt-5 text-base font-bold">ساخت اتاق جدید</h2><p className="relative mt-2 text-xs leading-6 text-muted-foreground">اتاق خوابگاهتون رو بسازید و بچه‌های اتاق را دعوت کنید.</p><span className="relative mt-5 flex items-center gap-1 text-xs font-semibold text-primary">شروع ساخت <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" /></span>
      </button>
      <button onClick={() => transition("join-room")} className="group relative overflow-hidden rounded-[24px] border bg-card p-5 text-start shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="absolute -end-6 -top-7 size-28 rounded-full bg-amber-500/[0.08] transition-transform duration-500 group-hover:scale-125" /><span className="relative grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><DoorOpen className="size-6" /></span><h2 className="relative mt-5 text-base font-bold">پیوستن به اتاق</h2><p className="relative mt-2 text-xs leading-6 text-muted-foreground">کدی که هم‌اتاقی‌ت فرستاده رو وارد کن.</p><span className="relative mt-5 flex items-center gap-1 text-xs font-semibold text-primary">وارد کردن کد <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" /></span>
      </button>
    </div>
    <button onClick={() => transition("welcome")} className="mx-auto mt-6 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowRight className="size-3.5" /> بعداً انجام می‌دهم</button>
  </OnboardingFrame>;

  if (screen === "create-room") return <OnboardingFrame onBack={() => createStep === 1 ? transition("onboarding") : setCreateStep(createStep - 1)} step={createStep} onTheme={toggleTheme}>
    <div className="mb-6"><BadgeLine>ساخت اتاق جدید</BadgeLine><h1 className="mt-3 font-heading text-2xl font-bold">{createStep === 1 ? "خوابگاهتان را معرفی کنید" : createStep === 2 ? "اتاق را آماده کنید" : "همه‌چیز آماده است"}</h1><p className="mt-1.5 text-sm text-muted-foreground">{createStep === 1 ? "اول کمی درباره محل زندگی‌تان بگویید." : createStep === 2 ? "یک اتاق بسازید تا بچه‌های اتاق به آن بپیوندند." : "پیش از ساخت، اطلاعات را یک‌بار مرور کنید."}</p></div>
    {createStep === 1 && <div className="space-y-4 animate-in fade-in slide-in-from-start-2 duration-300"><Field label="نام خوابگاه" htmlFor="dorm-name" error={errors.dormitory}><Input id="dorm-name" className={fieldClass} placeholder="مثلاً خوابگاه آفتاب" value={dormitory.name} onChange={(e) => setDormitory({ ...dormitory, name: e.target.value })} /></Field><Field label="نام دانشگاه" htmlFor="university" error={errors.university}><div className="relative"><GraduationCap className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="university" className={`${fieldClass} ps-10`} placeholder="مثلاً دانشگاه تهران" value={dormitory.university} onChange={(e) => setDormitory({ ...dormitory, university: e.target.value })} /></div></Field><Field label="توضیحات" htmlFor="dorm-description" hint="اختیاری"><Textarea id="dorm-description" className="min-h-20 resize-none rounded-xl bg-background text-sm" placeholder="چیزی که خوب است بچه‌های اتاق بدانند…" value={dormitory.description} onChange={(e) => setDormitory({ ...dormitory, description: e.target.value })} /></Field><Button onClick={validateDormitory} className="h-11 w-full rounded-xl">ادامه <ArrowLeft className="size-4" /></Button></div>}
    {createStep === 2 && <div className="space-y-4 animate-in fade-in slide-in-from-start-2 duration-300"><Field label="نام یا شماره اتاق" htmlFor="room-name" error={errors.roomName}><Input id="room-name" className={fieldClass} placeholder="مثلاً اتاق ۱۲۴" value={roomName} onChange={(e) => setRoomName(e.target.value)} /></Field><Field label="ظرفیت اتاق" htmlFor="capacity" error={errors.capacity} hint="حداکثر تعداد بچه‌های اتاق"><div className="flex h-11 items-center justify-between rounded-xl border bg-background px-2"><button type="button" aria-label="کم کردن ظرفیت" onClick={() => setCapacity(Math.max(2, capacity - 1))} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><X className="size-4 rotate-45" /></button><span className="text-sm font-semibold">{capacity} نفر</span><button type="button" aria-label="افزایش ظرفیت" onClick={() => setCapacity(Math.min(20, capacity + 1))} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><Plus className="size-4" /></button><input id="capacity" className="sr-only" value={capacity} readOnly /></div></Field><Field label="درباره‌ی اتاق" htmlFor="room-description" hint="اختیاری"><Textarea id="room-description" className="min-h-20 resize-none rounded-xl bg-background text-sm" placeholder="مثلاً اتاق دنج و پرنور در طبقه دوم" value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} /></Field><Button onClick={validateRoom} className="h-11 w-full rounded-xl">مرور اطلاعات <ArrowLeft className="size-4" /></Button></div>}
    {createStep === 3 && <div className="animate-in fade-in slide-in-from-start-2 duration-300"><div className="overflow-hidden rounded-2xl border bg-card"><div className="flex items-start gap-3 border-b p-4"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="size-5" /></span><div><p className="font-semibold">{dormitory.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{dormitory.university}</p></div></div><div className="space-y-3 p-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">اتاق</span><span className="font-semibold">{roomName}</span></div><div className="flex justify-between"><span className="text-muted-foreground">ظرفیت</span><span className="font-semibold">{capacity} نفر</span></div>{roomDescription && <p className="border-t pt-3 text-xs leading-6 text-muted-foreground">{roomDescription}</p>}</div></div><p className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />تو سازنده‌ی این اتاق می‌شی.</p><Button onClick={createRoom} disabled={busy} className="h-11 w-full rounded-xl">{busy ? <><LoaderCircle className="size-4 animate-spin" /> داریم اتاق رو می‌سازیم…</> : <>ساخت اتاق <ArrowLeft className="size-4" /></>}</Button></div>}
  </OnboardingFrame>;

  if (screen === "join-room") return <OnboardingFrame onBack={() => transition("onboarding")} step={2} onTheme={toggleTheme}>
    <BadgeLine>پیوستن به اتاق</BadgeLine><h1 className="mt-3 font-heading text-2xl font-bold">کد دعوت را وارد کنید</h1><p className="mt-1.5 text-sm leading-7 text-muted-foreground">کد رو از یکی از بچه‌های اتاق بگیر تا مشخصاتش رو ببینی.</p>
    <form className="mt-6 space-y-3" onSubmit={lookupRoom} noValidate><Field label="کد دعوت" htmlFor="invite-code" error={errors.code}><div className="relative"><KeyRound className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="invite-code" autoCapitalize="characters" className={`${fieldClass} ps-10 text-left font-mono tracking-[0.16em]`} dir="ltr" placeholder="مثلاً AFTAB5" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} /></div></Field><Button type="submit" className="h-11 w-full rounded-xl">بررسی کد <ArrowLeft className="size-4" /></Button></form>
    <div className="mt-5 rounded-xl bg-muted/60 p-3 text-xs leading-6 text-muted-foreground">کد دعوت را از مدیر اتاق بگیرید؛ پیش از پیوستن، مشخصات اتاق را می‌بینید.</div>
    {previewRoom && <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 rounded-2xl border bg-card p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Home className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-bold">{previewRoom.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{previewRoom.dormitory.name}</p></div><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">جای خالی دارد</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs"><div><p className="text-muted-foreground">دانشگاه</p><p className="mt-1 font-medium">{previewRoom.dormitory.university}</p></div><div><p className="text-muted-foreground">اعضای اتاق</p><p className="mt-1 font-medium">{previewRoom.memberIds.length} از {previewRoom.capacity} نفر</p></div></div>{previewRoom.dormitory.description && <p className="mt-3 text-xs text-muted-foreground">{previewRoom.dormitory.description}</p>}<Button onClick={joinRoom} disabled={busy} className="mt-4 h-11 w-full rounded-xl">{busy ? <><LoaderCircle className="size-4 animate-spin" /> در حال پیوستن…</> : <>پیوستن به اتاق <ArrowLeft className="size-4" /></>}</Button></div>}
  </OnboardingFrame>;

  if (screen === "room-success" || screen === "join-success") return <OnboardingFrame onBack={() => undefined} step={3} onTheme={toggleTheme} hideBack>
    <div className="mx-auto grid size-[76px] place-items-center rounded-[26px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="size-10" strokeWidth={1.6} /></div><div className="mt-5 text-center"><BadgeLine>{screen === "room-success" ? "اتاق آماده شد" : "به جمع‌تان خوش آمدید"}</BadgeLine><h1 className="mt-3 font-heading text-2xl font-bold">{screen === "room-success" ? "اتاقتون آمادست!" : "حالا رسماً هم‌اتاقی‌اید"}</h1><p className="mt-2 text-sm leading-7 text-muted-foreground">{screen === "room-success" ? "کد دعوت را برای هم‌اتاقی‌هایتان بفرستید تا بیان تو جمع." : "اتاق جدیدتون آمادست؛ از اینجا می‌توانید با بچه‌های اتاق هماهنگ شوید."}</p></div>
    {screen === "room-success" && <div className="mt-6 rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">کد دعوت اتاق</p><div className="mt-2 flex items-center justify-between gap-2"><code dir="ltr" className="font-mono text-xl font-bold tracking-[0.18em] text-primary">{inviteCode || appState.room?.code}</code><Button variant="outline" size="sm" className="rounded-lg" onClick={() => { void navigator.clipboard?.writeText(inviteCode || appState.room?.code || "").then(() => setNotice("کد دعوت کپی شد."), () => setNotice("کد را انتخاب و کپی کنید.")); }}><Copy className="size-3.5" /> کپی</Button></div>{notice && <p className="mt-2 text-xs text-primary">{notice}</p>}<p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{appState.room?.dormitory.name} · {appState.room?.name}</p></div>}
    {screen === "join-success" && <div className="mt-6 rounded-2xl border bg-card p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Home className="size-5" /></span><div><p className="font-semibold">{appState.room?.name}</p><p className="text-xs text-muted-foreground">{appState.room?.dormitory.name}</p></div></div></div>}
    <Button onClick={enterDashboard} className="mt-6 h-11 w-full rounded-xl">بریم تو اتاقمون <ArrowLeft className="size-4" /></Button>
  </OnboardingFrame>;

  return null;
}

function PasswordInput({ id, value, onChange, visible, toggle }: { id: string; value: string; onChange: (value: string) => void; visible: boolean; toggle: () => void }) {
  return <div className="relative"><LockKeyhole className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={id} type={visible ? "text" : "password"} autoComplete={id === "register-password" ? "new-password" : "current-password"} className={`${fieldClass} ps-10 pe-11`} placeholder="••••••••" value={value} onChange={(e) => onChange(e.target.value)} /><button type="button" aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"} onClick={toggle} className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>;
}

function OnboardingFrame({ children, onBack, step, onTheme, hideBack = false }: { children: ReactNode; onBack: () => void; step: number; onTheme: () => void; hideBack?: boolean }) {
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-8 sm:py-7"><header className="mx-auto flex max-w-5xl items-center justify-between"><div className="flex items-center gap-3">{!hideBack && <Button variant="ghost" size="icon" aria-label="بازگشت" onClick={onBack}><ChevronLeft className="size-5" /></Button>}<Brand /></div><Button variant="ghost" size="icon" aria-label="تغییر پوسته" onClick={onTheme}><Moon className="size-[18px]" /></Button></header><div className="mx-auto mt-8 max-w-[620px] sm:mt-12"><div className="mb-8 flex items-center gap-3" aria-label={`مرحله ${step} از ۳`}><div className="flex flex-1 gap-1.5">{[1, 2, 3].map((n) => <span key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= step ? "bg-primary" : "bg-muted"}`} />)}</div><span className="whitespace-nowrap text-[11px] text-muted-foreground">مرحله {step} از ۳</span></div><section key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</section></div><footer className="mx-auto mt-12 max-w-5xl border-t pt-4 text-center text-[11px] text-muted-foreground">هم‌اتاقی · یه اتاق، یه تیم</footer></main>;
}
