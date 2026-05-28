"use client";

import { useState, useTransition } from "react";
import {
  createEvent,
  deleteEvent,
  updateEvent,
  setEventRsvp,
} from "@/lib/actions";
import { formatDateLong } from "@/lib/dates";
import { EVENT_TYPES } from "@/lib/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Event, EventRsvp, AvailabilityStatus } from "@/lib/schema";

const statusOptions: {
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

function EventForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial?: {
    title: string;
    eventDate: string;
    eventTime: string;
    eventType: string;
    description: string;
  };
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <form action={onSubmit} className="space-y-3">
      <input
        name="title"
        type="text"
        required
        defaultValue={initial?.title ?? ""}
        placeholder="Event name (e.g. Spring boat prep)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="eventDate"
          type="date"
          required
          defaultValue={initial?.eventDate ?? ""}
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <input
          name="eventTime"
          type="text"
          defaultValue={initial?.eventTime ?? ""}
          placeholder="Time (e.g. 10am)"
          className="rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="relative">
        <select
          name="eventType"
          required
          defaultValue={initial?.eventType ?? "prep"}
          className="w-full appearance-none rounded-md border bg-transparent px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      <input
        name="description"
        type="text"
        defaultValue={initial?.description ?? ""}
        placeholder="Details (optional)"
        className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function EventsList({
  events,
  rsvpsByEvent,
  sailor,
}: {
  events: Event[];
  rsvpsByEvent: Record<number, EventRsvp[]>;
  sailor: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate(formData: FormData) {
    const title = formData.get("title") as string;
    const eventDate = formData.get("eventDate") as string;
    const eventTime = (formData.get("eventTime") as string) || null;
    const eventType = formData.get("eventType") as string;
    const description = (formData.get("description") as string) || null;

    startTransition(async () => {
      await createEvent(
        title,
        eventDate,
        eventTime,
        eventType as "prep" | "race" | "practice" | "social" | "other",
        description,
        sailor
      );
      setShowForm(false);
      router.refresh();
    });
  }

  function handleUpdate(eventId: number, formData: FormData) {
    const title = formData.get("title") as string;
    const eventDate = formData.get("eventDate") as string;
    const eventTime = (formData.get("eventTime") as string) || null;
    const eventType = formData.get("eventType") as string;
    const description = (formData.get("description") as string) || null;

    startTransition(async () => {
      await updateEvent(
        eventId,
        title,
        eventDate,
        eventTime,
        eventType as "prep" | "race" | "practice" | "social" | "other",
        description
      );
      setEditingId(null);
      router.refresh();
    });
  }

  function handleRsvp(eventId: number, status: AvailabilityStatus) {
    startTransition(async () => {
      await setEventRsvp(eventId, sailor, status);
      router.refresh();
    });
  }

  function handleDelete(eventId: number) {
    startTransition(async () => {
      await deleteEvent(eventId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {showForm ? (
        <Card>
          <CardContent className="px-4 py-4">
            <p className="text-sm font-medium mb-3">New Event</p>
            <EventForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isPending={isPending}
              submitLabel="Create"
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      )}

      {events.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">No upcoming events</p>
            <p>
              Add boat prep days, practice sessions, or socials for the crew.
            </p>
          </CardContent>
        </Card>
      )}

      {events.map((event) => {
        const typeInfo = EVENT_TYPES.find((t) => t.value === event.eventType);
        const rsvps = rsvpsByEvent[event.id] ?? [];
        const myRsvp = rsvps.find((r) => r.sailorName === sailor);
        const myStatus = (myRsvp?.status ?? "unknown") as AvailabilityStatus;
        const inCount = rsvps.filter((r) => r.status === "in").length;
        const inNames = rsvps
          .filter((r) => r.status === "in")
          .map((r) => r.sailorName);
        const isEditing = editingId === event.id;

        if (isEditing) {
          return (
            <Card key={event.id}>
              <CardContent className="px-4 py-4">
                <p className="text-sm font-medium mb-3">Edit Event</p>
                <EventForm
                  initial={{
                    title: event.title,
                    eventDate: event.eventDate,
                    eventTime: event.eventTime ?? "",
                    eventType: event.eventType,
                    description: event.description ?? "",
                  }}
                  onSubmit={(fd) => handleUpdate(event.id, fd)}
                  onCancel={() => setEditingId(null)}
                  isPending={isPending}
                  submitLabel="Save"
                />
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={event.id}>
            <CardContent className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>{typeInfo?.emoji ?? "📌"}</span>
                    <p className="text-sm font-medium">{event.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateLong(event.eventDate)}
                    {event.eventTime ? ` at ${event.eventTime}` : ""}
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => setEditingId(event.id)}
                    disabled={isPending}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => handleDelete(event.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {statusOptions.map((opt) => (
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
                    onClick={() => handleRsvp(event.id, opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {inCount > 0 && (
                <div className="flex flex-wrap gap-1">
                  {inNames.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-xs py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
