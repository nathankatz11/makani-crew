import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllResults, getCrewList, getPastAvailabilityForDates, getPhotosForDates, getOverridesForDates, getNotesForDates, getAllPhotos } from "@/lib/actions";
import { getPastRaceDates } from "@/lib/dates";
import { Nav } from "@/components/nav";
import { ResultsView } from "./results-view";
import { CircleDot } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { RaceResult, RacePhoto, RaceOverride, RaceNote } from "@/lib/schema";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const pastDates = getPastRaceDates();

  let results: RaceResult[] = [];
  let pastAvailability: { sailorName: string; raceDate: string; status: string; role: string | null }[] = [];
  let photos: RacePhoto[] = [];
  let allPhotos: RacePhoto[] = [];
  let overrides: RaceOverride[] = [];
  let notes: RaceNote[] = [];
  try {
    [results, pastAvailability, photos, allPhotos, overrides, notes] = await Promise.all([
      getAllResults(),
      getPastAvailabilityForDates(pastDates),
      getPhotosForDates(pastDates),
      getAllPhotos(),
      getOverridesForDates(pastDates),
      getNotesForDates(pastDates),
    ]);
  } catch {
    // DB not set up
  }

  const notesByDate: Record<string, RaceNote[]> = {};
  for (const note of notes) {
    if (!notesByDate[note.raceDate]) notesByDate[note.raceDate] = [];
    notesByDate[note.raceDate].push(note);
  }

  const availByDate: Record<string, Record<string, string>> = {};
  for (const row of pastAvailability) {
    if (!availByDate[row.raceDate]) availByDate[row.raceDate] = {};
    availByDate[row.raceDate][row.sailorName] = row.status;
  }

  const photosByDate: Record<string, RacePhoto[]> = {};
  for (const photo of photos) {
    if (!photosByDate[photo.raceDate]) photosByDate[photo.raceDate] = [];
    photosByDate[photo.raceDate].push(photo);
  }

  const overridesByDate: Record<string, RaceOverride> = {};
  for (const o of overrides) overridesByDate[o.raceDate] = o;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Results</h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Season record &mdash; Spike Squad
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
        <ResultsView
          results={results}
          crew={crew}
          sailor={sailor}
          availByDate={availByDate}
          photosByDate={photosByDate}
          overridesByDate={overridesByDate}
          notesByDate={notesByDate}
          pastDates={pastDates}
          allPhotos={allPhotos}
        />
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
