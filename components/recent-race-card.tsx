"use client";

import { useState } from "react";
import { formatDateLong } from "@/lib/dates";
import { RaceDetailContent } from "@/components/race-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride, RacePhoto } from "@/lib/schema";

export function RecentRaceCard({
  date,
  statuses,
  photos,
  notes,
  override,
  sailor,
  crew,
}: {
  date: string;
  statuses: Record<string, { status: AvailabilityStatus; role: string | null }>;
  photos: RacePhoto[];
  notes: RaceNote[];
  override: RaceOverride | null;
  sailor: string;
  crew: string[];
}) {
  const [expanded, setExpanded] = useState(true);

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
          <CardContent className="px-4 py-3">
            <RaceDetailContent
              date={date}
              statuses={statuses}
              photos={photos}
              notes={notes}
              override={override}
              sailor={sailor}
              crew={crew}
            />
          </CardContent>
        </>
      )}
    </Card>
  );
}
