import { ArrowLeft, CalendarDays, Crown, Repeat2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Room } from "@/features/onboarding/types";
import { MemberAvatar } from "./member-avatar";

export function SupervisorCard({ room, detailed = false }: { room: Room; detailed?: boolean }) {
  const current = room.members.find((member) => member.id === room.currentSupervisorId) ?? room.members[0];
  const next =
    room.members.find((member) => member.id === room.nextSupervisorId && member.id !== current?.id) ??
    room.members.find((member) => member.id !== current?.id);
  return (
    <Card className="overflow-hidden rounded-2xl border-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Crown className="size-4" />
            </span>
            سرپرست این هفته
          </div>
          <span className="text-[10px] text-muted-foreground">{room.supervisorPeriod}</span>
        </div>
        {current ? (
          <div className="mt-4 flex items-center gap-3">
            <MemberAvatar member={current} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{current.fullName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">هماهنگ‌کننده‌ی کارای اتاق</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-800 dark:text-amber-200">
              این هفته
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">هنوز عضوی برای سرپرستی مشخص نشده.</p>
        )}
        {next && (
          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Repeat2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">نفر بعدی در نوبت</p>
              <p className="mt-0.5 text-sm font-medium">{next.fullName}</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="size-3" /> هفته‌ی بعد
            </span>
          </div>
        )}
        {detailed && room.members.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">ترتیب نوبت‌ها</p>
            <div className="flex flex-wrap items-center gap-2">
              {room.members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2 rounded-xl bg-muted/55 px-2.5 py-2">
                  <MemberAvatar member={member} size="sm" />
                  <span className="text-xs">{member.fullName}</span>
                  {index < room.members.length - 1 && <ArrowLeft className="size-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
