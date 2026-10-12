import { useState } from "react";
import { ArrowLeft, CalendarDays, Check, Crown, Copy, Mail, MoreHorizontal, Shield, UserMinus, Users, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, apiJson } from "@/lib/api";
import type { RoomMember } from "@/features/onboarding/types";
import type { RoomWorkspace } from "@/features/room/types";
import { MemberAvatar } from "@/features/room/components/member-avatar";

export function MembersPage({ room, user, onRoomChange, onNavigate }: RoomWorkspace) {
  const [selected, setSelected] = useState<RoomMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RoomMember | null>(null);
  const isOwner = room.ownerId === user.id;
  const isFull = room.members.length >= room.capacity;

  async function copyInvite() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `دعوت به اتاق ${room.name}`, text: `بیا به اتاق ما توی ${room.dormitory.name} بپیوند! کد دعوت: ${room.code}` });
        toast.success("دعوت رو فرستادیم 💌");
        return;
      }
      await navigator.clipboard.writeText(room.code); toast.success("کد دعوت کپی شد؛ بفرستش برای بچه‌ها 💌");
    }
    catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("اشتراک‌گذاری خودکار در دسترس نیست؛ کد دعوت رو دستی انتخاب کن.");
    }
  }

  async function removeMember() {
    if (!removeTarget || removeTarget.id === room.ownerId || !isOwner) return;
    try {
      const { room: updated } = await api<{ room: typeof room }>(`/rooms/${encodeURIComponent(room.id)}/members/${encodeURIComponent(removeTarget.id)}`, apiJson("DELETE"));
      onRoomChange(updated); toast.success(`${removeTarget.fullName} از اتاق خارج شد`); setRemoveTarget(null); setSelected(null);
    } catch (error) { toast.error(error instanceof Error ? error.message : "حذف عضو انجام نشد."); }
  }

  return <div>
    <div className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground"><button onClick={() => onNavigate("dashboard")} className="hover:text-foreground">اتاقمون</button><ArrowLeft className="size-3" /><span>بچه‌های اتاق</span></div>
    <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">{room.dormitory.name} · {room.name}</Badge><h1 className="font-heading text-2xl font-bold sm:text-3xl">بچه‌های اتاق 🫶</h1><p className="mt-1.5 text-sm text-muted-foreground">اتاق باحال رو با همراهی هم می‌سازیم.</p></div><Button onClick={copyInvite} disabled={isFull} className="h-10 w-full rounded-xl sm:w-auto"><Copy className="size-4" />{isFull ? "ظرفیت اتاق تکمیل است" : "دعوت بچه‌های اتاق"}</Button></section>

    <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3"><Summary icon={Users} label="بچه‌های اتاق" value={`${room.members.length} نفر`} /><Summary icon={UserRound} label="ظرفیت اتاق" value={`${room.capacity} نفر`} /><Summary icon={Crown} label="مدیر اتاق" value={room.members.find((member) => member.id === room.ownerId)?.fullName ?? "مشخص نشده"} /></section>

    {isFull && <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4"><span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"><Users className="size-4" /></span><div><p className="text-sm font-semibold">اتاق به ظرفیت کامل رسیده</p><p className="mt-0.5 text-xs text-muted-foreground">برای دعوت عضو تازه، ابتدا ظرفیت اتاق را در تنظیمات تغییر دهید.</p></div></div>}

    {room.members.length === 0 ? <Card className="rounded-2xl border-dashed shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Users className="size-5" /></span><h2 className="mt-4 font-heading text-lg font-bold">هنوز هم‌اتاقی‌ای ندارید</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">کد دعوت را برای دوستانتان بفرستید تا به این اتاق بپیوندند.</p><Button onClick={copyInvite} className="mt-4 rounded-xl"><Copy className="size-4" /> کپی کد دعوت</Button></CardContent></Card> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{room.members.map((member) => <MemberCard key={member.id} member={member} isCurrentSupervisor={member.id === room.currentSupervisorId} isCurrentUser={member.id === user.id} canRemove={isOwner && member.id !== room.ownerId} onOpen={() => setSelected(member)} onRemove={() => setRemoveTarget(member)} />)}</div>}

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>پروفایل هم‌اتاقی</DialogTitle><DialogDescription>اطلاعات عضویت در این اتاق</DialogDescription></DialogHeader>{selected && <div className="pt-1"><div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4"><MemberAvatar member={selected} size="lg" /><div><p className="font-semibold">{selected.fullName}</p><p className="mt-0.5 text-xs text-muted-foreground">{selected.identifier ?? "عضو هم‌اتاقی"}</p></div></div><div className="mt-4 space-y-3 text-sm"><ProfileLine icon={Shield} label="نقش" value={selected.role === "owner" ? "سازنده‌ی اتاق" : "هم‌اتاقی"} /><ProfileLine icon={CalendarDays} label="تاریخ عضویت" value={selected.joinedAt} /><ProfileLine icon={Check} label="وضعیت عضویت" value={selected.status === "active" ? "فعال" : "دعوت‌شده"} /></div>{selected.id === room.currentSupervisorId && <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"><Crown className="size-4" />سرپرست این هفته</div>}{selected.identifier && <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => { void navigator.clipboard?.writeText(selected.identifier ?? "").then(() => toast.success("راه ارتباطی کپی شد")); }}><Mail className="size-4" /> کپی راه ارتباطی</Button>}</div>}</DialogContent></Dialog>

    <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>این هم‌اتاق از اتاق خارج شود؟</AlertDialogTitle><AlertDialogDescription>{removeTarget?.fullName} دیگر به فضای این اتاق دسترسی نخواهد داشت. این کار فقط در نمونه‌ی محلی انجام می‌شود.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={removeMember}>خارج کردن از اتاق</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <Card className="rounded-2xl border-0"><CardContent className="flex items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-[17px]" /></span><div className="min-w-0"><p className="text-[10px] text-muted-foreground sm:text-xs">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div></CardContent></Card>; }
function ProfileLine({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: string }) { return <div className="flex items-center gap-3"><Icon className="size-4 text-muted-foreground" /><span className="flex-1 text-xs text-muted-foreground">{label}</span><span className="text-xs font-medium">{value}</span></div>; }

function MemberCard({ member, isCurrentSupervisor, isCurrentUser, canRemove, onOpen, onRemove }: { member: RoomMember; isCurrentSupervisor: boolean; isCurrentUser: boolean; canRemove: boolean; onOpen: () => void; onRemove: () => void }) {
  return <Card className="group rounded-2xl border-0 transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="p-4"><div className="flex items-start gap-3"><button onClick={onOpen} aria-label={`نمایش پروفایل ${member.fullName}`}><MemberAvatar member={member} size="lg" /></button><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><button onClick={onOpen} className="truncate text-sm font-semibold hover:text-primary">{member.fullName}</button>{isCurrentUser && <span className="text-[9px] text-muted-foreground">(شما)</span>}</div><p className="mt-0.5 text-[11px] text-muted-foreground">{member.identifier ?? "عضو هم‌اتاقی"}</p></div>{canRemove && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="گزینه‌های عضو"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="text-destructive" onClick={onRemove}><UserMinus /> خارج کردن از اتاق</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div><div className="mt-4 flex flex-wrap items-center gap-1.5 border-t pt-3"><Badge variant={member.role === "owner" ? "default" : "secondary"} className="rounded-full text-[10px]">{member.role === "owner" ? "سازنده‌ی اتاق" : "هم‌اتاقی"}</Badge><Badge variant="outline" className={`rounded-full text-[10px] ${member.status === "active" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}><span className={`me-1 size-1.5 rounded-full ${member.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />{member.status === "active" ? "فعال" : "در انتظار"}</Badge>{isCurrentSupervisor && <Badge variant="outline" className="rounded-full border-amber-500/25 bg-amber-500/[0.04] text-[10px] text-amber-800 dark:text-amber-200"><Crown className="size-3" />سرپرست</Badge>}<span className="ms-auto text-[10px] text-muted-foreground">عضویت از {member.joinedAt}</span></div></CardContent></Card>;
}
