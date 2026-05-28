"use client";

import { useState, useTransition } from "react";
import { saveResult, setAvailability } from "@/lib/actions";
import { formatDateLong } from "@/lib/dates";
import { RaceNotes } from "@/components/race-notes";
import { RaceOverrideControl, RaceOverrideBanner } from "@/components/race-override";
import { PhotoGrid } from "@/components/photo-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, ChevronDown, ExternalLink, Pencil, Check, Images } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RaceResult, RacePhoto, RaceOverride, RaceNote } from "@/lib/schema";
import type { AvailabilityStatus } from "@/lib/schema";

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string; activeClass: string; inactiveClass: string }[] = [
  { value: "in", label: "Sailed", activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 font-semibold", inactiveClass: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400" },
  { value: "maybe", label: "Maybe", activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500 font-semibold", inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400" },
  { value: "out", label: "Out", activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600 font-semibold", inactiveClass: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400" },
];

const STATUS_COLORS: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  maybe: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  out: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60",
};

function PlaceEditor({ raceDate, result }: { raceDate: string; result: RaceResult | undefined }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave(formData: FormData) {
    const place = formData.get("place") ? Number(formData.get("place")) : null;
    const resultsUrl = (formData.get("resultsUrl") as string) || null;
    startTransition(async () => {
      await saveResult(raceDate, place, null, null, null, resultsUrl);
      setIsEditing(false);
      router.refresh();
    });
  }

  if (!isEditing) {
    return (
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2" onClick={() => setIsEditing(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        {result?.place != null ? "Edit result" : "Log place"}
      </Button>
    );
  }

  return (
    <form action={handleSave} className="space-y-2 pt-1">
      <input name="place" type="number" min="1" defaultValue={result?.place ?? ""} placeholder="Finishing place (e.g. 3)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      <input name="resultsUrl" type="url" defaultValue={result?.resultsUrl ?? ""} placeholder="Clubspot results URL (optional)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>Save</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function ResultsView({
  results,
  crew,
  sailor,
  availByDate,
  photosByDate,
  overridesByDate,
  notesByDate,
  pastDates,
  allPhotos,
}: {
  results: RaceResult[];
  crew: string[];
  sailor: string;
  availByDate: Record<string, Record<string, string>>;
  photosByDate: Record<string, RacePhoto[]>;
  overridesByDate: Record<string, RaceOverride>;
  notesByDate: Record<string, RaceNote[]>;
  pastDates: string[];
  allPhotos: RacePhoto[];
}) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const withPlace = results.filter((r) => r.place !== null);
  const avgPlace = withPlace.length > 0
    ? (withPlace.reduce((sum, r) => sum + r.place!, 0) / withPlace.length).toFixed(1)
    : null;

  function handleStatusChange(raceDate: string, status: AvailabilityStatus) {
    startTransition(async () => {
      await setAvailability(sailor, raceDate, status);
      router.refresh();
    });
  }

  const allDates = new Set([
    ...pastDates,
    ...results.map((r) => r.raceDate),
    ...Object.keys(availByDate),
  ]);
  const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-3">
      {withPlace.length > 0 && (
        <Card>
          <CardContent className="px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Season Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold">{withPlace.length}</p><p className="text-xs text-muted-foreground">Races</p></div>
              <div><p className="text-2xl font-bold">{avgPlace}</p><p className="text-xs text-muted-foreground">Avg Place</p></div>
              <div><p className="text-2xl font-bold">{withPlace.filter((r) => r.place === 1).length}</p><p className="text-xs text-muted-foreground">Wins</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Photos panel */}
      {allPhotos.length > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAllPhotos(!showAllPhotos)}
        >
          <Images className="h-4 w-4 mr-2" />
          All Photos ({allPhotos.length})
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showAllPhotos ? "rotate-180" : ""}`} />
        </Button>
      )}

      {showAllPhotos && (
        <Card>
          <CardContent className="px-4 py-4">
            <PhotoGrid
              photos={allPhotos}
              sailor={sailor}
              showUploader
              showDateLabel
              showUploadButton={false}
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      {sortedDates.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">No history yet</p>
            <p>Results and attendance will appear here after race nights.</p>
          </CardContent>
        </Card>
      )}

      {sortedDates.map((date) => {
        const result = results.find((r) => r.raceDate === date);
        const photos = photosByDate[date] ?? [];
        const notes = notesByDate[date] ?? [];
        const isExpanded = expandedDate === date;
        const override = overridesByDate[date] ?? null;
        const isCancelled = override?.status === "cancelled" || override?.status === "no_race";
        const myStatus = (availByDate[date]?.[sailor] ?? "unknown") as AvailabilityStatus;
        const statuses = availByDate[date] ?? {};

        const inNames = crew.filter((n) => statuses[n] === "in");
        const maybeNames = crew.filter((n) => statuses[n] === "maybe");
        const outNames = crew.filter((n) => statuses[n] === "out");

        return (
          <Card key={date} className={isCancelled ? "opacity-70" : ""}>
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
              onClick={() => setExpandedDate(isExpanded ? null : date)}
            >
              <div>
                <p className={`text-sm font-medium ${isCancelled ? "line-through" : ""}`}>{formatDateLong(date)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isCancelled
                    ? `Cancelled${override?.reason ? ` · ${override.reason}` : ""}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {photos.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Images className="h-3.5 w-3.5" /> {photos.length}
                  </span>
                )}
                {result?.resultsUrl && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                {result?.place != null ? (
                  <Badge variant="outline" className={
                    result.place === 1
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-base px-3"
                      : result.place <= 3 ? "bg-muted text-foreground text-base px-3" : "text-base px-3"
                  }>
                    {result.place}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isExpanded && (
              <CardContent className="px-4 pb-4 pt-0 border-t space-y-3">
                {override && (
                  <div className="pt-2">
                    <RaceOverrideBanner override={override} />
                  </div>
                )}

                {result?.resultsUrl && (
                  <a href={result.resultsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline pt-1">
                    <ExternalLink className="h-3.5 w-3.5" /> View full results on Clubspot
                  </a>
                )}

                {/* Your status */}
                {!isCancelled && (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Your status</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = myStatus === opt.value;
                        return (
                          <Button key={opt.value} variant="outline" size="sm" disabled={isPending}
                            className={`h-7 text-xs ${isActive ? opt.activeClass : opt.inactiveClass}`}
                            onClick={() => handleStatusChange(date, opt.value)}>
                            {isActive && <Check className="h-3 w-3 mr-1" />}
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Crew attendance */}
                {(inNames.length > 0 || maybeNames.length > 0 || outNames.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {inNames.map((name) => <Badge key={name} variant="outline" className={STATUS_COLORS.in}>{name}</Badge>)}
                    {maybeNames.map((name) => <Badge key={name} variant="outline" className={STATUS_COLORS.maybe}>{name}</Badge>)}
                    {outNames.map((name) => <Badge key={name} variant="outline" className={STATUS_COLORS.out}>{name}</Badge>)}
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

                <PlaceEditor raceDate={date} result={result} />

                <div className="space-y-1">
                  <RaceNotes raceDate={date} sailor={sailor} existingNotes={notes} />
                  <RaceOverrideControl raceDate={date} sailor={sailor} override={override} />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
