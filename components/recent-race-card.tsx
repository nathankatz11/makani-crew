"use client";

import { useState } from "react";
import { formatDateLong } from "@/lib/dates";
import { PhotoGrid } from "@/components/photo-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import type { AvailabilityStatus, RacePhoto } from "@/lib/schema";

const STATUS_COLORS: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  maybe: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  out: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60",
};

export function RecentRaceCard({
  date,
  statuses,
  photos,
  sailor,
  crew,
}: {
  date: string;
  statuses: Record<string, { status: AvailabilityStatus; role: string | null }>;
  photos: RacePhoto[];
  sailor: string;
  crew: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  const inSailors = crew.filter((n) => statuses[n]?.status === "in");
  const maybeSailors = crew.filter((n) => statuses[n]?.status === "maybe");
  const outSailors = crew.filter((n) => statuses[n]?.status === "out");
  const unknownSailors = crew.filter((n) => !statuses[n] || statuses[n].status === "unknown");

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Race</p>
            <CardTitle className="text-xl mt-1">{formatDateLong(date)}</CardTitle>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <>
          <Separator />
          <CardContent className="px-4 py-3 space-y-3">
            {inSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Sailed ({inSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {inSailors.map((name) => (
                    <Badge key={name} variant="outline" className={STATUS_COLORS.in}>
                      {name}{statuses[name]?.role ? ` — ${statuses[name].role}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {maybeSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Maybe ({maybeSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {maybeSailors.map((name) => <Badge key={name} variant="outline" className={STATUS_COLORS.maybe}>{name}</Badge>)}
                </div>
              </div>
            )}
            {outSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">Out ({outSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {outSailors.map((name) => <Badge key={name} variant="outline" className={STATUS_COLORS.out}>{name}</Badge>)}
                </div>
              </div>
            )}
            {unknownSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">No response ({unknownSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {unknownSailors.map((name) => <Badge key={name} variant="outline" className="opacity-50">{name}</Badge>)}
                </div>
              </div>
            )}

            <Separator />

            <PhotoGrid
              photos={photos}
              sailor={sailor}
              raceDate={date}
              showUploader
              showUploadButton
            />
          </CardContent>
        </>
      )}
    </Card>
  );
}
