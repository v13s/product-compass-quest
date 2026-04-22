import { STATUS_COLOR, STATUS_LABEL, type WorkStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STATUS_COLOR[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
