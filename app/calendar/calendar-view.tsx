"use client";

import { useState } from "react";
import { MIN_CREW } from "@/lib/crew";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/schema";

interface CalendarProps {
  sailor: string;
  crew: string[];
  raceDates: string[];
  availMap: Record<string, Record<string, AvailabilityStatus>>;
  overridesMap: Record<string, { status: string; reason: string | null }>;
  eventsByDate: Record<
    string,
    { title: string; type: string; inCount: number }[]
  >;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function CalendarView({
  sailor,
  crew,
  raceDates,
  availMap,
  overridesMap,
  eventsByDate,
}: CalendarProps) {
  const [selectedPerson, setSelectedPerson] = useState<string | "everyone">(
    "everyone"
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Determine month range from race dates
  const startMonth = 4; // May (0-indexed)
  const endMonth = 9; // October
  const year = 2026;
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const m = now.getMonth();
    return m >= startMonth && m <= endMonth ? m : startMonth;
  });

  const raceDateSet = new Set(raceDates);
  const today = new Date().toISOString().split("T")[0];

  function getDateStatus(dateStr: string): {
    isRace: boolean;
    isCancelled: boolean;
    inCount: number;
    hasEnough: boolean;
    myStatus: AvailabilityStatus;
    override: { status: string; reason: string | null } | null;
    events: { title: string; type: string; inCount: number }[];
  } {
    const isRace = raceDateSet.has(dateStr);
    const override = overridesMap[dateStr] ?? null;
    const isCancelled =
      override?.status === "cancelled" || override?.status === "no_race";
    const dateAvail = availMap[dateStr] ?? {};
    const inCount = Object.values(dateAvail).filter((s) => s === "in").length;
    const hasEnough = inCount >= MIN_CREW;
    const myStatus =
      selectedPerson === "everyone"
        ? (dateAvail[sailor] ?? "unknown")
        : (dateAvail[selectedPerson] ?? "unknown");
    const events = eventsByDate[dateStr] ?? [];

    return { isRace, isCancelled, inCount, hasEnough, myStatus, override, events };
  }

  function getDotColor(dateStr: string): string {
    const info = getDateStatus(dateStr);
    if (!info.isRace && info.events.length === 0) return "";
    if (info.isCancelled) return "bg-red-400 dark:bg-red-600";
    if (info.events.length > 0 && !info.isRace)
      return "bg-blue-400 dark:bg-blue-500";

    if (selectedPerson === "everyone") {
      if (info.hasEnough) return "bg-emerald-500";
      if (info.inCount > 0) return "bg-amber-500";
      return "bg-muted-foreground/40";
    } else {
      const status =
        availMap[dateStr]?.[selectedPerson] ?? "unknown";
      if (status === "in") return "bg-emerald-500";
      if (status === "maybe") return "bg-amber-500";
      if (status === "out") return "bg-red-500";
      return "bg-muted-foreground/40";
    }
  }

  const { firstDay, daysInMonth } = getMonthDays(year, currentMonth);

  return (
    <div className="space-y-3">
      {/* Person filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <Button
          variant="outline"
          size="sm"
          className={
            selectedPerson === "everyone"
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              : "text-muted-foreground shrink-0"
          }
          onClick={() => setSelectedPerson("everyone")}
        >
          Everyone
        </Button>
        {crew.map((name) => (
          <Button
            key={name}
            variant="outline"
            size="sm"
            className={
              selectedPerson === name
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                : "text-muted-foreground shrink-0"
            }
            onClick={() => setSelectedPerson(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentMonth <= startMonth}
          onClick={() => setCurrentMonth((m) => m - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTHS[currentMonth]} {year}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentMonth >= endMonth}
          onClick={() => setCurrentMonth((m) => m + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="px-2 py-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Date cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${pad(currentMonth + 1)}-${pad(day)}`;
              const isRace = raceDateSet.has(dateStr);
              const hasEvents = (eventsByDate[dateStr] ?? []).length > 0;
              const isToday = dateStr === today;
              const dotColor = getDotColor(dateStr);
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() =>
                    setSelectedDate(isSelected ? null : dateStr)
                  }
                  className={`aspect-square flex flex-col items-center justify-center rounded-md text-xs relative transition-colors ${
                    isSelected
                      ? "bg-accent ring-1 ring-ring"
                      : isToday
                        ? "bg-primary/10"
                        : ""
                  } ${
                    isRace || hasEvents
                      ? "font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <span>{day}</span>
                  {dotColor && (
                    <span
                      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${dotColor}`}
                    />
                  )}
                  {hasEvents && isRace && (
                    <span className="absolute bottom-1 right-1.5 h-1 w-1 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground justify-center">
        {selectedPerson === "everyone" ? (
          <>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {MIN_CREW}+ crew
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Some crew
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              No responses
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              In
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Maybe
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Out
            </span>
          </>
        )}
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Cancelled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Event
        </span>
      </div>

      {/* Selected date detail */}
      {selectedDate && <DateDetail
        dateStr={selectedDate}
        sailor={sailor}
        selectedPerson={selectedPerson}
        crew={crew}
        availMap={availMap}
        overridesMap={overridesMap}
        eventsByDate={eventsByDate}
        isRace={raceDateSet.has(selectedDate)}
      />}
    </div>
  );
}

function DateDetail({
  dateStr,
  sailor,
  selectedPerson,
  crew,
  availMap,
  overridesMap,
  eventsByDate,
  isRace,
}: {
  dateStr: string;
  sailor: string;
  selectedPerson: string;
  crew: string[];
  availMap: Record<string, Record<string, AvailabilityStatus>>;
  overridesMap: Record<string, { status: string; reason: string | null }>;
  eventsByDate: Record<string, { title: string; type: string; inCount: number }[]>;
  isRace: boolean;
}) {
  const date = new Date(dateStr + "T12:00:00");
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const override = overridesMap[dateStr];
  const isCancelled =
    override?.status === "cancelled" || override?.status === "no_race";
  const dateAvail = availMap[dateStr] ?? {};
  const events = eventsByDate[dateStr] ?? [];

  const crewToShow =
    selectedPerson === "everyone"
      ? crew
      : [selectedPerson];

  return (
    <Card>
      <CardContent className="px-4 py-3 space-y-2">
        <p className="text-sm font-medium">{formatted}</p>

        {isRace && (
          <>
            {isCancelled ? (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
              >
                {override?.status === "cancelled" ? "Cancelled" : "No Race"}
                {override?.reason ? ` — ${override.reason}` : ""}
              </Badge>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Race Night
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {crewToShow.map((name) => {
                    const status = dateAvail[name] ?? "unknown";
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
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            status === "in"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : status === "maybe"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : status === "out"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
                                  : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {status === "in"
                            ? "In"
                            : status === "maybe"
                              ? "Maybe"
                              : status === "out"
                                ? "Out"
                                : "?"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!isRace && events.length === 0 && (
          <p className="text-xs text-muted-foreground">No race or events this day</p>
        )}

        {events.length > 0 && (
          <div className="space-y-1">
            {isRace && <Separator />}
            {events.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{e.title}</span>
                <Badge variant="outline" className="text-xs">
                  {e.inCount} going
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
