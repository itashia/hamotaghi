import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingCard() {
  return (
    <div aria-label="در حال بارگذاری" className="rounded-2xl border bg-card p-5">
      <Skeleton className="mb-4 h-4 w-28" />
      <Skeleton className="mb-3 h-8 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.03] px-6 text-center"
    >
      <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </span>
      <p className="font-semibold">بارگذاری اطلاعات انجام نشد</p>
      <p className="mt-1 text-sm text-muted-foreground">لطفاً چند لحظه دیگر دوباره تلاش کنید.</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          تلاش دوباره
        </Button>
      )}
    </div>
  );
}
