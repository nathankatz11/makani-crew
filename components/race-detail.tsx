"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAvailability } from "@/lib/actions";
import { PhotoGrid } from "@/components/photo-grid";
import { RaceNotes } from "@/components/race-notes";
import { RaceOverrideControl, RaceOverrideBanner } from "@/components/race-override";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, ExternalLink } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride, RacePhoto, RaceResult } from "@/lib/schema";

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: "in",
    label: "I'm In",
    activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 font-semibold",
    inactiveClass: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400",
  },
  {
    value: "maybe",
    label: "Maybe",
    activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500 font-semibold",
    inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400",
  },
  {
    value: "out",
    label: "Out",
    activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600 font-semibold",
    inactiveClass: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400",
  },
];

const STATUS_COLORS: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  maybe: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  out: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60",
};

export function RaceDetailContent({
  date,
  statuses,
  photos,
  notes,
  override,
  result,
  sailor,
  crew,
  showStatusButtons = true,
  showPlaceEditor = false,
  PlaceEditorSlot,
}: {
  date: string;
  // Flexible statuses: either { status, role } objects or plain status strings
  statuses: Record<string, { status: AvailabilityStatus; role?: string | null } | string>;
  photos: RacePhoto[];
  notes: RaceNote[];
  override: RaceOverride | null;
  result?: RaceResult;
  sailor: string;
  crew: string[];
  showStatusButtons?: boolean;
  showPlaceEditor?: boolean;
  PlaceEditorSlot?: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Normalize statuses to a common shape
  function getStatus(name: string): AvailabilityStatus {
    const raw = statuses[name];
    if (!raw) return "unknown";
    return typeof raw === "string" ? (raw as AvailabilityStatus) : raw.status;
  }
  function getRole(name: string): string | null {
    const raw = statuses[name];
    if (!raw || typeof raw === "string") return null;
    return raw.role ?? null;
  }

  const isCancelled = override?.status === "cancelled" || override?.status === "no_race";
  const myStatus = getStatus(sailor);

  const inCrew = crew.filter((n) => getStatus(n) === "in");
  const maybeCrew = crew.filter((n) => getStatus(n) === "maybe");
  const outCrew = crew.filter((n) => getStatus(n) === "out");
  const unknownCrew = crew.filter((n) => getStatus(n) === "unknown");

  function handleStatusChange(status: AvailabilityStatus) {
    startTransition(async () => {
      await setAvailability(sailor, date, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {override && <RaceOverrideBanner override={override} />}

      {result?.resultsUrl && (
        <a
          href={result.resultsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View full results on Clubspot
        </a>
      )}

      {/* Your status buttons */}
      {showStatusButtons && !isCancelled && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Your status</p>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = myStatus === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className={`h-7 text-xs ${isActive ? opt.activeClass : opt.inactiveClass}`}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  {isActive && <Check className="h-3 w-3 mr-1" />}
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Crew attendance */}
      {(inCrew.length > 0 || maybeCrew.length > 0 || outCrew.length > 0) && (
        <div className="space-y-1.5">
          {inCrew.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                {result ? "Sailed" : "In"} ({inCrew.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {inCrew.map((name) => (
                  <Badge key={name} variant="outline" className={STATUS_COLORS.in}>
                    {name}{getRole(name) ? ` — ${getRole(name)}` : ""}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {maybeCrew.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Maybe ({maybeCrew.length})</p>
              <div className="flex flex-wrap gap-1">
                {maybeCrew.map((name) => (
                  <Badge key={name} variant="outline" className={STATUS_COLORS.maybe}>{name}</Badge>
                ))}
              </div>
            </div>
          )}
          {outCrew.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">Out ({outCrew.length})</p>
              <div className="flex flex-wrap gap-1">
                {outCrew.map((name) => (
                  <Badge key={name} variant="outline" className={STATUS_COLORS.out}>{name}</Badge>
                ))}
              </div>
            </div>
          )}
          {unknownCrew.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">No response ({unknownCrew.length})</p>
              <div className="flex flex-wrap gap-1">
                {unknownCrew.map((name) => (
                  <Badge key={name} variant="outline" className="opacity-50">{name}</Badge>
                ))}
              </div>
            </div>
          )}
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

      <Separator />

      {PlaceEditorSlot}

      <div className="space-y-1">
        <RaceNotes raceDate={date} sailor={sailor} existingNotes={notes} />
        <RaceOverrideControl raceDate={date} sailor={sailor} override={override} />
      </div>
    </div>
  );
}
