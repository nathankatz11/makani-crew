"use client";

import { useState, useTransition, useRef } from "react";
import { saveResult, uploadRacePhoto, deleteRacePhoto, setAvailability, setRaceOverride, clearRaceOverride } from "@/lib/actions";
import { compressImage } from "@/lib/compress-image";
import { formatDateLong } from "@/lib/dates";
import { RaceNotes } from "@/components/race-notes";
import { RaceOverrideControl, RaceOverrideBanner } from "@/components/race-override";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Camera, X, ChevronDown, ExternalLink, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RaceResult, RacePhoto, RaceOverride, RaceNote } from "@/lib/schema";
import type { AvailabilityStatus } from "@/lib/schema";

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string; activeClass: string }[] = [
  { value: "in", label: "Sailed", activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" },
  { value: "maybe", label: "Maybe", activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" },
  { value: "out", label: "Out", activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600" },
];

const STATUS_COLORS: Record<string, string> = {
  in: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  maybe: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  out: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60",
};

function PhotoUploader({ raceDate, sailor, photos }: { raceDate: string; sailor: string; photos: RacePhoto[] }) {
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startTransition(async () => {
      const compressed = await compressImage(file, `${Date.now()}.jpg`);
      await uploadRacePhoto(raceDate, sailor, compressed, null);
      router.refresh();
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function handleDelete(photoId: number, url: string) {
    startTransition(async () => {
      await deleteRacePhoto(photoId, url);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Camera className="h-3.5 w-3.5" /> Photos ({photos.length})
        </p>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" disabled={isPending} onClick={() => fileRef.current?.click()}>
          {isPending ? "Uploading…" : "+ Add photo"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*,image/heic,image/heif" className="hidden" onChange={handleUpload} />
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Race photo" className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox(photo.url)} />
              <button onClick={() => handleDelete(photo.id, photo.url)} disabled={isPending} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
              <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">{photo.uploadedBy}</p>
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Race photo" className="max-w-full max-h-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
        </div>
      )}
    </div>
  );
}

function PlaceEditor({ raceDate, result, crew, sailor }: { raceDate: string; result: RaceResult | undefined; crew: string[]; sailor: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<string[]>(() => result?.crew ? JSON.parse(result.crew) : []);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleCrew(name: string) {
    setSelectedCrew((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  }

  function handleSave(formData: FormData) {
    const place = formData.get("place") ? Number(formData.get("place")) : null;
    const fleetSize = formData.get("fleetSize") ? Number(formData.get("fleetSize")) : null;
    const resultsUrl = (formData.get("resultsUrl") as string) || null;
    startTransition(async () => {
      await saveResult(raceDate, place, fleetSize, null, selectedCrew.length > 0 ? selectedCrew : null, resultsUrl);
      setIsEditing(false);
      router.refresh();
    });
  }

  if (!isEditing) {
    return (
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2" onClick={() => setIsEditing(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        {result?.place != null ? "Edit result" : "Log place & fleet"}
      </Button>
    );
  }

  return (
    <form action={handleSave} className="space-y-2 pt-1">
      <div className="grid grid-cols-2 gap-2">
        <input name="place" type="number" min="1" defaultValue={result?.place ?? ""} placeholder="Place (e.g. 3)"
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        <input name="fleetSize" type="number" min="1" defaultValue={result?.fleetSize ?? ""} placeholder="Fleet size"
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <input name="resultsUrl" type="url" defaultValue={result?.resultsUrl ?? ""} placeholder="Clubspot results URL (optional)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Who sailed?</p>
        <div className="flex flex-wrap gap-1.5">
          {crew.map((name) => (
            <Button key={name} type="button" variant="outline" size="sm"
              className={selectedCrew.includes(name) ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 h-7 text-xs" : "text-muted-foreground h-7 text-xs"}
              onClick={() => toggleCrew(name)}>{name}</Button>
          ))}
        </div>
      </div>
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
}: {
  results: RaceResult[];
  crew: string[];
  sailor: string;
  availByDate: Record<string, Record<string, string>>;
  photosByDate: Record<string, RacePhoto[]>;
  overridesByDate: Record<string, RaceOverride>;
  notesByDate: Record<string, RaceNote[]>;
  pastDates: string[];
}) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
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

  // All past dates: union of known race dates + any with availability data
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
        const loggedCrew: string[] = result?.crew ? JSON.parse(result.crew) : [];
        const photos = photosByDate[date] ?? [];
        const notes = notesByDate[date] ?? [];
        const isExpanded = expandedDate === date;
        const override = overridesByDate[date] ?? null;
        const isCancelled = override?.status === "cancelled" || override?.status === "no_race";
        const myStatus = (availByDate[date]?.[sailor] ?? "unknown") as AvailabilityStatus;
        const statuses = availByDate[date] ?? {};

        const inNames = loggedCrew.length > 0 ? loggedCrew : crew.filter((n) => statuses[n] === "in");
        const maybeNames = loggedCrew.length > 0 ? [] : crew.filter((n) => statuses[n] === "maybe");
        const outNames = loggedCrew.length > 0 ? [] : crew.filter((n) => statuses[n] === "out");

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
                    : result?.notes ?? ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {photos.length > 0 && <Camera className="h-3.5 w-3.5 text-muted-foreground" />}
                {result?.resultsUrl && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                {result?.place != null ? (
                  <Badge variant="outline" className={
                    result.place === 1
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-base px-3"
                      : result.place <= 3 ? "bg-muted text-foreground text-base px-3" : "text-base px-3"
                  }>
                    {result.place}{result.fleetSize ? `/${result.fleetSize}` : ""}
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

                {/* Clubspot link */}
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
                      {STATUS_OPTIONS.map((opt) => (
                        <Button key={opt.value} variant="outline" size="sm" disabled={isPending}
                          className={myStatus === opt.value ? opt.activeClass : "text-muted-foreground h-7 text-xs"}
                          onClick={() => handleStatusChange(date, opt.value)}>
                          {opt.label}
                        </Button>
                      ))}
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

                {/* Existing notes */}
                {notes.length > 0 && (
                  <div className="space-y-1">
                    {notes.map((n) => (
                      <p key={n.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{n.sailorName}:</span> {n.note}
                      </p>
                    ))}
                  </div>
                )}

                <Separator />

                <PhotoUploader raceDate={date} sailor={sailor} photos={photos} />

                <Separator />

                {/* Place / result editor */}
                <PlaceEditor raceDate={date} result={result} crew={crew} sailor={sailor} />

                {/* Notes + race status — same UI as home */}
                <div className="flex flex-wrap gap-1">
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
