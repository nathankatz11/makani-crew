import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MIN_CREW } from "@/lib/crew";
import {
  getUpcomingWednesdays,
  getRaceDatesOnly,
  getUpcomingFullSchedule,
  getSeasonDateInfo,
  formatDateLong,
} from "@/lib/dates";
import {
  getAvailabilityForDates,
  getNotesForDates,
  getOverridesForDates,
  getCrewList,
  getUpcomingEvents,
  getRsvpsForEvents,
} from "@/lib/actions";
import { Nav } from "@/components/nav";
import { HeroCard } from "@/components/hero-card";
import { ShareButton } from "@/components/share-button";
import { UpcomingWeeks } from "./upcoming-weeks";
import { ThemeToggle } from "@/components/theme-toggle";
import { getWednesdayWeather } from "@/lib/weather";
import { EVENT_TYPES } from "@/lib/schema";
import { Anchor } from "lucide-react";
import type {
  AvailabilityStatus,
  RaceNote,
  RaceOverride,
  Event,
  EventRsvp,
} from "@/lib/schema";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const raceDates = getUpcomingWednesdays();
  const allRaceDates = getRaceDatesOnly();
  const fullSchedule = getUpcomingFullSchedule();

  const allUpcomingDates = fullSchedule.map((d) => d.date);

  let availabilityData: {
    sailorName: string;
    raceDate: string;
    status: string;
    role: string | null;
  }[] = [];
  let notesData: RaceNote[] = [];
  let overridesData: RaceOverride[] = [];
  let eventsData: Event[] = [];
  let rsvpsData: EventRsvp[] = [];
  try {
    [availabilityData, notesData, overridesData, eventsData] =
      await Promise.all([
        getAvailabilityForDates(allUpcomingDates),
        getNotesForDates(allUpcomingDates),
        getOverridesForDates(allUpcomingDates),
        getUpcomingEvents(),
      ]);
    if (eventsData.length > 0) {
      rsvpsData = await getRsvpsForEvents(eventsData.map((e) => e.id));
    }
  } catch {
    // DB not set up yet
  }

  // Build lookups
  const lookup = new Map<
    string,
    Map<string, { status: AvailabilityStatus; role: string | null }>
  >();
  for (const row of availabilityData) {
    if (!lookup.has(row.raceDate)) lookup.set(row.raceDate, new Map());
    lookup.get(row.raceDate)!.set(row.sailorName, {
      status: row.status as AvailabilityStatus,
      role: row.role,
    });
  }

  const notesByDate = new Map<string, RaceNote[]>();
  for (const note of notesData) {
    if (!notesByDate.has(note.raceDate)) notesByDate.set(note.raceDate, []);
    notesByDate.get(note.raceDate)!.push(note);
  }

  const overridesByDate = new Map<string, RaceOverride>();
  for (const o of overridesData) {
    overridesByDate.set(o.raceDate, o);
  }

  // Build custom events by date
  const rsvpsByEvent = new Map<number, EventRsvp[]>();
  for (const rsvp of rsvpsData) {
    if (!rsvpsByEvent.has(rsvp.eventId))
      rsvpsByEvent.set(rsvp.eventId, []);
    rsvpsByEvent.get(rsvp.eventId)!.push(rsvp);
  }

  const customEventsByDate = new Map<
    string,
    {
      title: string;
      type: string;
      emoji: string;
      rsvps: Record<string, string>;
    }[]
  >();
  for (const event of eventsData) {
    if (!customEventsByDate.has(event.eventDate))
      customEventsByDate.set(event.eventDate, []);
    const rsvps = rsvpsByEvent.get(event.id) ?? [];
    const typeInfo = EVENT_TYPES.find((t) => t.value === event.eventType);
    const rsvpMap: Record<string, string> = {};
    for (const r of rsvps) rsvpMap[r.sailorName] = r.status;
    customEventsByDate.get(event.eventDate)!.push({
      title: event.title,
      type: event.eventType,
      emoji: typeInfo?.emoji ?? "📌",
      rsvps: rsvpMap,
    });
  }

  // Hero card — next race
  const nextRaceDate = raceDates[0];
  const nextRaceStatuses =
    lookup.get(nextRaceDate) ??
    new Map<string, { status: AvailabilityStatus; role: string | null }>();
  const raceIndex = allRaceDates.indexOf(nextRaceDate);
  const raceNumber = raceIndex >= 0 ? raceIndex + 1 : undefined;
  const totalRaces = allRaceDates.length;
  const nextRaceInfo = getSeasonDateInfo(nextRaceDate);

  let weather: Awaited<ReturnType<typeof getWednesdayWeather>> = null;
  try {
    weather = await getWednesdayWeather(nextRaceDate);
  } catch {}

  // Merge schedule + custom events into unified timeline
  // Start with the season schedule entries (after hero)
  const timelineEntries = fullSchedule
    .filter((d) => d.date !== nextRaceDate)
    .map((entry) => {
      const dateStatuses = lookup.get(entry.date) ?? new Map();
      const override = overridesByDate.get(entry.date);
      const dateNotes = notesByDate.get(entry.date) ?? [];
      const statusEntries: Record<
        string,
        { status: AvailabilityStatus; role: string | null }
      > = {};
      for (const [name, val] of dateStatuses) {
        statusEntries[name] = val;
      }
      return {
        date: entry.date,
        label: entry.label,
        isRace: entry.isRace,
        isCustomEvent: false,
        statuses: statusEntries,
        override: override ?? null,
        notes: dateNotes,
        customEvents: customEventsByDate.get(entry.date) ?? [],
      };
    });

  // Add custom events that fall on non-schedule days
  const scheduleDateSet = new Set(fullSchedule.map((d) => d.date));
  for (const [eventDate, events] of customEventsByDate) {
    if (!scheduleDateSet.has(eventDate) && eventDate !== nextRaceDate) {
      timelineEntries.push({
        date: eventDate,
        label: events.map((e) => `${e.emoji} ${e.title}`).join(", "),
        isRace: false,
        isCustomEvent: true,
        statuses: {},
        override: null,
        notes: [],
        customEvents: events,
      });
    }
  }

  // Sort by date
  timelineEntries.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Makani u&#x2019;i</h1>
          </div>
          <div className="flex items-center gap-1">
            <ShareButton
              date={nextRaceDate}
              statuses={nextRaceStatuses}
              override={overridesByDate.get(nextRaceDate) ?? null}
              crew={crew}
            />
            <ThemeToggle />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Wed nights &middot; DuSable Harbor, Chicago
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-3">
          <HeroCard
            date={nextRaceDate}
            statuses={nextRaceStatuses}
            notes={notesByDate.get(nextRaceDate) ?? []}
            sailor={sailor}
            weather={weather}
            override={overridesByDate.get(nextRaceDate)}
            raceNumber={raceNumber}
            totalRaces={totalRaces}
            crew={crew}
            label={nextRaceInfo?.label}
          />

          {timelineEntries.length > 0 && (
            <UpcomingWeeks
              weeks={timelineEntries}
              sailor={sailor}
              crew={crew}
            />
          )}
        </div>
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
