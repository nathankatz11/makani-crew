"use client";

import { useTransition, useState } from "react";
import { setAvailability, setBulkAvailability, setRole } from "@/lib/actions";
import { formatDateLong, getSeasonDateInfo } from "@/lib/dates";
import { ROLES } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AvailabilityStatus } from "@/lib/schema";

const raceOptions: { value: AvailabilityStatus; label: string; activeClass: string }[] = [
  { value: "in", label: "I'm In", activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" },
  { value: "maybe", label: "Maybe", activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" },
  { value: "out", label: "Out", activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600" },
];

export function StatusTimeline({
  sailor,
  raceDates,
  initialStatuses,
  initialRoles,
}: {
  sailor: string;
  raceDates: string[];
  initialStatuses: Record<string, AvailabilityStatus>;
  initialRoles: Record<string, string | null>;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [roles, setRoles] = useState(initialRoles);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(date: string, status: AvailabilityStatus) {
    const newStatus = statuses[date] === status ? "unknown" : status;
    setStatuses((prev) => ({ ...prev, [date]: newStatus }));
    startTransition(async () => {
      await setAvailability(sailor, date, newStatus);
      router.refresh();
    });
  }

  function handleBulk(status: AvailabilityStatus) {
    const unsetDates = raceDates.filter((d) => !statuses[d] || statuses[d] === "unknown");
    const targetDates = unsetDates.length > 0 ? unsetDates : raceDates;
    const updated = { ...statuses };
    for (const d of targetDates) updated[d] = status;
    setStatuses(updated);
    startTransition(async () => {
      await setBulkAvailability(sailor, targetDates, status);
      router.refresh();
    });
  }

  function handleRoleChange(date: string, role: string) {
    const newRole = role === "" ? null : role;
    setRoles((prev) => ({ ...prev, [date]: newRole }));
    startTransition(async () => {
      await setRole(sailor, date, newRole);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="col-span-full">
        <CardContent className="px-4 py-3">
          <p className="text-sm font-medium mb-2">Quick set all unanswered races</p>
          <div className="flex gap-2">
            {raceOptions.map((opt) => (
              <Button key={opt.value} variant="outline" size="sm" disabled={isPending} className="text-muted-foreground" onClick={() => handleBulk(opt.value)}>
                All {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {raceDates.map((date) => {
        const info = getSeasonDateInfo(date);
        const current = statuses[date] ?? "unknown";
        const currentRole = roles[date] ?? "";
        return (
          <Card key={date}>
            <CardContent className="px-4 py-3">
              <p className="text-sm font-medium">{formatDateLong(date)}</p>
              {info?.label && <p className="text-xs text-muted-foreground mb-2">{info.label}</p>}
              {!info?.label && <div className="mb-2" />}
              <div className="flex gap-2">
                {raceOptions.map((opt) => (
                  <Button key={opt.value} variant="outline" size="sm" disabled={isPending}
                    className={current === opt.value ? opt.activeClass : "text-muted-foreground"}
                    onClick={() => handleToggle(date, opt.value)}>
                    {opt.label}
                  </Button>
                ))}
              </div>
              {current === "in" && (
                <div className="mt-2 relative">
                  <select value={currentRole} onChange={(e) => handleRoleChange(date, e.target.value)}
                    className="w-full appearance-none rounded-md border bg-transparent px-3 py-1.5 pr-8 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="">No role assigned</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
