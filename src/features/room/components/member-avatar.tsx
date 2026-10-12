import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RoomMember } from "@/features/onboarding/types";

const colors: Record<string, string> = {
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function MemberAvatar({ member, size = "default" }: { member: RoomMember; size?: "default" | "sm" | "lg" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback className={`font-semibold ${colors[member.color ?? ""] ?? "bg-primary/10 text-primary"}`}>
        {member.fullName.trim().slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
