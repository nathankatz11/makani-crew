import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllResults, getCrewList, getPastAvailabilityForDates, getPhotosForDates, getOverridesForDates } from "@/lib/actions";
import { getPastRaceDates } from "@/lib/dates";
import { Nav } from "@/components/nav";
import { ResultsView } from "./results-view";
import { Anchor } from "lucide-react";
import type { RaceResult, RacePhoto, RaceOverride } from "@/lib/schema";

export default async function ResultsPage() {
  const cookieStore = await cookies();
  const sailor = cookieStore.get("sailor")?.value;
  if (!sailor) redirect("/");

  const crew = await getCrewList();
  const pastDates = getPastRaceDates();

  let results: RaceResult[] = [];
  let pastAvailability: { sailorName: string; raceDate: string; status: string; role: string | null }[] = [];
  let photos: RacePhoto[] = [];
  let overrides: RaceOverride[] = [];
  try {
    [results, pastAvailability, photos, overrides] = await Promise.all([
      getAllResults(),
      getPastAvailabilityForDates(pastDates),
      getPhotosForDates(pastDates),
      getOverridesForDates(pastDates),
    ]);
  } catch {
    // DB not set up
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
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Race Results</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Season record for Makani u&#x2019;i
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <ResultsView
          results={results}
          crew={crew}
          sailor={sailor}
          availByDate={availByDate}
          photosByDate={photosByDate}
          overridesByDate={overridesByDate}
        />
      </main>

      <Nav sailor={sailor} crew={crew} />
    </div>
  );
}
