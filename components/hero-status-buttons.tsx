"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAvailability } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/schema";

const OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: "in",
    label: "I'm In",
    activeClass: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 font-semibold",
    inactiveClass: "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20",
  },
  {
    value: "maybe",
    label: "Maybe",
    activeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-500 font-semibold",
    inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20",
  },
  {
    value: "out",
    label: "Out",
    activeClass: "bg-red-600 text-white hover:bg-red-700 border-red-600 font-semibold",
    inactiveClass: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20",
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
      {OPTIONS.map((opt) => {
        const isActive = currentStatus === opt.value;
        return (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            disabled={isPending}
            className={isActive ? opt.activeClass : opt.inactiveClass}
            onClick={() => handleClick(opt.value)}
          >
            {isActive && <Check className="h-3.5 w-3.5 mr-1" />}
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
