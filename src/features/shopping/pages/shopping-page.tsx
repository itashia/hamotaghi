import { useState, type FormEvent } from "react";
import { Check, Circle, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RoomWorkspace } from "@/features/room/types";
import type { ShoppingItem } from "../types";

export function ShoppingPage({ room, user, onRoomChange }: RoomWorkspace) {
  const items = room.shoppingItems ?? [];
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const remaining = items.filter((item) => !item.completedAt);
  const done = items.filter((item) => item.completedAt);
  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("اسم کالا را بنویسید.");
      return;
    }
    const item: ShoppingItem = {
      id: "shopping-" + Date.now(),
      name: name.trim(),
      quantity: quantity.trim() || undefined,
      addedBy: user.id,
      createdAt: new Date().toISOString(),
    };
    onRoomChange({ ...room, shoppingItems: [item, ...items] });
    setName("");
    setQuantity("");
    setError("");
    toast.success("به فهرست خرید اضافه شد");
  }
  function toggle(item: ShoppingItem) {
    const completing = !item.completedAt;
    onRoomChange({
      ...room,
      shoppingItems: items.map((row) =>
        row.id === item.id
          ? {
              ...row,
              completedAt: completing ? new Date().toISOString() : undefined,
              completedBy: completing ? user.id : undefined,
            }
          : row,
      ),
    });
    toast.success(completing ? "خرید انجام شد" : "کالا دوباره به فهرست برگشت");
  }
  function remove(item: ShoppingItem) {
    onRoomChange({ ...room, shoppingItems: items.filter((row) => row.id !== item.id) });
    toast.success("از فهرست حذف شد");
  }
  const memberName = (id: string) => room.members.find((member) => member.id === id)?.fullName ?? "هم‌خانه";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Badge variant="secondary" className="mb-3 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300">
          نیازهای مشترک
        </Badge>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">فهرست خرید</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          هر چیزی که برای خانه کم است اینجا به همه نشان داده می‌شود.
        </p>
      </header>
      <Card className="rounded-2xl border-0">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={addItem} className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً مایع ظرف‌شویی"
              aria-label="نام کالا"
              className="h-11 rounded-xl"
            />
            <Input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="تعداد یا مقدار"
              aria-label="تعداد یا مقدار"
              className="h-11 rounded-xl"
            />
            <Button type="submit" className="h-11 rounded-xl">
              <Plus className="size-4" /> اضافه کردن
            </Button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-0">
        <CardHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-5">
          <div>
            <CardTitle className="text-base">باید تهیه کنیم</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{remaining.length} قلم در فهرست</p>
          </div>
          <span className="grid size-9 place-items-center rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300">
            <ShoppingBasket className="size-4" />
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {remaining.length ? (
            <div className="divide-y">
              {remaining.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <button
                    onClick={() => toggle(item)}
                    aria-label={"علامت‌زدن " + item.name + " به‌عنوان تهیه‌شده"}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Circle className="size-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.quantity ? item.quantity + " · " : ""}افزوده‌شده توسط {memberName(item.addedBy)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={"حذف " + item.name}
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="فهرست خرید خالی است" detail="هر چیزی کم است در کادر بالا اضافه کنید." />
          )}
        </CardContent>
      </Card>
      {done.length > 0 && (
        <Card className="rounded-2xl border-0">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base">تهیه‌شده</CardTitle>
          </CardHeader>
          <CardContent className="divide-y px-5 pb-4">
            {done.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <button
                  onClick={() => toggle(item)}
                  aria-label={"برگرداندن " + item.name + " به فهرست"}
                  className="grid size-5 place-items-center rounded-full bg-emerald-500/10 text-emerald-700"
                >
                  <Check className="size-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground line-through">{item.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    تهیه‌شده توسط {memberName(item.completedBy ?? "")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={"حذف " + item.name}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(item)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
