"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { formatDateLong } from "@/lib/dates";
import { MIN_CREW } from "@/lib/crew";
import type { AvailabilityStatus, RaceOverride } from "@/lib/schema";

export function ShareButton({
  date,
  statuses,
  override,
  crew,
}: {
  date: string;
  statuses: Map<string, { status: AvailabilityStatus; role: string | null }>;
  override: RaceOverride | null;
  crew: string[];
}) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const isCancelled =
      override?.status === "cancelled" || override?.status === "no_race";

    let text = `⛵ Makani u'i — ${formatDateLong(date)}\n`;

    if (isCancelled) {
      text += `❌ ${override?.status === "cancelled" ? "Cancelled" : "No Race"}`;
      if (override?.reason) text += ` — ${override.reason}`;
      text += "\n";
    } else {
      const inNames = [...statuses.entries()]
        .filter(([, v]) => v.status === "in")
        .map(([n, v]) => (v.role ? `${n} (${v.role})` : n));
      const maybeNames = [...statuses.entries()]
        .filter(([, v]) => v.status === "maybe")
        .map(([n]) => n);
      const outNames = [...statuses.entries()]
        .filter(([, v]) => v.status === "out")
        .map(([n]) => n);
      const unknown = crew.filter(
        (n) => !statuses.has(n) || statuses.get(n)!.status === "unknown"
      );

      const hasEnough = inNames.length >= MIN_CREW;
      text += hasEnough
        ? `✅ GO — ${inNames.length} confirmed\n`
        : `⚠️ Need ${MIN_CREW - inNames.length} more (${inNames.length}/${MIN_CREW})\n`;

      if (inNames.length > 0) text += `\nSailing: ${inNames.join(", ")}`;
      if (maybeNames.length > 0) text += `\nMaybe: ${maybeNames.join(", ")}`;
      if (outNames.length > 0) text += `\nOut: ${outNames.join(", ")}`;
      if (unknown.length > 0) text += `\nNo response: ${unknown.join(", ")}`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={handleShare}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}
