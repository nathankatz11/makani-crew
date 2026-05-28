"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadRacePhoto, deleteRacePhoto } from "@/lib/actions";
import { compressImage } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Camera, X, Download, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateLong } from "@/lib/dates";
import type { RacePhoto } from "@/lib/schema";

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
}: {
  photos: RacePhoto[];
  initialIndex: number;
  onClose: () => void;
  sailor: string;
  onDelete: (id: number, url: string) => void;
  isPending: boolean;
}) {
  const [index, setIndex] = useState(initialIndex);
  const photo = photos[index];
  const src = proxyUrl(photo.url);
  const startX = useRef<number | null>(null);

  function prev() { setIndex((i) => (i - 1 + photos.length) % photos.length); }
  function next() { setIndex((i) => (i + 1) % photos.length); }

  function handleTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    startX.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key === "Escape") onClose();
  }

  async function handleDownload() {
    // iOS Safari: open in new tab so user can long-press → Save to Photos
    // Other browsers: trigger file download
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(src, "_blank");
      return;
    }
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
      className="fixed inset-0 z-50 bg-black/90 flex flex-col outline-none"
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
        <div className="text-sm text-white/80">
          <p className="font-medium">{formatDateLong(photo.raceDate)}</p>
          <p className="text-xs text-white/50">
            {photo.uploadedBy} · {index + 1} / {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1.5 text-xs" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Save
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
      <div className="flex-1 flex items-center justify-center relative" onClick={onClose}>
        {photos.length > 1 && (
          <button
            className="absolute left-2 z-10 text-white/60 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Race photo"
          className="max-w-full max-h-full rounded-lg object-contain px-12"
          onClick={(e) => e.stopPropagation()}
        />
        {photos.length > 1 && (
          <button
            className="absolute right-2 z-10 text-white/60 hover:text-white p-2"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          {photos.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
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
}: {
  photos: RacePhoto[];
  sailor: string;
  raceDate?: string;         // required when showUploadButton is true
  showUploader?: boolean;
  showDateLabel?: boolean;   // show race date above each photo (for All Photos view)
  showUploadButton?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !raceDate) return;
    startTransition(async () => {
      const compressed = await compressImage(file, `${Date.now()}.jpg`);
      const formData = new FormData();
      formData.append("file", compressed);
      await uploadRacePhoto(raceDate, sailor, formData, null);
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
    <>
      <div className="space-y-2">
        {showUploadButton && (
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Photos ({photos.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              disabled={isPending}
              onClick={() => fileRef.current?.click()}
            >
              {isPending ? "Uploading…" : <><Plus className="h-3.5 w-3.5 mr-1" />Add photo</>}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/heic,image/heif,.heic,.heif"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-md overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proxyUrl(photo.url)}
                  alt="Race photo"
                  className="w-full h-full object-cover"
                />
                {/* Date label (All Photos view) */}
                {showDateLabel && (
                  <div className="absolute top-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDateLong(photo.raceDate)}
                  </div>
                )}
                {/* Uploader + delete */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  {showUploader && <span className="truncate">{photo.uploadedBy}</span>}
                  {photo.uploadedBy === sailor && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url); }}
                      disabled={isPending}
                      className="ml-auto shrink-0 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          sailor={sailor}
          onDelete={handleDelete}
          isPending={isPending}
        />
      )}
    </>
  );
}
