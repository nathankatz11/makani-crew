"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAvailability } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import type { AvailabilityStatus } from "@/lib/schema";

const OPTIONS: { value: AvailabilityStatus; label: string; activeClass: string }[] = [
  {
    value: "in",
    label: "I'm In",
    activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  },
  {
    value: "maybe",
    label: "Maybe",
    activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500",
  },
  {
    value: "out",
    label: "Out",
    activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  },
];

export function HeroStatusButtons({
  raceDate,
  sailor,
  currentStatus,
}: {
  raceDate: string;
  sailor: string;
  currentStatus: AvailabilityStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(status: AvailabilityStatus) {
    startTransition(async () => {
      await setAvailability(sailor, raceDate, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="outline"
          size="sm"
          disabled={isPending}
          className={currentStatus === opt.value ? opt.activeClass : "text-muted-foreground"}
          onClick={() => handleClick(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
