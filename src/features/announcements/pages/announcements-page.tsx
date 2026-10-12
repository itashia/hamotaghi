import { useState, type FormEvent } from "react";
import { BellRing, Pin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { RoomWorkspace } from "@/features/room/types";
import type { RoomAnnouncement } from "../types";

export function AnnouncementsPage({ room, user, onRoomChange }: RoomWorkspace) {
  const announcements = room.announcements ?? [];
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<RoomAnnouncement | null>(null);
  const owner = room.ownerId === user.id;
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 3) { setError("عنوان اطلاعیه دست‌کم سه حرف باشد."); return; }
    if (message.trim().length < 8) { setError("متن اطلاعیه کمی بیشتر توضیح داشته باشد."); return; }
    const item: RoomAnnouncement = { id: "announcement-" + Date.now(), title: title.trim(), message: message.trim(), authorId: user.id, authorName: user.fullName, createdAt: new Date().toISOString(), pinned: false };
    onRoomChange({ ...room, announcements: [item, ...announcements] });
    setTitle(""); setMessage(""); setError(""); toast.success("اطلاعیه برای هم‌اتاقی‌ها منتشر شد");
  }
  function pin(item: RoomAnnouncement) {
    onRoomChange({ ...room, announcements: announcements.map((row) => ({ ...row, pinned: row.id === item.id ? !row.pinned : false })) });
    toast.success(item.pinned ? "اطلاعیه از بالای فهرست برداشته شد" : "اطلاعیه سنجاق شد");
  }
  function remove() {
    if (!deleting) return;
    onRoomChange({ ...room, announcements: announcements.filter((item) => item.id !== deleting.id) });
    toast.success("اطلاعیه حذف شد"); setDeleting(null);
  }
  return <div className="mx-auto max-w-3xl space-y-6">
    <header><Badge variant="secondary" className="mb-3 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">خبرهای هم‌خانه‌ها</Badge><h1 className="font-heading text-2xl font-bold sm:text-3xl">اطلاعیه‌ها</h1><p className="mt-1.5 text-sm text-muted-foreground">قرارها و نکته‌های مهم خانه را با همه در میان بگذارید.</p></header>
    <Card className="rounded-2xl border-0"><CardHeader className="px-5 pb-3 pt-5"><CardTitle className="flex items-center gap-2 text-base"><Plus className="size-4 text-primary" />اطلاعیه‌ی تازه</CardTitle></CardHeader><CardContent className="px-5 pb-5"><form onSubmit={publish} className="space-y-3"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="عنوان کوتاه" aria-label="عنوان اطلاعیه" className="rounded-xl" /><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="چه چیزی را لازم است همه بدانند؟" aria-label="متن اطلاعیه" className="min-h-24 resize-y rounded-xl" />{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end"><Button type="submit" className="rounded-xl">انتشار اطلاعیه <BellRing className="size-4" /></Button></div></form></CardContent></Card>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">اطلاعیه‌های اتاق</h2><span className="text-xs text-muted-foreground">{announcements.length} مورد</span></div>
      {announcements.length ? announcements.map((item) => <Card key={item.id} className={"rounded-2xl border-0 " + (item.pinned ? "ring-1 ring-amber-500/20" : "")}><CardContent className="p-5"><div className="flex items-start gap-3"><span className={"mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl " + (item.pinned ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary")}><BellRing className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.title}</h3>{item.pinned && <Badge variant="secondary" className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300"><Pin className="me-1 size-3" />سنجاق‌شده</Badge>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item.message}</p><p className="mt-3 text-[11px] text-muted-foreground">{item.authorName} · {new Date(item.createdAt).toLocaleDateString("fa-IR", { day: "numeric", month: "long" })}</p></div></div><div className="mt-4 flex justify-end gap-2 border-t pt-3">{owner && <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => pin(item)}><Pin className="size-3.5" />{item.pinned ? "برداشتن سنجاق" : "سنجاق کردن"}</Button>}{(owner || item.authorId === user.id) && <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-destructive" onClick={() => setDeleting(item)}><Trash2 className="size-3.5" />حذف</Button>}</div></CardContent></Card>) : <Card className="rounded-2xl border-0"><CardContent className="flex min-h-40 flex-col items-center justify-center text-center"><span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground"><BellRing className="size-5" /></span><p className="mt-3 text-sm font-semibold">هنوز اطلاعیه‌ای منتشر نشده</p><p className="mt-1 text-xs text-muted-foreground">اولین نکته‌ی مشترک خانه را ثبت کنید.</p></CardContent></Card>}
    </section>
    <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>اطلاعیه حذف شود؟</AlertDialogTitle><AlertDialogDescription>«{deleting?.title}» از فهرست همه‌ی هم‌اتاقی‌ها پاک می‌شود.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>حذف اطلاعیه</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
