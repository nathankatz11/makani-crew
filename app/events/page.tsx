import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUpcomingEvents, getRsvpsForEvents, getCrewList } from "@/lib/actions";
import { Nav } from "@/components/nav";
import { EventsList } from "./events-list";
import { Anchor } from "lucide-react";
import type { Event, EventRsvp } from "@/lib/schema";

export default async function EventsPage() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  let eventsData: Event[] = [];
  let rsvpsData: EventRsvp[] = [];
  try {
    eventsData = await getUpcomingEvents();
    if (eventsData.length > 0) {
      rsvpsData = await getRsvpsForEvents(eventsData.map((e) => e.id));
    }
  } catch {
    // DB not set up
  }

  // Group RSVPs by event
  const rsvpsByEvent = new Map<number, EventRsvp[]>();
  for (const rsvp of rsvpsData) {
    if (!rsvpsByEvent.has(rsvp.eventId)) rsvpsByEvent.set(rsvp.eventId, []);
    rsvpsByEvent.get(rsvp.eventId)!.push(rsvp);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Events</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Boat prep, practice, socials &amp; more
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <EventsList
          events={eventsData}
          rsvpsByEvent={Object.fromEntries(rsvpsByEvent)}
          sailor={sailor}
        />
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
