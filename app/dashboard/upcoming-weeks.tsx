"use client";

import { useState } from "react";
import { MIN_CREW } from "@/lib/crew";
import { formatDateLong } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import { RaceOverrideBanner, RaceOverrideControl } from "@/components/race-override";
import { RaceNotes } from "@/components/race-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, PartyPopper, Pause } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride } from "@/lib/schema";

interface WeekData {
  date: string;
  label: string;
  isRace: boolean;
  isCustomEvent?: boolean;
  statuses: Record<string, { status: AvailabilityStatus; role: string | null }>;
  override: RaceOverride | null;
  notes: RaceNote[];
  customEvents?: { title: string; type: string; emoji: string; rsvps: Record<string, string> }[];
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

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pt-2">
        Season Schedule
      </p>

      {weeks.map((week) => {
        const isCancelled =
          week.override?.status === "cancelled" ||
          week.override?.status === "no_race";
        const isBreak = !week.isRace;
        const isCustomOnly = week.isCustomEvent;
        const statuses = Object.values(week.statuses);
        const inCount = statuses.filter((s) => s.status === "in").length;
        const maybeCount = statuses.filter((s) => s.status === "maybe").length;
        const hasEnough = inCount >= MIN_CREW;
        const isExpanded = expandedDate === week.date;
        // Event attendee count for custom-only cards
        const eventInCount = (week.customEvents ?? []).reduce(
          (sum, e) => sum + Object.values(e.rsvps).filter((s) => s === "in").length, 0
        );

        return (
          <Card
            key={week.date}
            className={isCancelled || (isBreak && !isCustomOnly) ? "opacity-70" : ""}
          >
            <button
              onClick={() =>
                setExpandedDate(isExpanded ? null : week.date)
              }
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
                  <span
                    className={`text-sm font-medium block ${
                      isCancelled ? "line-through" : ""
                    }`}
                  >
                    {formatDateLong(week.date)}
                  </span>
                  <span className="text-xs text-muted-foreground block truncate">
                    {week.label}
                    {isCancelled && week.override?.reason
                      ? ` · ${week.override.reason}`
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isCancelled && !isBreak && (
                  <Badge
                    variant={hasEnough ? "default" : "outline"}
                    className={
                      hasEnough
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                        : inCount > 0
                          ? "border-amber-500 text-amber-600"
                          : ""
                    }
                  >
                    {inCount}
                    {maybeCount > 0 ? `+${maybeCount}?` : ""}
                  </Badge>
                )}
                {isBreak && !isCancelled && !isCustomOnly && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Break
                  </Badge>
                )}
                {isCustomOnly && eventInCount > 0 && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    {eventInCount} going
                  </Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-3 pt-0 border-t space-y-2">
                {week.override && (
                  <div className="pt-2">
                    <RaceOverrideBanner override={week.override} />
                  </div>
                )}

                {!isCancelled && week.isRace && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                    {crew.map((name) => {
                      const data = week.statuses[name];
                      const status = data?.status ?? "unknown";
                      const role = data?.role;
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span
                            className={
                              name === sailor
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {name}
                            {role && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({role})
                              </span>
                            )}
                          </span>
                          <StatusBadge status={status as AvailabilityStatus} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {week.notes.length > 0 && (
                  <div className="pt-2 border-t">
                    {week.notes.map((n) => (
                      <p key={n.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {n.sailorName}:
                        </span>{" "}
                        {n.note}
                      </p>
                    ))}
                  </div>
                )}

                {(week.customEvents ?? []).length > 0 && (
                  <div className="pt-2 border-t space-y-3">
                    {(week.customEvents ?? []).map((e, i) => {
                      const inNames = Object.entries(e.rsvps).filter(([, s]) => s === "in").map(([n]) => n);
                      const maybeNames = Object.entries(e.rsvps).filter(([, s]) => s === "maybe").map(([n]) => n);
                      const outNames = Object.entries(e.rsvps).filter(([, s]) => s === "out").map(([n]) => n);
                      return (
                        <div key={i} className="space-y-1.5">
                          <p className="text-xs font-medium">{e.emoji} {e.title}</p>
                          {inNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {inNames.map((n) => (
                                <Badge key={n} variant="outline" className="text-xs py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                  {n}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {maybeNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {maybeNames.map((n) => (
                                <Badge key={n} variant="outline" className="text-xs py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                  {n}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {outNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {outNames.map((n) => (
                                <Badge key={n} variant="outline" className="text-xs py-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60">
                                  {n}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {inNames.length === 0 && maybeNames.length === 0 && outNames.length === 0 && (
                            <p className="text-xs text-muted-foreground">No responses yet</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {week.isRace && (
                  <div className="pt-1">
                    <RaceNotes
                      raceDate={week.date}
                      sailor={sailor}
                      existingNotes={week.notes}
                    />
                    <RaceOverrideControl
                      raceDate={week.date}
                      sailor={sailor}
                      override={week.override}
                    />
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

