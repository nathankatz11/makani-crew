"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadRacePhoto, deleteRacePhoto } from "@/lib/actions";
import { compressImage } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Camera, X, Download, Trash2, Plus, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { formatDateLong } from "@/lib/dates";
import type { RacePhoto } from "@/lib/schema";

const SLIDESHOW_INTERVAL = 3500; // ms per slide

function proxyUrl(url: string) {
  return `/api/photo?url=${encodeURIComponent(url)}`;
}

function Lightbox({
  photos,
  initialIndex,
  onClose,
  sailor,
  onDelete,
  isPending,
  autoplay = false,
}: {
  photos: RacePhoto[];
  initialIndex: number;
  onClose: () => void;
  sailor: string;
  onDelete: (id: number, url: string) => void;
  isPending: boolean;
  autoplay?: boolean;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(autoplay);
  const startX = useRef<number | null>(null);
  const photo = photos[index];
  const src = proxyUrl(photo.url);

  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  // Slideshow timer
  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const id = setInterval(next, SLIDESHOW_INTERVAL);
    return () => clearInterval(id);
  }, [playing, next, photos.length]);

  function handleManualNav(fn: () => void) {
    setPlaying(false);
    fn();
  }

  function handleTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) { handleManualNav(dx < 0 ? next : prev); }
    startX.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") handleManualNav(prev);
    if (e.key === "ArrowRight") handleManualNav(next);
    if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    if (e.key === "Escape") onClose();
  }

  async function handleDownload() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) { window.open(src, "_blank"); return; }
    const res = await fetch(src);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `race-${photo.raceDate}-${photo.uploadedBy}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col outline-none"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm text-white/80 min-w-0">
          <p className="font-medium truncate">{formatDateLong(photo.raceDate)}</p>
          <p className="text-xs text-white/50">{photo.uploadedBy} · {index + 1} / {photos.length}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {photos.length > 1 && (
            <Button
              variant="ghost" size="sm"
              className={`text-xs gap-1.5 ${playing ? "text-white" : "text-white/70 hover:text-white"}`}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          {photo.uploadedBy === sailor && (
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-red-400" disabled={isPending}
              onClick={() => { onDelete(photo.id, photo.url); photos.length > 1 ? next() : onClose(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image + prev/next */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden" onClick={onClose}>
        {photos.length > 1 && (
          <button className="absolute left-2 z-10 text-white/60 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); handleManualNav(prev); }}>
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt="Race photo"
          className="max-w-full w-auto h-auto rounded-lg object-contain px-12 transition-opacity duration-300"
          style={{ maxHeight: "calc(100vh - 120px)" }}
          onClick={(e) => e.stopPropagation()}
        />
        {photos.length > 1 && (
          <button className="absolute right-2 z-10 text-white/60 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); handleManualNav(next); }}>
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* Progress bar (slideshow) + dots */}
      <div className="shrink-0 pb-4" onClick={(e) => e.stopPropagation()}>
        {playing && (
          <div className="h-0.5 bg-white/20 mx-4 mb-2 rounded-full overflow-hidden">
            <div
              key={`${index}-${playing}`}
              className="h-full bg-white rounded-full"
              style={{ animation: `slideProgress ${SLIDESHOW_INTERVAL}ms linear` }}
            />
          </div>
        )}
        {photos.length > 1 && (
          <div className="flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => { setPlaying(false); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoGrid({
  photos,
  sailor,
  raceDate,
  showUploader = true,
  showDateLabel = false,
  showUploadButton = true,
  showFilters = false,
}: {
  photos: RacePhoto[];
  sailor: string;
  raceDate?: string;
  showUploader?: boolean;
  showDateLabel?: boolean;
  showUploadButton?: boolean;
  showFilters?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [slideshowStart, setSlideshowStart] = useState(false);
  const [filterSailor, setFilterSailor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Unique uploaders for filter chips
  const uploaders = showFilters
    ? [...new Set(photos.map((p) => p.uploadedBy))].sort()
    : [];

  // Apply filter
  const visiblePhotos = filterSailor
    ? photos.filter((p) => p.uploadedBy === filterSailor)
    : photos;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || !raceDate) return;
    startTransition(async () => {
      for (const file of files) {
        const compressed = await compressImage(file, `${Date.now()}.jpg`);
        const formData = new FormData();
        formData.append("file", compressed);
        await uploadRacePhoto(raceDate, sailor, formData, null);
      }
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

  function openSlideshow() {
    setSlideshowStart(true);
    setLightboxIndex(0);
  }

  return (
    <>
      <div className="space-y-2">
        {/* Upload header */}
        {showUploadButton && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Photos ({photos.length})
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              disabled={isPending} onClick={() => fileRef.current?.click()}>
              {isPending ? "Uploading…" : <><Plus className="h-3.5 w-3.5 mr-1" />Add photo</>}
            </Button>
            <input ref={fileRef} type="file" accept="image/*,image/heic,image/heif,.heic,.heif"
              multiple className="hidden" onChange={handleUpload} />
          </div>
        )}

        {/* Filter chips + slideshow button */}
        {showFilters && photos.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterSailor(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filterSailor === null
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {uploaders.map((name) => (
              <button
                key={name}
                onClick={() => setFilterSailor(filterSailor === name ? null : name)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterSailor === name
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
            {visiblePhotos.length > 1 && (
              <button
                onClick={openSlideshow}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Play className="h-3 w-3" /> Slideshow
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {visiblePhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {visiblePhotos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-md overflow-hidden bg-muted cursor-pointer"
                onClick={() => { setSlideshowStart(false); setLightboxIndex(i); }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proxyUrl(photo.url)} alt="Race photo" className="w-full h-full object-cover" />
                {showDateLabel && (
                  <div className="absolute top-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDateLong(photo.raceDate)}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {showUploader && <span className="truncate">{photo.uploadedBy}</span>}
                  {photo.uploadedBy === sailor && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url); }}
                      disabled={isPending} className="ml-auto shrink-0 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showFilters && filterSailor && visiblePhotos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No photos from {filterSailor} yet.</p>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={visiblePhotos}
          initialIndex={lightboxIndex}
          onClose={() => { setLightboxIndex(null); setSlideshowStart(false); }}
          sailor={sailor}
          onDelete={handleDelete}
          isPending={isPending}
          autoplay={slideshowStart}
        />
      )}

      {/* Progress bar animation */}
      <style>{`
        @keyframes slideProgress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </>
  );
}
