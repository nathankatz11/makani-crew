import { MIN_CREW } from "@/lib/crew";
import { formatDateLong } from "@/lib/dates";
import { RaceNotes } from "./race-notes";
import { RaceOverrideBanner, RaceOverrideControl } from "./race-override";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sailboat, Clock, Wind, Sunset } from "lucide-react";
import type { AvailabilityStatus, RaceNote, RaceOverride } from "@/lib/schema";
import { HeroStatusButtons } from "./hero-status-buttons";

function getCountdown(dateStr: string): string {
  const race = new Date(dateStr + "T18:00:00");
  const now = new Date();
  const diff = race.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diff < 0) return "Race started";
  if (days === 0 && hours <= 3) return "Race tonight!";
  if (days === 0) return `Today — ${hours}h to go`;
  if (days === 1) return "Tomorrow!";
  return `${days} days away`;
}

export interface WeatherData {
  temp: number;
  wind: number;
  windDir: string;
  gusts: number;
  desc: string;
  sunset: string;
}

export function HeroCard({
  date,
  statuses,
  notes,
  sailor,
  weather,
  override,
  raceNumber,
  totalRaces,
  crew,
  label,
}: {
  date: string;
  statuses: Map<string, { status: AvailabilityStatus; role: string | null }>;
  notes: RaceNote[];
  sailor: string;
  weather?: WeatherData | null;
  override?: RaceOverride | null;
  raceNumber?: number;
  totalRaces?: number;
  crew: string[];
  label?: string;
}) {
  const isCancelled =
    override?.status === "cancelled" || override?.status === "no_race";

  const inSailors = [...statuses.entries()].filter(
    ([, v]) => v.status === "in"
  );
  const maybeSailors = [...statuses.entries()].filter(
    ([, v]) => v.status === "maybe"
  );
  const outSailors = [...statuses.entries()].filter(
    ([, v]) => v.status === "out"
  );
  const unknownSailors = crew.filter(
    (name) => !statuses.has(name) || statuses.get(name)!.status === "unknown"
  );

  const inCount = inSailors.length;
  const hasEnough = inCount >= MIN_CREW;
  const countdown = getCountdown(date);

  return (
    <Card
      className={`border-2 ${isCancelled ? "border-red-300 dark:border-red-800 opacity-80" : "border-primary/20"} bg-gradient-to-br from-card to-primary/5`}
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                Next Race
              </p>
              {raceNumber && totalRaces && (
                <span className="text-xs text-muted-foreground">
                  {raceNumber} of {totalRaces}
                </span>
              )}
            </div>
            <CardTitle className="text-xl mt-1">
              {formatDateLong(date)}
            </CardTitle>
            {label && (
              <p className="text-xs text-muted-foreground">{label}</p>
            )}
          </div>
          {!isCancelled && (
            <div className="text-right">
              <Badge
                variant={hasEnough ? "default" : "outline"}
                className={
                  hasEnough
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white text-sm px-3 py-1"
                    : "border-amber-500 text-amber-600 text-sm px-3 py-1"
                }
              >
                {hasEnough ? "GO" : `Need ${MIN_CREW - inCount} more`}
              </Badge>
            </div>
          )}
        </div>

        {override && <RaceOverrideBanner override={override} />}

        {!isCancelled && (
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {countdown}
            </span>
            <span className="flex items-center gap-1">
              <Sailboat className="h-3.5 w-3.5" />
              {inCount} confirmed
              {maybeSailors.length > 0
                ? ` + ${maybeSailors.length} maybe`
                : ""}
            </span>
          </div>
        )}

        {weather && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{weather.desc} &middot; {weather.temp}°F</span>
            <span className="flex items-center gap-1">
              <Wind className="h-3.5 w-3.5" />
              {weather.wind} kts {weather.windDir}
              {weather.gusts > weather.wind
                ? `, gusts ${weather.gusts}`
                : ""}
            </span>
            {weather.sunset && (
              <span className="flex items-center gap-1">
                <Sunset className="h-3.5 w-3.5" />
                Sunset {weather.sunset}
              </span>
            )}
          </div>
        )}

        {/* Season progress bar */}
        {raceNumber && totalRaces && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{
                  width: `${((raceNumber - 1) / totalRaces) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="px-4 py-3 space-y-3">
        {!isCancelled && (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Your status</p>
              <HeroStatusButtons
                raceDate={date}
                sailor={sailor}
                currentStatus={(statuses.get(sailor)?.status ?? "unknown") as AvailabilityStatus}
              />
            </div>

            {inSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Sailing ({inSailors.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {inSailors.map(([name, v]) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    >
                      {name}
                      {v.role ? ` — ${v.role}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {maybeSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                  Maybe ({maybeSailors.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {maybeSailors.map(([name]) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {outSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 dark:text-red-400 mb-1">
                  Out ({outSailors.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {outSailors.map(([name]) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 opacity-60"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {unknownSailors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  No response ({unknownSailors.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unknownSailors.map((name) => (
                    <Badge key={name} variant="outline" className="opacity-50">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {notes.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Notes
              </p>
              <div className="space-y-1">
                {notes.map((n) => (
                  <p key={n.id} className="text-sm">
                    <span className="font-medium">{n.sailorName}:</span>{" "}
                    <span className="text-muted-foreground">{n.note}</span>
                  </p>
                ))}
              </div>
            </div>
          </>
        )}

        <RaceNotes raceDate={date} sailor={sailor} existingNotes={notes} />
        <RaceOverrideControl
          raceDate={date}
          sailor={sailor}
          override={override ?? null}
        />
      </CardContent>
    </Card>
  );
}
