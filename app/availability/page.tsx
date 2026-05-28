import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUpcomingWednesdays } from "@/lib/dates";
import {
  getAvailabilityForDates,
  getCrewList,
  getUpcomingEvents,
  getRsvpsForEvents,
} from "@/lib/actions";
import { Nav } from "@/components/nav";
import { StatusTimeline } from "./status-timeline";
import { CaptainManager } from "@/components/captain-manager";
import { Anchor } from "lucide-react";
import type { AvailabilityStatus, Event, EventRsvp } from "@/lib/schema";

const CAPTAINS = ["Steve"];

export default async function AvailabilityPage() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const dates = getUpcomingWednesdays();

  let myStatuses: Record<string, AvailabilityStatus> = {};
  let myRoles: Record<string, string | null> = {};
  let allStatuses: Record<string, Record<string, AvailabilityStatus>> = {};
  let eventsData: Event[] = [];
  let rsvpsData: EventRsvp[] = [];
  try {
    const [all, events] = await Promise.all([
      getAvailabilityForDates(dates),
      getUpcomingEvents(),
    ]);
    eventsData = events;
    if (eventsData.length > 0) {
      rsvpsData = await getRsvpsForEvents(eventsData.map((e) => e.id));
    }
    for (const row of all) {
      if (row.sailorName === sailor) {
        myStatuses[row.raceDate] = row.status as AvailabilityStatus;
        myRoles[row.raceDate] = row.role;
      }
      if (!allStatuses[row.raceDate]) allStatuses[row.raceDate] = {};
      allStatuses[row.raceDate][row.sailorName] =
        row.status as AvailabilityStatus;
    }
  } catch {
    // DB not set up
  }

  const rsvpsByEvent: Record<number, EventRsvp[]> = {};
  for (const rsvp of rsvpsData) {
    if (!rsvpsByEvent[rsvp.eventId]) rsvpsByEvent[rsvp.eventId] = [];
    rsvpsByEvent[rsvp.eventId].push(rsvp);
  }

  const isCaptain = CAPTAINS.includes(sailor);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">My Availability</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tap to set your status &amp; role for each race
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {isCaptain ? (
            <CaptainManager
              dates={dates}
              crew={crew}
              allStatuses={allStatuses}
            />
          ) : (
            <StatusTimeline
              sailor={sailor}
              raceDates={dates}
              initialStatuses={myStatuses}
              initialRoles={myRoles}
              events={eventsData}
              rsvpsByEvent={rsvpsByEvent}
            />
          )}
        </div>
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
