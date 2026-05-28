"use client";

import { useTransition, useState } from "react";
import {
  setAvailability,
  setBulkAvailability,
  setRole,
  setEventRsvp,
} from "@/lib/actions";
import { formatDateLong, getSeasonDateInfo } from "@/lib/dates";
import { EVENT_TYPES, ROLES } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AvailabilityStatus, Event, EventRsvp } from "@/lib/schema";

const raceOptions: {
  value: AvailabilityStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "in",
    label: "I'm In",
    activeClass:
      "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
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

type TimelineItem =
  | { type: "race"; date: string; label: string }
  | { type: "event"; event: Event };

export function StatusTimeline({
  sailor,
  raceDates,
  initialStatuses,
  initialRoles,
  events,
  rsvpsByEvent,
}: {
  sailor: string;
  raceDates: string[];
  initialStatuses: Record<string, AvailabilityStatus>;
  initialRoles: Record<string, string | null>;
  events: Event[];
  rsvpsByEvent: Record<number, EventRsvp[]>;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [roles, setRoles] = useState(initialRoles);
  const [eventRsvps, setEventRsvps] = useState<
    Record<number, AvailabilityStatus>
  >(() => {
    const map: Record<number, AvailabilityStatus> = {};
    for (const event of events) {
      const my = (rsvpsByEvent[event.id] ?? []).find(
        (r) => r.sailorName === sailor
      );
      if (my) map[event.id] = my.status as AvailabilityStatus;
    }
    return map;
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Build merged timeline sorted by date
  const timeline: TimelineItem[] = [];
  for (const date of raceDates) {
    const info = getSeasonDateInfo(date);
    timeline.push({ type: "race", date, label: info?.label ?? "" });
  }
  for (const event of events) {
    timeline.push({ type: "event", event });
  }
  timeline.sort((a, b) => {
    const dateA = a.type === "race" ? a.date : a.event.eventDate;
    const dateB = b.type === "race" ? b.date : b.event.eventDate;
    return dateA.localeCompare(dateB);
  });

  function handleToggle(date: string, status: AvailabilityStatus) {
    const newStatus = statuses[date] === status ? "unknown" : status;
    setStatuses((prev) => ({ ...prev, [date]: newStatus }));
    startTransition(async () => {
      await setAvailability(sailor, date, newStatus);
      router.refresh();
    });
  }

  function handleBulk(status: AvailabilityStatus) {
    const unsetDates = raceDates.filter(
      (d) => !statuses[d] || statuses[d] === "unknown"
    );
    const targetDates = unsetDates.length > 0 ? unsetDates : raceDates;
    const updated = { ...statuses };
    for (const d of targetDates) updated[d] = status;
    setStatuses(updated);
    startTransition(async () => {
      await setBulkAvailability(sailor, targetDates, status);
      router.refresh();
    });
  }

  function handleRoleChange(date: string, role: string) {
    const newRole = role === "" ? null : role;
    setRoles((prev) => ({ ...prev, [date]: newRole }));
    startTransition(async () => {
      await setRole(sailor, date, newRole);
      router.refresh();
    });
  }

  function handleEventRsvp(eventId: number, status: AvailabilityStatus) {
    const newStatus = eventRsvps[eventId] === status ? "unknown" : status;
    setEventRsvps((prev) => ({ ...prev, [eventId]: newStatus }));
    startTransition(async () => {
      await setEventRsvp(eventId, sailor, newStatus);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Bulk actions */}
      <Card className="col-span-full">
        <CardContent className="px-4 py-3">
          <p className="text-sm font-medium mb-2">
            Quick set all unanswered races
          </p>
          <div className="flex gap-2">
            {raceOptions.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                disabled={isPending}
                className="text-muted-foreground"
                onClick={() => handleBulk(opt.value)}
              >
                All {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {timeline.map((item) => {
        if (item.type === "race") {
          const current = statuses[item.date] ?? "unknown";
          const currentRole = roles[item.date] ?? "";
          return (
            <Card key={`race-${item.date}`}>
              <CardContent className="px-4 py-3">
                <p className="text-sm font-medium">
                  {formatDateLong(item.date)}
                </p>
                {item.label && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.label}
                  </p>
                )}
                {!item.label && <div className="mb-2" />}
                <div className="flex gap-2">
                  {raceOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className={
                        current === opt.value
                          ? opt.activeClass
                          : "text-muted-foreground"
                      }
                      onClick={() => handleToggle(item.date, opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {current === "in" && (
                  <div className="mt-2 relative">
                    <select
                      value={currentRole}
                      onChange={(e) =>
                        handleRoleChange(item.date, e.target.value)
                      }
                      className="w-full appearance-none rounded-md border bg-transparent px-3 py-1.5 pr-8 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">No role assigned</option>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }

        // Custom event card
        const event = item.event;
        const typeInfo = EVENT_TYPES.find(
          (t) => t.value === event.eventType
        );
        const myStatus = eventRsvps[event.id] ?? "unknown";
        const rsvps = rsvpsByEvent[event.id] ?? [];
        const inCount = rsvps.filter((r) => r.status === "in").length;

        return (
          <Card
            key={`event-${event.id}`}
            className="border-dashed"
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-sm font-medium">
                    {typeInfo?.emoji ?? "📌"} {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateLong(event.eventDate)}
                    {event.eventTime ? ` at ${event.eventTime}` : ""}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.description}
                    </p>
                  )}
                </div>
                {inCount > 0 && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {inCount} going
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {raceOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    className={
                      myStatus === opt.value
                        ? opt.activeClass
                        : "text-muted-foreground"
                    }
                    onClick={() => handleEventRsvp(event.id, opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
