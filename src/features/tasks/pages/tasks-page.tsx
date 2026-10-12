import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, ListTodo, Plus, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { RoomWorkspace } from "@/features/room/types";
import type { ChoreRotation, RecurrenceFrequency, RoomTask, TaskPriority } from "../types";
import { getNextOccurrenceDate, nextRotationAssignee, occurrenceKey } from "../domain/rotation";
import { todayISO } from "@/lib/jalali";

const isoToday = todayISO;
const dateLabel = (value: string) => new Date(value + "T12:00:00").toLocaleDateString("fa-IR", { day: "numeric", month: "short" });
const priorities: { id: TaskPriority; title: string }[] = [{ id: "low", title: "کم" }, { id: "normal", title: "معمولی" }, { id: "high", title: "زیاد" }];
const rank = (value: TaskPriority) => value === "high" ? 2 : value === "normal" ? 1 : 0;

export function TasksPage({ room, user, onRoomChange }: RoomWorkspace) {
  const tasks = room.tasks ?? [];
  const members = room.members.filter((member) => member.status === "active");
  const today = isoToday();
  const [range, setRange] = useState("today");
  const [status, setStatus] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTask | null>(null);
  const [deleting, setDeleting] = useState<RoomTask | null>(null);
  const endDate = new Date(); endDate.setDate(endDate.getDate() + 7);
  const weekEnd = [endDate.getFullYear(), String(endDate.getMonth() + 1).padStart(2, "0"), String(endDate.getDate()).padStart(2, "0")].join("-");
  const visible = useMemo(() => tasks.filter((task) => (range === "all" || (range === "today" ? task.dueDate === today : task.dueDate >= today && task.dueDate <= weekEnd)) && (status === "all" || task.status === status) && (assignee === "all" || task.assignedToId === assignee)).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || rank(b.priority) - rank(a.priority)), [tasks, range, today, weekEnd, status, assignee]);

  function saveTask(task: RoomTask) {
    const next = editing ? tasks.map((item) => item.id === editing.id ? task : item) : [task, ...tasks];
    let rotations = room.choreRotations ?? [];
    if (!editing && task.recurrence && task.seriesId && !rotations.some((item) => item.seriesId === task.seriesId)) rotations = [...rotations, { seriesId: task.seriesId, orderIds: members.map((member) => member.id), lastAssignedId: task.assignedToId, generatedOccurrenceKeys: task.occurrenceKey ? [task.occurrenceKey] : [] }];
    onRoomChange({ ...room, tasks: next, choreRotations: rotations });
    toast.success(editing ? "کار ویرایش شد" : "این کار هم سپرده شد 🙌"); setOpen(false); setEditing(null);
  }

  function toggleTask(task: RoomTask) {
    const completing = task.status !== "completed";
    const nextTasks = tasks.map((item) => item.id === task.id ? { ...item, status: completing ? "completed" as const : "open" as const, completedAt: completing ? new Date().toISOString() : undefined } : item);
    let rotations: ChoreRotation[] = [...(room.choreRotations ?? [])];
    if (completing && task.recurrence && task.seriesId) {
      const existing = rotations.find((item) => item.seriesId === task.seriesId);
      const rotation = existing ?? { seriesId: task.seriesId, orderIds: members.map((member) => member.id), lastAssignedId: task.assignedToId, generatedOccurrenceKeys: [] };
      const dueDate = getNextOccurrenceDate(task.dueDate, task.recurrence);
      const key = occurrenceKey(task.seriesId, dueDate);
      const duplicate = rotation.generatedOccurrenceKeys.includes(key) || tasks.some((item) => item.occurrenceKey === key);
      const nextAssignee = nextRotationAssignee(rotation, room.members, task.assignedToId);
      if (!duplicate && nextAssignee) {
        nextTasks.unshift({ ...task, id: "task-" + Date.now(), occurrenceKey: key, assignedToId: nextAssignee, dueDate, status: "open", completedAt: undefined });
        const nextRotation = { ...rotation, lastAssignedId: nextAssignee, generatedOccurrenceKeys: [...rotation.generatedOccurrenceKeys, key] };
        rotations = existing ? rotations.map((item) => item.seriesId === task.seriesId ? nextRotation : item) : [...rotations, nextRotation];
      }
    }
    onRoomChange({ ...room, tasks: nextTasks, choreRotations: rotations });
    toast.success(completing ? "دمت گرم، انجام شد! ✅" : "کار به فهرست فعال برگشت");
  }
  function removeTask() { if (!deleting) return; onRoomChange({ ...room, tasks: tasks.filter((item) => item.id !== deleting.id) }); toast.success("کار حذف شد"); setDeleting(null); }

  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">نوبتی و باهم</Badge><h1 className="font-heading text-2xl font-bold sm:text-3xl">کارای اتاق</h1><p className="mt-1.5 text-sm text-muted-foreground">کارا رو بچرخونیم که همیشه گردن یه نفر نمونه.</p></div><Button onClick={() => { setEditing(null); setOpen(true); }} className="h-10 w-full rounded-xl sm:w-auto"><Plus className="size-4" /> کار جدید</Button></header>
    <section className="grid grid-cols-3 gap-3">{[[CalendarDays, "کارهای امروز", tasks.filter((t) => t.dueDate === today && t.status === "open").length], [Check, "انجام‌شده", tasks.filter((t) => t.status === "completed").length], [RotateCw, "تکرارشونده", tasks.filter((t) => t.recurrence && t.status === "open").length]].map(([Icon, title, value], i) => { const I = Icon as typeof Check; return <Card key={i} className="rounded-2xl border-0"><CardContent className="flex items-center gap-3 p-3.5"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><I className="size-4" /></span><div><p className="text-[10px] text-muted-foreground">{title as string}</p><p className="text-lg font-bold tabular-nums">{new Intl.NumberFormat("fa-IR").format(value as number)}</p></div></CardContent></Card>; })}</section>
    <Card className="rounded-2xl border-0"><CardHeader className="gap-4 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">برنامه‌ی کارها</CardTitle><p className="mt-1 text-xs text-muted-foreground">مسئول و زمان انجام هر کار</p></div><div className="flex flex-wrap gap-2"><select aria-label="فیلتر مسئول" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="all">همه‌ی اعضا</option>{members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}</select><select aria-label="وضعیت کار" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-xs"><option value="all">همه‌ی وضعیت‌ها</option><option value="open">در انتظار</option><option value="completed">انجام‌شده</option></select></div></CardHeader><CardContent className="px-5 pb-5">
      <div className="mb-4 flex gap-1 rounded-xl bg-muted/45 p-1">{[{ id: "today", name: "امروز" }, { id: "week", name: "این هفته" }, { id: "all", name: "همه" }].map((item) => <button key={item.id} onClick={() => setRange(item.id)} className={"flex-1 rounded-lg px-3 py-2 text-xs font-medium " + (range === item.id ? "bg-background shadow-sm" : "text-muted-foreground")}>{item.name}</button>)}</div>
      {visible.length ? <div className="space-y-2">{visible.map((task) => { const done = task.status === "completed"; const owner = room.members.find((m) => m.id === task.assignedToId); return <article key={task.id} className={"flex items-start gap-3 rounded-xl border p-3.5 " + (done ? "bg-muted/20" : "hover:border-primary/25")}><button onClick={() => toggleTask(task)} aria-label={done ? "بازگرداندن کار" : "انجام کار"} className={"mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border " + (done ? "border-primary bg-primary text-primary-foreground" : "text-transparent hover:border-primary")}>{done && <Check className="size-3.5" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className={"text-sm font-semibold " + (done ? "text-muted-foreground line-through" : "")}>{task.title}</h3>{task.recurrence && <Badge variant="outline" className="gap-1 rounded-full text-[10px]"><RotateCw className="size-3" />{task.recurrence === "daily" ? "روزانه" : "هفتگی"}</Badge>}</div>{task.description && <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>}<p className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground"><span>{owner?.fullName ?? "عضو سابق"}</span><span>{dateLabel(task.dueDate)}</span><span>اولویت {priorities.find((p) => p.id === task.priority)?.title}</span></p></div><div className="flex gap-1"><Button variant="ghost" size="icon" className="size-8" aria-label="ویرایش کار" onClick={() => { setEditing(task); setOpen(true); }}>✎</Button><Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="حذف کار" onClick={() => setDeleting(task)}><Trash2 className="size-3.5" /></Button></div></article>; })}</div> : <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed text-center"><ListTodo className="size-6 text-primary" /><p className="mt-3 text-sm font-semibold">فعلاً کاری رو سرت نریخته؛ حالشو ببر 😎</p><p className="mt-1 text-xs text-muted-foreground">یک کار ثبت کنید تا تقسیم مسئولیت‌ها شروع شود.</p><Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}><Plus className="size-3.5" /> ثبت کار</Button></div>}
    </CardContent></Card>
    <TaskForm key={editing?.id ?? (open ? "new" : "closed")} open={open} task={editing} members={members} userId={user.id} onClose={() => { setOpen(false); setEditing(null); }} onSave={saveTask} />
    <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>این کار حذف شود؟</AlertDialogTitle><AlertDialogDescription>«{deleting?.title}» از برنامه‌ی اتاق حذف می‌شه.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={removeTask}>حذف کار</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function TaskForm({ open, task, members, userId, onClose, onSave }: { open: boolean; task: RoomTask | null; members: RoomWorkspace["room"]["members"]; userId: string; onClose: () => void; onSave: (task: RoomTask) => void }) {
  const [title, setTitle] = useState(task?.title ?? ""); const [description, setDescription] = useState(task?.description ?? ""); const [assigned, setAssigned] = useState(task?.assignedToId ?? members[0]?.id ?? ""); const [due, setDue] = useState(task?.dueDate ?? isoToday()); const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "normal"); const [recurrence, setRecurrence] = useState<"none" | RecurrenceFrequency>(task?.recurrence ?? "none"); const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (title.trim().length < 2) { setError("عنوان کار باید دست‌کم دو حرف داشته باشد."); return; } if (!members.some((m) => m.id === assigned)) { setError("یک مسئول فعال انتخاب کنید."); return; } if (!due) { setError("تاریخ انجام را انتخاب کنید."); return; } const series = task?.seriesId ?? (recurrence === "none" ? undefined : "series-" + Date.now()); onSave({ id: task?.id ?? "task-" + Date.now(), seriesId: series, occurrenceKey: task?.occurrenceKey ?? (series ? occurrenceKey(series, due) : undefined), title: title.trim(), description: description.trim() || undefined, assignedToId: assigned, createdById: task?.createdById ?? userId, dueDate: due, priority, status: task?.status ?? "open", recurrence: recurrence === "none" ? undefined : recurrence, completedAt: task?.completedAt }); }
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{task ? "ویرایش کار" : "ثبت کار جدید"}</DialogTitle><DialogDescription>جزئیات کار و مسئول آن را مشخص کنید.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><Field label="عنوان کار"><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً شستن ظرف‌های شام" className="rounded-xl" /></Field><div className="grid grid-cols-2 gap-3"><Field label="مسئول"><select value={assigned} onChange={(e) => setAssigned(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">{members.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}</select></Field><Field label="موعد انجام"><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="اولویت"><select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">{priorities.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field><Field label="تکرار"><select value={recurrence} onChange={(e) => setRecurrence(e.target.value as "none" | RecurrenceFrequency)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="none">بدون تکرار</option><option value="daily">هر روز</option><option value="weekly">هر هفته</option></select></Field></div><Field label="توضیحات"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" className="min-h-20 resize-none rounded-xl" /></Field>{error && <p role="alert" className="text-xs text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={onClose}>انصراف</Button><Button type="submit">{task ? "ذخیره تغییرات" : "ثبت کار"}<Check className="size-4" /></Button></DialogFooter></form></DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="block text-xs font-medium">{label}</span>{children}</label>; }
