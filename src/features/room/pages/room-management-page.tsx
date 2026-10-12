import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Building2, Check, Copy, DoorOpen, GraduationCap, Home, KeyRound, Pencil, RefreshCw, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, apiJson } from "@/lib/api";
import type { RoomWorkspace } from "@/features/room/types";
import { SupervisorCard } from "@/features/room/components/supervisor-card";

function Breadcrumb({ current }: { current: string }) { return <div className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground"><span>اتاقمون</span><ArrowLeft className="size-3" /><span>{current}</span></div>; }

export function RoomManagementPage({ room, user, onRoomChange, onNavigate, onLeaveRoom, mode }: RoomWorkspace & { mode: "details" | "settings" }) {
  const isOwner = room.ownerId === user.id;
  const [editing, setEditing] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [dormName, setDormName] = useState(room.dormitory.name);
  const [university, setUniversity] = useState(room.dormitory.university);
  const [capacity, setCapacity] = useState(room.capacity);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isSettings = mode === "settings";

  async function copyCode() {
    try { await navigator.clipboard.writeText(room.code); toast.success("کد دعوت کپی شد"); }
    catch { toast.error("کپی خودکار در دسترس نیست؛ کد را دستی انتخاب کنید"); }
  }

  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next: Record<string, string> = {};
    if (name.trim().length < 1) next.name = "نام اتاق را وارد کنید.";
    if (dormName.trim().length < 2) next.dormName = "نام خوابگاه را وارد کنید.";
    if (university.trim().length < 2) next.university = "نام دانشگاه را وارد کنید.";
    if (!Number.isInteger(capacity) || capacity < room.members.length || capacity > 20) next.capacity = `ظرفیت باید بین ${room.members.length} تا ۲۰ نفر باشد.`;
    setErrors(next); if (Object.keys(next).length) return;
    const updated = { ...room, name: name.trim(), description: description.trim(), capacity, dormitory: { ...room.dormitory, name: dormName.trim(), university: university.trim() } };
    onRoomChange(updated);
    setEditing(false); toast.success("مشخصات اتاق ذخیره شد 💙");
  }

  async function regenerateCode() {
    try {
      const { room: updated } = await api<{ room: typeof room }>(`/rooms/${encodeURIComponent(room.id)}/invitation`, apiJson("POST"));
      onRoomChange(updated); setRegenerateOpen(false); toast.success("کد دعوت تازه ساخته شد");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ساخت کد تازه انجام نشد."); }
  }

  async function leaveRoom() {
    const wasOwner = room.ownerId === user.id;
    const nextOwner = wasOwner ? room.members.find((item) => item.id !== user.id) : undefined;
    try {
      await api(`/rooms/${encodeURIComponent(room.id)}/leave`, apiJson("POST", { ...(nextOwner ? { transferTo: nextOwner.id } : {}) }));
      toast.success(wasOwner && nextOwner ? `مدیریت اتاق به ${nextOwner.fullName} سپرده شد` : "از اتاق خارج شدی");
      setLeaveOpen(false); onLeaveRoom();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خروج از اتاق انجام نشد.");
    }
  }

  return <div>
    <Breadcrumb current={isSettings ? "تنظیمات اتاق" : "اطلاعات اتاق"} />
    <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">{isSettings ? "مدیریت اتاق" : "اتاق خوابگاه"}</Badge><h1 className="font-heading text-2xl font-bold sm:text-3xl">{isSettings ? "تنظیمات اتاق" : room.name}</h1><p className="mt-1.5 text-sm text-muted-foreground">{isSettings ? "اطلاعات و دسترسی‌های اتاق را مدیریت کنید." : `${room.dormitory.name} · ${room.dormitory.university}`}</p></div><div className="flex gap-2"><Button variant={isSettings ? "outline" : "default"} className="h-10 flex-1 rounded-xl sm:flex-none" onClick={() => onNavigate("room")}>اطلاعات اتاق</Button><Button variant={isSettings ? "default" : "outline"} className="h-10 flex-1 rounded-xl sm:flex-none" onClick={() => onNavigate("settings")}>تنظیمات</Button></div></section>

    {!isSettings ? <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-2xl border-0"><CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5"><div><CardTitle className="text-base">مشخصات اتاقمون</CardTitle><p className="mt-1 text-xs text-muted-foreground">جزئیات اتاق خوابگاه شما</p></div>{isOwner && <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditing(true)}><Pencil className="size-3.5" /> ویرایش</Button>}</CardHeader><CardContent className="px-5 pb-5"><div className="divide-y">
        <DetailRow icon={Home} label="نام و شماره اتاق" value={room.name} /><DetailRow icon={Building2} label="خوابگاه" value={room.dormitory.name} /><DetailRow icon={GraduationCap} label="دانشگاه" value={room.dormitory.university} /><DetailRow icon={Users} label="ظرفیت اتاق" value={`${room.members.length} از ${room.capacity} نفر`} />
      </div>{room.description && <div className="mt-4 rounded-xl bg-muted/50 p-3.5"><p className="mb-1 text-[11px] text-muted-foreground">درباره‌ی اتاق</p><p className="text-sm leading-6">{room.description}</p></div>}</CardContent></Card>
      <div className="space-y-4"><Card className="rounded-2xl border-0"><CardHeader className="px-5 pb-2 pt-5"><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="size-4 text-primary" />کد دعوت بچه‌های اتاق</CardTitle></CardHeader><CardContent className="px-5 pb-5"><p className="text-xs text-muted-foreground">این کد را فقط با افرادی که می‌خواهید دعوت کنید به اشتراک بگذارید.</p><div className="mt-3 flex items-center gap-2 rounded-xl border bg-muted/30 p-2"><code dir="ltr" className="flex-1 px-2 text-center font-mono text-lg font-bold tracking-[0.16em]">{room.code}</code><Button variant="outline" size="icon" aria-label="کپی کد دعوت" onClick={copyCode}><Copy className="size-4" /></Button></div><Button variant="ghost" className="mt-2 w-full rounded-xl text-xs text-primary" onClick={() => onNavigate("settings")}>مدیریت کد دعوت <ArrowLeft className="size-3.5" /></Button></CardContent></Card><SupervisorCard room={room} /></div>
      <Card className="rounded-2xl border-0 xl:col-span-2"><CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5"><div><CardTitle className="text-base">اعضای اتاق</CardTitle><p className="mt-1 text-xs text-muted-foreground">مالک و بچه‌های اتاقی این اتاق خوابگاه</p></div><Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => onNavigate("members")}>مشاهده‌ی اعضا <ArrowLeft className="size-3.5" /></Button></CardHeader><CardContent className="px-5 pb-5"><div className="flex flex-wrap gap-2">{room.members.map((member) => <span key={member.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><span className="grid size-7 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{member.fullName.slice(0, 1)}</span>{member.fullName}{member.role === "owner" && <Badge variant="secondary" className="h-5 rounded-full text-[9px]">مالک</Badge>}</span>)}{room.members.length < room.capacity && <Button variant="outline" size="sm" className="rounded-xl" onClick={copyCode}><Users className="size-3.5" /> دعوت هم‌اتاقی</Button>}</div></CardContent></Card>
    </div> : <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-2xl border-0"><CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base">تنظیمات اتاق</CardTitle><p className="mt-1 text-xs text-muted-foreground">اطلاعات اصلی و کد دعوت</p></CardHeader><CardContent className="space-y-3 px-5 pb-5"><SettingRow icon={Pencil} title="ویرایش اطلاعات" detail="نام اتاق، خوابگاه و توضیحات" actionLabel="ویرایش" onClick={() => setEditing(true)} disabled={!isOwner} /><SettingRow icon={Copy} title="کد دعوت فعلی" detail={room.code} actionLabel="کپی" onClick={copyCode} /><SettingRow icon={RefreshCw} title="ساخت کد تازه" detail="کد قبلی دیگر قابل استفاده نخواهد بود" actionLabel="تغییر کد" onClick={() => setRegenerateOpen(true)} disabled={!isOwner} /></CardContent></Card>
      <Card className="rounded-2xl border-0"><CardHeader className="px-5 pb-2 pt-5"><CardTitle className="text-base">دسترسی‌های اتاق</CardTitle><p className="mt-1 text-xs text-muted-foreground">نقش شما و مدیریت اعضا</p></CardHeader><CardContent className="space-y-3 px-5 pb-5"><div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3.5"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Shield className="size-4" /></span><div><p className="text-sm font-semibold">{isOwner ? "مدیر اتاق" : "هم‌اتاقی"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{isOwner ? "می‌تونی مشخصات اتاق و بچه‌ها رو مدیریت کنی." : "برای تغییر مشخصات با سازنده‌ی اتاق هماهنگ کن."}</p></div></div><SettingRow icon={Users} title="مدیریت بچه‌های اتاق" detail={`${room.members.length} نفر · ظرفیت ${room.capacity} نفر`} actionLabel="مشاهده" onClick={() => onNavigate("members")} /><SettingRow icon={DoorOpen} title="خروج از اتاق" detail={isOwner ? room.members.length > 1 ? "مدیریت به هم‌اتاقی‌ی بعدی منتقل می‌شود" : "اتاق هم همراه با تو بسته می‌شه" : "از این پس دسترسی شما به اتاق برداشته می‌شود"} actionLabel="خروج از اتاق" onClick={() => setLeaveOpen(true)} danger /></CardContent></Card>
    </div>}

    <Dialog open={editing} onOpenChange={(open) => { setEditing(open); if (open) { setName(room.name); setDescription(room.description ?? ""); setDormName(room.dormitory.name); setUniversity(room.dormitory.university); setCapacity(room.capacity); setErrors({}); } }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>ویرایش اطلاعات اتاق</DialogTitle><DialogDescription>اطلاعات جدید برای همه‌ی بچه‌های اتاق نمایش داده می‌شود.</DialogDescription></DialogHeader><form onSubmit={saveDetails} className="space-y-3.5"><FormField id="edit-room-name" label="نام یا شماره اتاق" error={errors.name}><Input id="edit-room-name" value={name} onChange={(e) => setName(e.target.value)} /></FormField><FormField id="edit-dorm-name" label="نام خوابگاه" error={errors.dormName}><Input id="edit-dorm-name" value={dormName} onChange={(e) => setDormName(e.target.value)} /></FormField><FormField id="edit-university" label="دانشگاه" error={errors.university}><Input id="edit-university" value={university} onChange={(e) => setUniversity(e.target.value)} /></FormField><FormField id="edit-description" label="توضیحات"><Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20 resize-none" /></FormField><FormField id="edit-capacity" label="ظرفیت" error={errors.capacity}><Input id="edit-capacity" type="number" min={room.members.length} max={20} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></FormField><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(false)}>انصراف</Button><Button type="submit">ذخیره تغییرات <Check className="size-4" /></Button></DialogFooter></form></DialogContent></Dialog>

    <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>کد دعوت تغییر کند؟</AlertDialogTitle><AlertDialogDescription>کد فعلی دیگر کار نمی‌کند و بچه‌های اتاقی جدید فقط با کد تازه می‌توانند وارد شوند.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={regenerateCode}>ساخت کد تازه</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>از اتاق خارج می‌شی؟</AlertDialogTitle><AlertDialogDescription>{isOwner ? room.members.length > 1 ? `مدیریت اتاق به ${room.members.find((item) => item.id !== user.id)?.fullName} منتقل می‌شود و عضویت شما برداشته خواهد شد.` : "چون عضو دیگری در اتاق نیست، اتاق نیز بسته خواهد شد." : "عضویت شما برداشته می‌شود و برای بازگشت باید دوباره دعوت شوید."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>همین‌جا می‌مونم</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={leaveRoom}>خروج از اتاق</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className="flex items-center gap-3 py-3"><span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-4" /></span><span className="min-w-0 flex-1 text-xs text-muted-foreground">{label}</span><span className="text-end text-sm font-medium">{value}</span></div>; }
function SettingRow({ icon: Icon, title, detail, actionLabel, onClick, disabled = false, danger = false }: { icon: typeof Home; title: string; detail: string; actionLabel: string; onClick: () => void; disabled?: boolean; danger?: boolean }) { return <div className={`flex items-center gap-3 rounded-xl border p-3 ${disabled ? "opacity-60" : ""}`}><span className={`grid size-9 place-items-center rounded-xl ${danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${danger ? "text-destructive" : ""}`}>{title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p></div><Button variant={danger ? "ghost" : "outline"} size="sm" disabled={disabled} onClick={onClick} className={danger ? "text-destructive hover:text-destructive" : "rounded-lg"}>{actionLabel}</Button></div>; }
function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) { return <div className="space-y-1.5"><label htmlFor={id} className="text-xs font-medium">{label}</label>{children}{error && <p className="text-[11px] text-destructive">{error}</p>}</div>; }
