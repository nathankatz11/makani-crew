"use client";

import { useState, useTransition } from "react";
import { setRaceOverride, clearRaceOverride } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { RACE_STATUSES } from "@/lib/schema";
import type { RaceOverride } from "@/lib/schema";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Settings2 } from "lucide-react";

export function RaceOverrideControl({
  raceDate,
  sailor,
  override,
}: {
  raceDate: string;
  sailor: string;
  override: RaceOverride | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(override?.status ?? "cancelled");
  const [reason, setReason] = useState(override?.reason ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      await setRaceOverride(raceDate, status as "cancelled" | "no_race" | "custom", reason || null, sailor);
      setIsOpen(false);
      router.refresh();
    });
  }

  function handleClear() {
    startTransition(async () => {
      await clearRaceOverride(raceDate);
      setIsOpen(false);
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground h-7 px-2"
        onClick={() => setIsOpen(true)}
      >
        <Settings2 className="h-3.5 w-3.5 mr-1" />
        {override ? "Edit status" : "Set race status"}
      </Button>
    );
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-xs font-medium flex items-center gap-1">
        <AlertTriangle className="h-3.5 w-3.5" />
        Race Status
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {RACE_STATUSES.map((s) => (
          <Button
            key={s.value}
            variant="outline"
            size="sm"
            className={
              status === s.value
                ? s.color === "red"
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : s.color === "amber"
                    ? "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                    : "bg-muted text-muted-foreground"
                : "text-muted-foreground"
            }
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (e.g. Weather, July 4th, Captain unavailable)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={handleSave}>
          Save
        </Button>
        {override && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function RaceOverrideBanner({
  override,
}: {
  override: RaceOverride;
}) {
  const isCancelled = override.status === "cancelled";
  return (
    <div
      className={`rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2 ${
        isCancelled
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      }`}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {isCancelled ? "Cancelled" : override.status === "no_race" ? "No Race" : "Notice"}
        {override.reason ? ` — ${override.reason}` : ""}
      </span>
    </div>
  );
}
