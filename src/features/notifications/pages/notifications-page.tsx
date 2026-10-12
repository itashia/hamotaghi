import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityFeed } from "@/features/room/components/activity-feed";
import type { RoomWorkspace } from "@/features/room/types";
import { loadReadNotificationIds, markNotificationsRead } from "../data/read-state";
import { api, apiJson } from "@/lib/api";

export function NotificationsPage({ room, onRead }: RoomWorkspace & { onRead: () => void }) {
  const activities = room.activities ?? [];
  const readIds = loadReadNotificationIds(room.id);
  const unread = activities.filter((activity) => !readIds.includes(activity.id));
  function markAll() {
    void api(`/rooms/${encodeURIComponent(room.id)}/activity/read`, apiJson("POST"));
    markNotificationsRead(
      room.id,
      activities.map((activity) => activity.id),
    );
    onRead();
    toast.success("همه‌ی اعلان‌ها خوانده شدند");
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full bg-primary/10 text-primary">
            خبرهای اتاق
          </Badge>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">اعلان‌ها</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">تازه‌ترین اتفاق‌ها و تغییرهای اتاق.</p>
        </div>
        <Button variant="outline" disabled={!unread.length} className="rounded-xl" onClick={markAll}>
          <CheckCheck className="size-4" />
          خواندن همه
        </Button>
      </header>
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Bell className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">
            {unread.length ? unread.length + " اعلان خوانده‌نشده" : "همه‌چیز به‌روز است"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">اعلان‌ها از فعالیت‌های ثبت‌شده‌ی اتاق ساخته می‌شوند.</p>
        </div>
      </div>
      <Card className="rounded-2xl border-0">
        <CardContent className="px-5 py-2">
          <ActivityFeed activities={activities} />
        </CardContent>
      </Card>
      {!activities.length && (
        <Card className="rounded-2xl border-0">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            هنوز اعلانی برای این اتاق ثبت نشده است.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
