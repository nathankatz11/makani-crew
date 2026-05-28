"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadRacePhoto, deleteRacePhoto } from "@/lib/actions";
import { compressImage } from "@/lib/compress-image";
import { formatDateLong } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Camera, X, ChevronDown } from "lucide-react";
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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const inSailors = crew.filter((n) => statuses[n]?.status === "in");
  const maybeSailors = crew.filter((n) => statuses[n]?.status === "maybe");
  const outSailors = crew.filter((n) => statuses[n]?.status === "out");
  const unknownSailors = crew.filter((n) => !statuses[n] || statuses[n].status === "unknown");

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startTransition(async () => {
      const compressed = await compressImage(file, `${Date.now()}.jpg`);
      await uploadRacePhoto(date, sailor, compressed, null);
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
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Sailed ({inSailors.length})
                </p>
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
                  {maybeSailors.map((name) => (
                    <Badge key={name} variant="outline" className={STATUS_COLORS.maybe}>{name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {outSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">Out ({outSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {outSailors.map((name) => (
                    <Badge key={name} variant="outline" className={STATUS_COLORS.out}>{name}</Badge>
                  ))}
                </div>
              </div>
            )}
            {unknownSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">No response ({unknownSailors.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {unknownSailors.map((name) => (
                    <Badge key={name} variant="outline" className="opacity-50">{name}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Photos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5" />
                  Photos ({photos.length})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  disabled={isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {isPending ? "Uploading…" : "+ Add photo"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt="Race photo"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setLightbox(photo.url)}
                      />
                      <button
                        onClick={() => handleDelete(photo.id, photo.url)}
                        disabled={isPending}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.uploadedBy}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Race photo"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </Card>
  );
}
