import { Badge } from "@/components/ui/badge";
import type { AvailabilityStatus } from "@/lib/schema";

const statusConfig: Record<
  AvailabilityStatus,
  { label: string; className: string }
> = {
  in: {
    label: "In",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  out: {
    label: "Out",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  maybe: {
    label: "Maybe",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  unknown: {
    label: "?",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
