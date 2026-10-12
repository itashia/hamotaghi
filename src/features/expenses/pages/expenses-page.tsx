import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleDollarSign,
  CreditCard,
  Filter,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ExpenseCategory, SharedExpense, SettlementSuggestion } from "@/features/expenses/types";
import {
  calculateBalances,
  getFinancialSummary,
  splitAmount,
  validateSettlement,
} from "@/features/expenses/domain/finance";
import type { RoomWorkspace } from "@/features/room/types";
import { todayISO } from "@/lib/jalali";

const categories: { id: ExpenseCategory; label: string }[] = [
  { id: "groceries", label: "خرید خوراکی" },
  { id: "utilities", label: "قبوض" },
  { id: "supplies", label: "وسایل اتاق" },
  { id: "maintenance", label: "تعمیر و نگهداری" },
  { id: "other", label: "سایر" },
];
const categoryLabel = (category: ExpenseCategory) => categories.find((item) => item.id === category)?.label ?? "سایر";
const money = (amount: number) => `${new Intl.NumberFormat("fa-IR").format(Math.abs(amount))} تومان`;

export function ExpensesPage({ room, user, onRoomChange }: RoomWorkspace) {
  const expenses = room.expenses ?? [];
  const settlements = room.settlements ?? [];
  const memberIds = room.members.map((member) => member.id);
  const summary = useMemo(
    () => getFinancialSummary(expenses, settlements, memberIds, user.id),
    [expenses, settlements, memberIds.join("|"), user.id],
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SharedExpense | null>(null);
  const [viewing, setViewing] = useState<SharedExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SharedExpense | null>(null);
  const [settlementTarget, setSettlementTarget] = useState<SettlementSuggestion | null>(null);

  const filtered = useMemo(
    () =>
      [...expenses]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .filter(
          (expense) =>
            (categoryFilter === "all" || expense.category === categoryFilter) &&
            (payerFilter === "all" || expense.payerId === payerFilter) &&
            (!fromDate || expense.date >= fromDate) &&
            (!toDate || expense.date <= toDate),
        ),
    [expenses, categoryFilter, payerFilter, fromDate, toDate],
  );
  const memberName = (id: string) => room.members.find((member) => member.id === id)?.fullName ?? "هم‌اتاقی‌ی سابق";

  function saveExpense(expense: SharedExpense) {
    const next = editing ? expenses.map((item) => (item.id === editing.id ? expense : item)) : [expense, ...expenses];
    onRoomChange({ ...room, expenses: next });
    toast.success(editing ? "تغییرات دنگ ذخیره شد" : "دمت گرم! دنگ ثبت شد 💙");
    setFormOpen(false);
    setEditing(null);
  }

  function deleteExpense() {
    if (!deleteTarget) return;
    onRoomChange({ ...room, expenses: expenses.filter((expense) => expense.id !== deleteTarget.id) });
    toast.success("هزینه حذف شد و مانده‌ها دوباره محاسبه شدند");
    setDeleteTarget(null);
    setViewing(null);
  }

  function recordSettlement() {
    if (!settlementTarget) return;
    const balances = calculateBalances(expenses, settlements, memberIds);
    const issue = validateSettlement(
      balances,
      settlementTarget.fromMemberId,
      settlementTarget.toMemberId,
      settlementTarget.amount,
    );
    if (issue) {
      toast.error(issue);
      setSettlementTarget(null);
      return;
    }
    const settlement = {
      id: `settlement-${Date.now()}`,
      fromMemberId: settlementTarget.fromMemberId,
      toMemberId: settlementTarget.toMemberId,
      amount: settlementTarget.amount,
      date: todayISO(),
      recordedBy: user.id,
    };
    onRoomChange({ ...room, settlements: [settlement, ...settlements] });
    toast.success("حساب ثبت شد؛ مانده‌ها هم به‌روز شدن");
    setSettlementTarget(null);
  }

  function startEdit(expense: SharedExpense) {
    setEditing(expense);
    setFormOpen(true);
    setViewing(null);
  }
  function startCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">
            دنگ‌هامون 💸
          </Badge>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">دنگ‌ها</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            هزینه‌های مشترک را شفاف ثبت کنید و سهم‌ها را راحت‌تر صاف کنید.
          </p>
        </div>
        <Button onClick={startCreate} className="h-10 w-full rounded-xl sm:w-auto">
          <Plus className="size-4" /> کی چی خریده؟ 🛍️
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard icon={ReceiptText} label="کل هزینه‌های مشترک" amount={summary.totalExpenses} tone="sky" />
        <SummaryCard icon={ArrowDownLeft} label="بدهی شما" amount={summary.debt} tone="amber" />
        <SummaryCard icon={ArrowUpRight} label="طلب شما" amount={summary.credit} tone="mint" />
        <SummaryCard
          icon={Wallet}
          label="مانده‌ی خالص شما"
          amount={summary.balance}
          signed
          tone={summary.balance < 0 ? "amber" : "mint"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl border-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-5">
            <div>
              <CardTitle className="text-base">حسابامونو صاف کنیم 💰</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">بیاید حسابامونو راحت صاف کنیم</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-[18px]" />
            </span>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {summary.suggestions.length ? (
              <div className="space-y-2">
                {summary.suggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.fromMemberId}-${suggestion.toMemberId}`}
                    className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3"
                  >
                    <span className="text-xs font-semibold">{memberName(suggestion.fromMemberId)}</span>
                    <ArrowLeft className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{memberName(suggestion.toMemberId)}</span>
                    <span className="ms-auto text-sm font-bold tabular-nums">{money(suggestion.amount)}</span>
                    <Button
                      size="sm"
                      className="w-full rounded-lg sm:ms-2 sm:w-auto"
                      onClick={() => setSettlementTarget(suggestion)}
                    >
                      <Check className="size-3.5" /> ثبت پرداخت
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center">
                <p className="text-sm font-semibold">همه‌حساب‌ها صاف است</p>
                <p className="mt-1 text-xs text-muted-foreground">فعلاً تسویه‌ای برای ثبت ندارید.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base">تاریخچه‌ی تسویه‌ها</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">پرداخت‌هایی که بین بچه‌های اتاق ثبت شده</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {settlements.length ? (
              <div className="space-y-2">
                {[...settlements]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 4)
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/45 p-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <Check className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {memberName(item.fromMemberId)} به {memberName(item.toMemberId)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(`${item.date}T12:00:00`).toLocaleDateString("fa-IR")}
                        </p>
                      </div>
                      <span className="text-xs font-bold tabular-nums">{money(item.amount)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                فعلاً حسابی صاف نشده؛ بعداً می‌بینیمش.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-0">
        <CardHeader className="flex flex-col gap-3 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">تاریخچه‌ی هزینه‌ها</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">هر پرداخت و سهم‌ها در یک نگاه</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> فیلترها
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/35 p-2 sm:grid-cols-4">
            <select
              aria-label="فیلتر دسته‌بندی"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-9 rounded-lg border bg-background px-2 text-xs"
            >
              <option value="all">همه‌ی دسته‌ها</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              aria-label="فیلتر پرداخت‌کننده"
              value={payerFilter}
              onChange={(event) => setPayerFilter(event.target.value)}
              className="h-9 rounded-lg border bg-background px-2 text-xs"
            >
              <option value="all">همه‌ی پرداخت‌کننده‌ها</option>
              {room.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName}
                </option>
              ))}
            </select>
            <Input
              aria-label="از تاریخ"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-9 rounded-lg bg-background text-xs"
            />
            <Input
              aria-label="تا تاریخ"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-9 rounded-lg bg-background text-xs"
            />
          </div>
          {filtered.length ? (
            <div className="divide-y">
              {filtered.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  payerName={memberName(expense.payerId)}
                  participantCount={expense.participantIds.length}
                  onOpen={() => setViewing(expense)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed text-center">
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <ReceiptText className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">هنوز کسی دست به جیب نشده 😂</p>
              <p className="mt-1 text-xs text-muted-foreground">فیلترها را تغییر دهید یا اولین هزینه را ثبت کنید.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseForm
        key={editing?.id ?? (formOpen ? "new" : "closed")}
        open={formOpen}
        expense={editing}
        members={room.members}
        currentUserId={user.id}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={saveExpense}
      />
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              {viewing &&
                `${categoryLabel(viewing.category)} · ${new Date(`${viewing.date}T12:00:00`).toLocaleDateString("fa-IR")}`}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/45 p-4">
                <p className="text-xs text-muted-foreground">مبلغ کل</p>
                <p className="mt-1 text-xl font-bold">{money(viewing.amount)}</p>
                <p className="mt-2 text-xs text-muted-foreground">پرداخت‌کننده: {memberName(viewing.payerId)}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold">تقسیم سهم‌ها</p>
                <div className="space-y-2">
                  {splitAmount(viewing.amount, viewing.participantIds).map((share) => (
                    <div key={share.memberId} className="flex justify-between text-xs">
                      <span>
                        {memberName(share.memberId)}
                        {share.memberId === viewing.payerId && (
                          <span className="ms-1 text-muted-foreground">(پرداخت‌کننده)</span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums">{money(share.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {viewing.description && (
                <p className="border-t pt-3 text-sm leading-6 text-muted-foreground">{viewing.description}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => startEdit(viewing)}>
                  <Pencil className="size-4" /> ویرایش
                </Button>
                <Button variant="destructive" onClick={() => setDeleteTarget(viewing)}>
                  <Trash2 className="size-4" /> حذف
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>این هزینه حذف شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              هزینه از جمع حساب‌ها حذف می‌شود و بدهی‌ها و طلب‌ها دوباره محاسبه خواهند شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteExpense}>
              حذف هزینه
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(settlementTarget)}
        onOpenChange={(open) => {
          if (!open) setSettlementTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>پرداخت ثبت بشه؟</AlertDialogTitle>
            <AlertDialogDescription>
              {settlementTarget &&
                `${memberName(settlementTarget.fromMemberId)} مبلغ ${money(settlementTarget.amount)} به ${memberName(settlementTarget.toMemberId)} پرداخت کرده است. پس از تأیید، مانده‌ها به‌روز می‌شوند.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>بررسی دوباره</AlertDialogCancel>
            <AlertDialogAction onClick={recordSettlement}>تأیید و ثبت پرداخت</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExpenseForm({
  open,
  expense,
  members,
  currentUserId,
  onClose,
  onSave,
}: {
  open: boolean;
  expense: SharedExpense | null;
  members: RoomWorkspace["room"]["members"];
  currentUserId: string;
  onClose: () => void;
  onSave: (expense: SharedExpense) => void;
}) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense?.amount ? String(expense.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "groceries");
  const [date, setDate] = useState(expense?.date ?? todayISO());
  const [payerId, setPayerId] = useState(expense?.payerId ?? currentUserId);
  const [participantIds, setParticipantIds] = useState(
    expense?.participantIds ?? members.filter((member) => member.status === "active").map((member) => member.id),
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const participants = members.filter((member) => participantIds.includes(member.id));
  const validAmount = Number.isSafeInteger(Number(amount)) && Number(amount) > 0;
  const shares =
    validAmount && participants.length
      ? splitAmount(
          Number(amount),
          participants.map((member) => member.id),
        )
      : [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = "عنوان هزینه را وارد کنید.";
    if (!validAmount) next.amount = "مبلغ باید عدد صحیح و بیشتر از صفر باشد.";
    if (!date) next.date = "تاریخ هزینه را انتخاب کنید.";
    if (!members.some((member) => member.id === payerId)) next.payerId = "پرداخت‌کننده را انتخاب کنید.";
    if (!participantIds.length) next.participants = "حداقل یک عضو باید در تقسیم هزینه باشد.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      id: expense?.id ?? `expense-${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      description: description.trim() || undefined,
      payerId,
      participantIds,
      shares: splitAmount(Number(amount), participantIds),
      createdAt: expense?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{expense ? "ویرایش هزینه" : "کی چی خریده؟ 🛍️"}</DialogTitle>
          <DialogDescription>سهم هرکی رو قبل از ثبت می‌بینی، خیالت راحت.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="عنوان هزینه" error={errors.title}>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً خرید میوه‌ی هفته"
              className="rounded-xl"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="مبلغ (تومان)" error={errors.amount}>
              <Input
                inputMode="numeric"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="۵۰۰۰۰۰"
                dir="ltr"
                className="rounded-xl text-left tabular-nums"
              />
            </Field>
            <Field label="تاریخ" error={errors.date}>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="دسته‌بندی">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="پرداخت‌کننده" error={errors.payerId}>
              <select
                value={payerId}
                onChange={(event) => setPayerId(event.target.value)}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="چه کسانی در هزینه شریک‌اند؟" error={errors.participants}>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const selected = participantIds.includes(member.id);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() =>
                      setParticipantIds(
                        selected ? participantIds.filter((id) => id !== member.id) : [...participantIds, member.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? "border-primary/30 bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
                    aria-pressed={selected}
                  >
                    {member.fullName}
                  </button>
                );
              })}
            </div>
          </Field>
          {shares.length > 0 && (
            <div className="rounded-xl border bg-muted/35 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">پیش‌نمایش سهم‌ها</p>
                <p className="text-[10px] text-muted-foreground">مجموع سهم‌ها برابر مبلغ کل است</p>
              </div>
              <div className="space-y-1.5">
                {shares.map((share) => (
                  <div key={share.memberId} className="flex justify-between text-xs">
                    <span>
                      {members.find((member) => member.id === share.memberId)?.fullName}
                      {share.memberId === payerId && <span className="ms-1 text-muted-foreground">(پرداخت‌کننده)</span>}
                    </span>
                    <span className="font-semibold tabular-nums">{money(share.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 border-t pt-2 text-[10px] leading-5 text-muted-foreground">
                سهم پرداخت‌کننده هم در هزینه‌ی خودش محاسبه می‌شود؛ فقط بخش اضافه پرداخت‌شده به‌عنوان طلب در نظر گرفته
                می‌شود.
              </p>
            </div>
          )}
          <Field label="توضیحات" hint="اختیاری">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="جزئیات بیشتر…"
              className="min-h-16 resize-none rounded-xl"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit">
              {expense ? "ذخیره تغییرات" : "کی چی خریده؟ 🛍️"}
              <Check className="size-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium">{label}</span>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
function SummaryCard({
  icon: Icon,
  label,
  amount,
  tone,
  signed = false,
}: {
  icon: typeof Wallet;
  label: string;
  amount: number;
  tone: "sky" | "amber" | "mint";
  signed?: boolean;
}) {
  const style =
    tone === "sky"
      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return (
    <Card className="rounded-2xl border-0">
      <CardContent className="p-4">
        <span className={`grid size-9 place-items-center rounded-xl ${style}`}>
          <Icon className="size-[18px]" />
        </span>
        <p className="mt-4 text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold tabular-nums sm:text-base">
          {signed && amount > 0 ? "+" : signed && amount < 0 ? "−" : ""}
          {money(amount)}
        </p>
      </CardContent>
    </Card>
  );
}
function ExpenseRow({
  expense,
  payerName,
  participantCount,
  onOpen,
}: {
  expense: SharedExpense;
  payerName: string;
  participantCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 py-3.5 text-start transition-colors hover:bg-muted/25"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <CircleDollarSign className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{expense.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {payerName} پرداخت کرد · {participantCount} نفر شریک ·{" "}
          {new Date(`${expense.date}T12:00:00`).toLocaleDateString("fa-IR")}
        </span>
      </span>
      <span className="text-end">
        <span className="block text-sm font-bold tabular-nums">{money(expense.amount)}</span>
        <span className="mt-1 inline-block text-[10px] text-muted-foreground">{categoryLabel(expense.category)}</span>
      </span>
    </button>
  );
}
