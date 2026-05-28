import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MIN_CREW } from "@/lib/crew";
import {
  getUpcomingWednesdays,
  getRaceDatesOnly,
  getUpcomingFullSchedule,
  getSeasonDateInfo,
  getMostRecentRaceDate,
} from "@/lib/dates";
import {
  getAvailabilityForDates,
  getNotesForDates,
  getOverridesForDates,
  getCrewList,
  getPastAvailabilityForDates,
  getPhotosForDates,
} from "@/lib/actions";
import { Nav } from "@/components/nav";
import { HeroCard } from "@/components/hero-card";
import { ShareButton } from "@/components/share-button";
import { UpcomingWeeks } from "./upcoming-weeks";
import { RecentRaceCard } from "@/components/recent-race-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { getWednesdayWeather } from "@/lib/weather";
import { Anchor } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride, RacePhoto } from "@/lib/schema";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const raceDates = getUpcomingWednesdays();
  const allRaceDates = getRaceDatesOnly();
  const fullSchedule = getUpcomingFullSchedule();
  const recentRaceDate = getMostRecentRaceDate();

  const allUpcomingDates = fullSchedule.map((d) => d.date);
  const recentDates = recentRaceDate ? [recentRaceDate] : [];

  let availabilityData: { sailorName: string; raceDate: string; status: string; role: string | null }[] = [];
  let notesData: RaceNote[] = [];
  let overridesData: RaceOverride[] = [];
  let recentAvailability: { sailorName: string; raceDate: string; status: string; role: string | null }[] = [];
  let recentPhotos: RacePhoto[] = [];

  try {
    [availabilityData, notesData, overridesData, recentAvailability, recentPhotos] = await Promise.all([
      getAvailabilityForDates(allUpcomingDates),
      getNotesForDates(allUpcomingDates),
      getOverridesForDates(allUpcomingDates),
      recentDates.length > 0 ? getPastAvailabilityForDates(recentDates) : Promise.resolve([]),
      recentDates.length > 0 ? getPhotosForDates(recentDates) : Promise.resolve([]),
    ]);
  } catch {
    // DB not set up yet
  }

  // Build lookups
  const lookup = new Map<string, Map<string, { status: AvailabilityStatus; role: string | null }>>();
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
  for (const o of overridesData) overridesByDate.set(o.raceDate, o);

  // Recent race data
  const recentStatusMap: Record<string, { status: AvailabilityStatus; role: string | null }> = {};
  for (const row of recentAvailability) {
    recentStatusMap[row.sailorName] = { status: row.status as AvailabilityStatus, role: row.role };
  }

  // Hero card — next race
  const nextRaceDate = raceDates[0];
  const nextRaceStatuses =
    lookup.get(nextRaceDate) ?? new Map<string, { status: AvailabilityStatus; role: string | null }>();
  const raceIndex = allRaceDates.indexOf(nextRaceDate);
  const raceNumber = raceIndex >= 0 ? raceIndex + 1 : undefined;
  const totalRaces = allRaceDates.length;
  const nextRaceInfo = getSeasonDateInfo(nextRaceDate);

  let weather: Awaited<ReturnType<typeof getWednesdayWeather>> = null;
  try {
    weather = await getWednesdayWeather(nextRaceDate);
  } catch {}

  const timelineEntries = fullSchedule
    .filter((d) => d.date !== nextRaceDate)
    .map((entry) => {
      const dateStatuses = lookup.get(entry.date) ?? new Map();
      const override = overridesByDate.get(entry.date);
      const dateNotes = notesByDate.get(entry.date) ?? [];
      const statusEntries: Record<string, { status: AvailabilityStatus; role: string | null }> = {};
      for (const [name, val] of dateStatuses) statusEntries[name] = val;
      return {
        date: entry.date,
        label: entry.label,
        isRace: entry.isRace,
        statuses: statusEntries,
        override: override ?? null,
        notes: dateNotes,
      };
    });

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
          {/* Last race (if one exists) */}
          {recentRaceDate && (
            <RecentRaceCard
              date={recentRaceDate}
              statuses={recentStatusMap}
              photos={recentPhotos}
              sailor={sailor}
              crew={crew}
            />
          )}

          {/* Next race hero */}
          {nextRaceDate && (
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
          )}

          {timelineEntries.length > 0 && (
            <UpcomingWeeks weeks={timelineEntries} sailor={sailor} crew={crew} />
          )}
        </div>
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
