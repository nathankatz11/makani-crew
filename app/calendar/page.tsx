import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllSeasonDates } from "@/lib/dates";
import {
  getAvailabilityForDates,
  getOverridesForDates,
  getUpcomingEvents,
  getRsvpsForEvents,
  getCrewList,
} from "@/lib/actions";
import { Nav } from "@/components/nav";
import { CalendarView } from "./calendar-view";
import { Anchor } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AvailabilityStatus, RaceOverride, Event, EventRsvp } from "@/lib/schema";

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const allDates = getAllSeasonDates();

  let availabilityData: {
    sailorName: string;
    raceDate: string;
    status: string;
    role: string | null;
  }[] = [];
  let overridesData: RaceOverride[] = [];
  let eventsData: Event[] = [];
  let rsvpsData: EventRsvp[] = [];

  try {
    [availabilityData, overridesData, eventsData] = await Promise.all([
      getAvailabilityForDates(allDates),
      getOverridesForDates(allDates),
      getUpcomingEvents(),
    ]);
    if (eventsData.length > 0) {
      rsvpsData = await getRsvpsForEvents(eventsData.map((e) => e.id));
    }
  } catch {
    // DB not set up
  }

  // Build full availability map: date -> sailor -> status
  const availMap: Record<string, Record<string, AvailabilityStatus>> = {};
  for (const row of availabilityData) {
    if (!availMap[row.raceDate]) availMap[row.raceDate] = {};
    availMap[row.raceDate][row.sailorName] = row.status as AvailabilityStatus;
  }

  // Overrides map
  const overridesMap: Record<string, { status: string; reason: string | null }> = {};
  for (const o of overridesData) {
    overridesMap[o.raceDate] = { status: o.status, reason: o.reason };
  }

  // Events by date
  const eventsByDate: Record<string, { title: string; type: string; inCount: number }[]> = {};
  for (const event of eventsData) {
    if (!eventsByDate[event.eventDate]) eventsByDate[event.eventDate] = [];
    const inCount = rsvpsData.filter(
      (r) => r.eventId === event.id && r.status === "in"
    ).length;
    eventsByDate[event.eventDate].push({
      title: event.title,
      type: event.eventType,
      inCount,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Calendar</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Season overview &middot; May &ndash; Oct 2026
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <CalendarView
          sailor={sailor}
          crew={crew}
          raceDates={allDates}
          availMap={availMap}
          overridesMap={overridesMap}
          eventsByDate={eventsByDate}
        />
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
