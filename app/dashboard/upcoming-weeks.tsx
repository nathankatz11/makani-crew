"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MIN_CREW } from "@/lib/crew";
import { formatDateLong } from "@/lib/dates";
import { setAvailability } from "@/lib/actions";
import { StatusBadge } from "@/components/status-badge";
import { RaceOverrideBanner, RaceOverrideControl } from "@/components/race-override";
import { RaceNotes } from "@/components/race-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, PartyPopper, Pause } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride } from "@/lib/schema";

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string; activeClass: string }[] = [
  { value: "in", label: "In", activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" },
  { value: "maybe", label: "Maybe", activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" },
  { value: "out", label: "Out", activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600" },
];

interface WeekData {
  date: string;
  label: string;
  isRace: boolean;
  statuses: Record<string, { status: AvailabilityStatus; role: string | null }>;
  override: RaceOverride | null;
  notes: RaceNote[];
}

export function UpcomingWeeks({
  weeks,
  sailor,
  crew,
}: {
  weeks: WeekData[];
  sailor: string;
  crew: string[];
}) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(raceDate: string, status: AvailabilityStatus) {
    startTransition(async () => {
      await setAvailability(sailor, raceDate, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
        Season Schedule
      </p>

      {weeks.map((week) => {
        const isCancelled =
          week.override?.status === "cancelled" || week.override?.status === "no_race";
        const isBreak = !week.isRace;
        const statuses = Object.values(week.statuses);
        const inCount = statuses.filter((s) => s.status === "in").length;
        const maybeCount = statuses.filter((s) => s.status === "maybe").length;
        const outCount = statuses.filter((s) => s.status === "out").length;
        const hasEnough = inCount >= MIN_CREW;
        const isExpanded = expandedDate === week.date;
        const myStatus = week.statuses[sailor]?.status ?? "unknown";

        return (
          <Card
            key={week.date}
            className={isCancelled || isBreak ? "opacity-70" : ""}
          >
            <button
              onClick={() => setExpandedDate(isExpanded ? null : week.date)}
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isBreak && !isCancelled && (
                  <span className="shrink-0">
                    {week.label.includes("Party") || week.label.includes("Bash")
                      ? <PartyPopper className="h-4 w-4 text-amber-500" />
                      : <Pause className="h-4 w-4 text-muted-foreground" />}
                  </span>
                )}
                <div className="min-w-0">
                  <span className={`text-sm font-medium block ${isCancelled ? "line-through" : ""}`}>
                    {formatDateLong(week.date)}
                  </span>
                  <span className="text-xs text-muted-foreground block truncate">
                    {week.label}
                    {isCancelled && week.override?.reason ? ` · ${week.override.reason}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isCancelled && !isBreak && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{inCount} sailor{inCount !== 1 ? "s" : ""}</span>
                    <span className="opacity-40">|</span>
                    <span className={
                      myStatus === "in" ? "text-emerald-500 font-medium" :
                      myStatus === "maybe" ? "text-amber-500 font-medium" :
                      myStatus === "out" ? "text-red-400" :
                      "text-muted-foreground"
                    }>
                      {myStatus === "in" ? "I'm In" :
                       myStatus === "maybe" ? "I'm Maybe" :
                       myStatus === "out" ? "I'm Out" :
                       "Not set"}
                    </span>
                  </div>
                )}
                {isBreak && !isCancelled && (
                  <Badge variant="outline" className="text-muted-foreground">Break</Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-3 pt-0 border-t space-y-3">
                {week.override && (
                  <div className="pt-2">
                    <RaceOverrideBanner override={week.override} />
                  </div>
                )}

                {!isCancelled && week.isRace && (
                  <>
                    {/* Your status row */}
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Your status</p>
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            className={myStatus === opt.value ? opt.activeClass : "text-muted-foreground h-7 text-xs"}
                            onClick={() => handleStatusChange(week.date, opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Crew grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {crew.map((name) => {
                        const data = week.statuses[name];
                        const status = data?.status ?? "unknown";
                        const role = data?.role;
                        return (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span className={name === sailor ? "font-medium" : "text-muted-foreground"}>
                              {name}
                              {role && <span className="text-xs text-muted-foreground ml-1">({role})</span>}
                            </span>
                            <StatusBadge status={status as AvailabilityStatus} />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {week.notes.length > 0 && (
                  <div className="border-t pt-2">
                    {week.notes.map((n) => (
                      <p key={n.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{n.sailorName}:</span> {n.note}
                      </p>
                    ))}
                  </div>
                )}

                {week.isRace && (
                  <div className="pt-1">
                    <RaceNotes raceDate={week.date} sailor={sailor} existingNotes={week.notes} />
                    <RaceOverrideControl raceDate={week.date} sailor={sailor} override={week.override} />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
