"use client";

import { useState, useTransition } from "react";
import { setAvailability } from "@/lib/actions";
import { formatDateLong, getSeasonDateInfo } from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AvailabilityStatus } from "@/lib/schema";

const statusOptions: {
  value: AvailabilityStatus;
  label: string;
  cls: string;
}[] = [
  { value: "in", label: "In", cls: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" },
  { value: "maybe", label: "?", cls: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" },
  { value: "out", label: "Out", cls: "bg-red-600 text-white hover:bg-red-700 border-red-600" },
];

export function CaptainManager({
  dates,
  crew,
  allStatuses,
}: {
  dates: string[];
  crew: string[];
  allStatuses: Record<string, Record<string, AvailabilityStatus>>;
}) {
  const [expandedDate, setExpandedDate] = useState<string | null>(dates[0] ?? null);
  const [isPending, startTransition] = useTransition();
  const [localStatuses, setLocalStatuses] = useState(allStatuses);
  const router = useRouter();

  function handleSet(
    date: string,
    sailorName: string,
    status: AvailabilityStatus
  ) {
    setLocalStatuses((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [sailorName]: status,
      },
    }));

    startTransition(async () => {
      await setAvailability(sailorName, date, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      {dates.map((date) => {
        const dateStatuses = localStatuses[date] ?? {};
        const isExpanded = expandedDate === date;
        const info = getSeasonDateInfo(date);
        const inCount = Object.values(dateStatuses).filter((s) => s === "in").length;

        return (
          <Card key={date}>
            <button
              onClick={() => setExpandedDate(isExpanded ? null : date)}
              className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium block">
                  {formatDateLong(date)}
                </span>
                {info && (
                  <span className="text-xs text-muted-foreground block truncate">
                    {info.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {inCount > 0 ? `${inCount} in` : ""}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {isExpanded && (
              <CardContent className="px-4 pb-3 pt-0 border-t">
                <div className="space-y-2 pt-2">
                  {crew.map((name) => {
                    const current =
                      (dateStatuses[name] as AvailabilityStatus) ?? "unknown";
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{name}</span>
                        <div className="flex gap-1">
                          {statusOptions.map((opt) => (
                            <Button
                              key={opt.value}
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              className={`h-7 px-2 text-xs ${
                                current === opt.value
                                  ? opt.cls
                                  : "text-muted-foreground"
                              }`}
                              onClick={() =>
                                handleSet(date, name, opt.value)
                              }
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
